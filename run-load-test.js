import { generateHtmlReport } from './load-test-report.js';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { exec } from 'child_process';

// Configuration - Customize these values
const CONFIG = {
  targetUrl: 'http://shuttlementor.com',
  concurrentUsers: 1000,  // Number of concurrent users
  testDurationSeconds: 60,  // Duration of the test in seconds
  resultsFile: 'load-test-results.json',
  reportFile: 'load-test-report.html',
  openBrowserAfterTest: true,
  requestTimeout: 10000,  // 10 second timeout for each request
  useRampUp: true,       // Whether to gradually ramp up connections
  rampUpSteps: 10,        // Number of steps to use for ramping up
  trackingIntervalSeconds: 5  // Interval for tracking requests (in seconds)
};

/**
 * @typedef {Object} Metrics
 * @property {number} totalRequests - Total number of requests made
 * @property {number} successfulRequests - Number of successful requests
 * @property {number} failedRequests - Number of failed requests
 * @property {number[]} latencies - Array of request latencies in ms
 * @property {number|null} startTime - Test start time
 * @property {number|null} endTime - Test end time
 * @property {number} requestsPerSecond - Requests per second
 * @property {number} avgLatency - Average latency in ms
 * @property {number} maxLatency - Maximum latency in ms
 * @property {number} minLatency - Minimum latency in ms
 * @property {number} p95Latency - 95th percentile latency
 * @property {number} p99Latency - 99th percentile latency
 * @property {string} targetUrl - The URL that was tested
 * @property {number} concurrentUsers - Number of concurrent users
 * @property {Object.<string, number>} requestsPerInterval - Requests completed in each time interval
 * @property {boolean} useRampUp - Whether gradual ramp-up was used
 * @property {number} rampUpSteps - Number of steps used in ramp-up
 */

/** @type {Metrics} */
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  latencies: [],
  startTime: null,
  endTime: null,
  requestsPerSecond: 0,
  avgLatency: 0,
  maxLatency: 0,
  minLatency: Infinity,
  p95Latency: 0,
  p99Latency: 0,
  targetUrl: CONFIG.targetUrl,
  concurrentUsers: CONFIG.concurrentUsers,
  requestsPerInterval: {},
  useRampUp: CONFIG.useRampUp,
  rampUpSteps: CONFIG.rampUpSteps
};

// For tracking requests per interval
let lastIntervalTimestamp = 0;
let currentIntervalRequests = 0;

/**
 * Makes a single HTTP/HTTPS request and measures latency
 * @returns {Promise<void>}
 */
function makeRequest() {
  const startTime = performance.now();
  
  return new Promise((/** @type {() => void} */ resolve) => {
    // Parse the URL to determine the protocol
    const url = new URL(CONFIG.targetUrl);
    const isHttps = url.protocol === 'https:';
    
    // Choose the appropriate module based on protocol
    const requestModule = isHttps ? https : http;
    
    const req = requestModule.get(CONFIG.targetUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        // This is the actual request latency
        const latency = endTime - startTime;
        
        metrics.totalRequests++;
        metrics.successfulRequests++;
        metrics.latencies.push(latency);
        
        // Track requests per interval
        trackRequestInInterval();
        
        if (latency > metrics.maxLatency) {
          metrics.maxLatency = latency;
        }
        
        if (latency < metrics.minLatency) {
          metrics.minLatency = latency;
        }
        
        // Log progress every 10 requests
        if (metrics.totalRequests % 10 === 0) {
          process.stdout.write(`\rCompleted ${metrics.totalRequests} requests. Latest latency: ${latency.toFixed(2)}ms`);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      const endTime = performance.now();
      
      metrics.totalRequests++;
      metrics.failedRequests++;
      // Don't include failed request latencies in the statistics
      // as they can skew the results with timeout values
      
      console.error(`\nRequest failed: ${error.message}`);
      resolve();
    });
    
    // Set a timeout to avoid hanging on slow connections
    req.setTimeout(CONFIG.requestTimeout, () => {
      req.destroy();
      metrics.totalRequests++;
      metrics.failedRequests++;
      console.error(`\nRequest timed out after ${CONFIG.requestTimeout/1000} seconds`);
      resolve();
    });
    
    req.end();
  });
}

/**
 * Track a request in the current time interval
 */
function trackRequestInInterval() {
  // Only track if the test has started
  if (metrics.startTime === null) return;
  
  const now = Math.floor((performance.now() - metrics.startTime) / 1000);
  const intervalKey = String(Math.floor(now / CONFIG.trackingIntervalSeconds) * CONFIG.trackingIntervalSeconds);
  
  // Initialize the interval if it doesn't exist
  if (!metrics.requestsPerInterval[intervalKey]) {
    metrics.requestsPerInterval[intervalKey] = 0;
  }
  
  // Increment the request count for this interval
  metrics.requestsPerInterval[intervalKey]++;
  currentIntervalRequests++;
}

/**
 * Run all users with gradual ramp-up if configured
 * @returns {Promise<void>}
 */
async function runConcurrentUsers() {
  if (CONFIG.useRampUp) {
    return runWithRampUp();
  } else {
    return runAllUsersAtOnce();
  }
}

/**
 * Run all users at once (original behavior)
 * @returns {Promise<void>}
 */
async function runAllUsersAtOnce() {
  const userPromises = [];
  
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    userPromises.push(runUser(i));
  }
  
  await Promise.all(userPromises);
}

/**
 * Run users with gradual ramp-up
 * @returns {Promise<void>}
 */
async function runWithRampUp() {
  const usersPerStep = Math.ceil(CONFIG.concurrentUsers / CONFIG.rampUpSteps);
  const stepDuration = CONFIG.testDurationSeconds / CONFIG.rampUpSteps;
  
  console.log(`Ramping up ${CONFIG.concurrentUsers} users over ${CONFIG.rampUpSteps} steps`);
  console.log(`Each step adds ~${usersPerStep} users and lasts ${stepDuration.toFixed(1)} seconds`);
  
  const allUserPromises = [];
  
  // Launch users in batches
  for (let step = 0; step < CONFIG.rampUpSteps; step++) {
    const startUser = step * usersPerStep;
    const endUser = Math.min((step + 1) * usersPerStep, CONFIG.concurrentUsers);
    const usersInThisStep = endUser - startUser;
    
    console.log(`\nStep ${step + 1}/${CONFIG.rampUpSteps}: Starting ${usersInThisStep} users (${startUser}-${endUser-1})`);
    
    // Launch this batch of users
    for (let i = startUser; i < endUser; i++) {
      allUserPromises.push(runUser(i));
    }
    
    // Wait before launching the next batch (except for the last batch)
    if (step < CONFIG.rampUpSteps - 1) {
      await new Promise(resolve => setTimeout(resolve, stepDuration * 1000));
    }
  }
  
  // Wait for all users to complete their work
  await Promise.all(allUserPromises);
}

/**
 * Simulate a single user making repeated requests
 * @param {number} userId - The ID of the simulated user
 * @returns {Promise<void>}
 */
async function runUser(userId) {
  // Calculate end time based on when this user started, not the overall test start
  // This ensures each user runs for exactly the configured duration
  const userStartTime = Date.now();
  const endTime = userStartTime + (CONFIG.testDurationSeconds * 1000);
  
  while (Date.now() < endTime) {
    await makeRequest();
  }
}

/**
 * Calculate statistics
 */
function calculateStatistics() {
  if (metrics.latencies.length === 0 || metrics.startTime === null || metrics.endTime === null) {
    console.error('No metrics collected or test did not complete properly');
    return;
  }
  
  // Sort latencies for percentile calculations
  const sortedLatencies = [...metrics.latencies].sort((a, b) => a - b);
  
  // Calculate average latency only from successful requests
  if (metrics.latencies.length > 0) {
    metrics.avgLatency = metrics.latencies.reduce((sum, latency) => sum + latency, 0) / metrics.latencies.length;
  } else {
    metrics.avgLatency = 0;
  }
  
  // Handle edge cases for percentiles
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const p99Index = Math.floor(sortedLatencies.length * 0.99);
  
  // Ensure we have valid indices and values
  if (p95Index >= 0 && p95Index < sortedLatencies.length) {
    // TypeScript safe assignment
    const p95Value = sortedLatencies[p95Index];
    if (typeof p95Value === 'number') {
      metrics.p95Latency = p95Value;
    }
  } else {
    metrics.p95Latency = 0;
  }
  
  if (p99Index >= 0 && p99Index < sortedLatencies.length) {
    // TypeScript safe assignment
    const p99Value = sortedLatencies[p99Index];
    if (typeof p99Value === 'number') {
      metrics.p99Latency = p99Value;
    }
  } else {
    metrics.p99Latency = 0;
  }
  
  // Calculate actual test duration
  const durationSeconds = (metrics.endTime - metrics.startTime) / 1000;
  
  // Calculate requests per second based on total duration
  metrics.requestsPerSecond = metrics.totalRequests / durationSeconds;
}

/**
 * Print results to console
 */
function printResults() {
  if (metrics.startTime === null || metrics.endTime === null) {
    console.error('Test did not complete properly');
    return;
  }
  
  console.log('\n\n=== Load Test Results ===');
  console.log(`Target URL: ${CONFIG.targetUrl}`);
  console.log(`Test Duration: ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)} seconds`);
  console.log(`Concurrent Users: ${CONFIG.concurrentUsers}`);
  console.log(`Ramp-up Mode: ${CONFIG.useRampUp ? 'Gradual' : 'All at once'}`);
  if (CONFIG.useRampUp) {
    console.log(`Ramp-up Steps: ${CONFIG.rampUpSteps}`);
  }
  console.log(`Total Requests: ${metrics.totalRequests}`);
  console.log(`Successful Requests: ${metrics.successfulRequests}`);
  console.log(`Failed Requests: ${metrics.failedRequests}`);
  console.log(`Requests Per Second: ${metrics.requestsPerSecond.toFixed(2)}`);
  
  // Only show latency metrics if we have successful requests
  if (metrics.successfulRequests > 0) {
    console.log(`Average Latency: ${metrics.avgLatency.toFixed(2)} ms`);
    console.log(`Minimum Latency: ${metrics.minLatency !== Infinity ? metrics.minLatency.toFixed(2) : 'N/A'} ms`);
    console.log(`Maximum Latency: ${metrics.maxLatency.toFixed(2)} ms`);
    console.log(`95th Percentile Latency: ${metrics.p95Latency.toFixed(2)} ms`);
    console.log(`99th Percentile Latency: ${metrics.p99Latency.toFixed(2)} ms`);
  } else {
    console.log('No successful requests to calculate latency metrics');
  }
  
  // Print requests per interval
  console.log('\n=== Requests Per Time Interval ===');
  const intervals = Object.keys(metrics.requestsPerInterval).sort((a, b) => parseInt(a) - parseInt(b));
  
  if (intervals.length > 0) {
    console.log(`Interval Size: ${CONFIG.trackingIntervalSeconds} seconds`);
    console.log('Time (s) | Requests | Req/s');
    console.log('--------------------------');
    
    intervals.forEach(interval => {
      const requests = metrics.requestsPerInterval[interval] || 0;
      const reqPerSec = (requests / CONFIG.trackingIntervalSeconds).toFixed(2);
      console.log(`${interval.padStart(8, ' ')}s | ${String(requests).padStart(8, ' ')} | ${reqPerSec}`);
    });
  } else {
    console.log('No interval data collected');
  }
}

/**
 * Save results to file
 */
function saveResults() {
  fs.writeFileSync(CONFIG.resultsFile, JSON.stringify(metrics, null, 2));
  console.log(`\nResults saved to ${CONFIG.resultsFile}`);
}

/**
 * Open the HTML report in the default browser
 */
function openBrowser() {
  const command = process.platform === 'darwin' 
    ? `open "${CONFIG.reportFile}"` 
    : process.platform === 'win32' 
      ? `start "${CONFIG.reportFile}"` 
      : `xdg-open "${CONFIG.reportFile}"`;
  
  exec(command, (error) => {
    if (error) {
      console.error(`Error opening browser: ${error.message}`);
    }
  });
}

/**
 * Main function to run the load test
 */
async function runLoadTest() {
  console.log(`Starting load test against ${CONFIG.targetUrl}`);
  console.log(`Running with ${CONFIG.concurrentUsers} concurrent users for ${CONFIG.testDurationSeconds} seconds`);
  if (CONFIG.useRampUp) {
    console.log(`Using gradual ramp-up with ${CONFIG.rampUpSteps} steps`);
  } else {
    console.log(`Starting all users simultaneously`);
  }
  console.log(`Tracking requests in ${CONFIG.trackingIntervalSeconds}-second intervals`);
  console.log('Press Ctrl+C to abort the test\n');
  
  // Start the interval tracking
  lastIntervalTimestamp = performance.now();
  const trackingIntervalId = setInterval(() => {
    const now = performance.now();
    // Only calculate if the test has started
    if (metrics.startTime === null) return;

    const elapsedSeconds = Math.floor((now - metrics.startTime) / 1000);
    const intervalKey = String(Math.floor(elapsedSeconds / CONFIG.trackingIntervalSeconds) * CONFIG.trackingIntervalSeconds);

    // Store the current interval's requests if not already tracked
    if (!metrics.requestsPerInterval[intervalKey]) {
      metrics.requestsPerInterval[intervalKey] = 0;
    }

    // Add any new requests to this interval
    const currentValue = metrics.requestsPerInterval[intervalKey] || 0;
    metrics.requestsPerInterval[intervalKey] = currentValue + currentIntervalRequests;

    // Log progress with requests in this interval
    process.stdout.write(`\rTime: ${elapsedSeconds}s | Requests in last interval: ${currentIntervalRequests}`);

    // Reset for next interval
    currentIntervalRequests = 0;
    lastIntervalTimestamp = now;
  }, CONFIG.trackingIntervalSeconds * 1000);
  
  metrics.startTime = performance.now();
  
  try {
    await runConcurrentUsers();
    metrics.endTime = performance.now();
    
    // Stop the interval tracking
    clearInterval(trackingIntervalId);
    
    calculateStatistics();
    printResults();
    saveResults();
    
    // Generate HTML report
    console.log(`\nGenerating HTML report...`);
    generateHtmlReport(CONFIG.resultsFile, CONFIG.reportFile);
    
    if (CONFIG.openBrowserAfterTest) {
      console.log(`Opening report in browser...`);
      openBrowser();
    }
    
    return metrics;
  } catch (error) {
    // Stop the interval tracking
    clearInterval(trackingIntervalId);
    
    console.error('Error during load test:', error);
    metrics.endTime = performance.now();
    return metrics;
  }
}

// Run the load test
runLoadTest();
