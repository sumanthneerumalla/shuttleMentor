import https from "https";
import fs from "fs";

// Configuration
const TARGET_URL = "https://shuttlementor.com";
const CONCURRENT_USERS = 10; // Number of concurrent users/connections
const TEST_DURATION_SECONDS = 30; // Duration of the test in seconds
const RESULTS_FILE = "load-test-results.json";

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
 * @property {string} [targetUrl] - The URL that was tested
 * @property {number} [concurrentUsers] - Number of concurrent users
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
	targetUrl: TARGET_URL,
	concurrentUsers: CONCURRENT_USERS,
};

/**
 * Makes a single HTTP request and measures latency
 * @returns {Promise<void>}
 */
function makeRequest() {
	const startTime = performance.now();

	return new Promise((/** @type {() => void} */ resolve) => {
		const req = https.get(TARGET_URL, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				const endTime = performance.now();
				const latency = endTime - startTime;

				metrics.totalRequests++;
				metrics.successfulRequests++;
				metrics.latencies.push(latency);

				if (latency > metrics.maxLatency) {
					metrics.maxLatency = latency;
				}

				if (latency < metrics.minLatency) {
					metrics.minLatency = latency;
				}

				// Log progress every 10 requests
				if (metrics.totalRequests % 10 === 0) {
					console.log(
						`Completed ${metrics.totalRequests} requests. Latest latency: ${latency.toFixed(2)}ms`,
					);
				}

				resolve();
			});
		});

		req.on("error", (error) => {
			const endTime = performance.now();
			const latency = endTime - startTime;

			metrics.totalRequests++;
			metrics.failedRequests++;
			metrics.latencies.push(latency);

			console.error(`Request failed: ${error.message}`);
			resolve();
		});

		req.end();
	});
}

// Function to run concurrent users
async function runConcurrentUsers() {
	const userPromises = [];

	for (let i = 0; i < CONCURRENT_USERS; i++) {
		userPromises.push(runUser(i));
	}

	await Promise.all(userPromises);
}

// Function to simulate a single user making repeated requests
/**
 * @param {number} userId - The ID of the simulated user
 * @returns {Promise<void>}
 */
async function runUser(userId) {
	const endTime = Date.now() + TEST_DURATION_SECONDS * 1000;

	while (Date.now() < endTime) {
		await makeRequest();
	}
}

// Calculate statistics
function calculateStatistics() {
	if (
		metrics.latencies.length === 0 ||
		metrics.startTime === null ||
		metrics.endTime === null
	) {
		console.error("No metrics collected or test did not complete properly");
		return;
	}

	// Sort latencies for percentile calculations
	const sortedLatencies = [...metrics.latencies].sort((a, b) => a - b);

	metrics.avgLatency =
		metrics.latencies.reduce((sum, latency) => sum + latency, 0) /
		metrics.latencies.length;

	// Handle edge cases for percentiles
	const p95Index = Math.floor(sortedLatencies.length * 0.95);
	const p99Index = Math.floor(sortedLatencies.length * 0.99);

	// Ensure we have valid indices and values
	// Use a safe access pattern to avoid TypeScript errors
	metrics.p95Latency =
		p95Index >= 0 && p95Index < sortedLatencies.length
			? (sortedLatencies[p95Index] ?? 0)
			: 0;

	metrics.p99Latency =
		p99Index >= 0 && p99Index < sortedLatencies.length
			? (sortedLatencies[p99Index] ?? 0)
			: 0;

	const durationSeconds = (metrics.endTime - metrics.startTime) / 1000;
	metrics.requestsPerSecond = metrics.totalRequests / durationSeconds;
}

// Print results
function printResults() {
	if (metrics.startTime === null || metrics.endTime === null) {
		console.error("Test did not complete properly");
		return;
	}

	console.log("\n=== Load Test Results ===");
	console.log(`Target URL: ${TARGET_URL}`);
	console.log(
		`Test Duration: ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)} seconds`,
	);
	console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
	console.log(`Total Requests: ${metrics.totalRequests}`);
	console.log(`Successful Requests: ${metrics.successfulRequests}`);
	console.log(`Failed Requests: ${metrics.failedRequests}`);
	console.log(`Requests Per Second: ${metrics.requestsPerSecond.toFixed(2)}`);
	console.log(`Average Latency: ${metrics.avgLatency.toFixed(2)} ms`);
	console.log(
		`Minimum Latency: ${metrics.minLatency !== Infinity ? metrics.minLatency.toFixed(2) : "N/A"} ms`,
	);
	console.log(`Maximum Latency: ${metrics.maxLatency.toFixed(2)} ms`);
	console.log(`95th Percentile Latency: ${metrics.p95Latency.toFixed(2)} ms`);
	console.log(`99th Percentile Latency: ${metrics.p99Latency.toFixed(2)} ms`);
}

// Save results to file
function saveResults() {
	fs.writeFileSync(RESULTS_FILE, JSON.stringify(metrics, null, 2));
	console.log(`\nResults saved to ${RESULTS_FILE}`);
}

// Main function
async function runLoadTest() {
	console.log(`Starting load test against ${TARGET_URL}`);
	console.log(
		`Running with ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION_SECONDS} seconds`,
	);

	metrics.startTime = performance.now();

	try {
		await runConcurrentUsers();
		metrics.endTime = performance.now();

		calculateStatistics();
		printResults();
		saveResults();

		return metrics;
	} catch (error) {
		console.error("Error during load test:", error);
		metrics.endTime = performance.now();
		return metrics;
	}
}

// Run the load test
runLoadTest();
