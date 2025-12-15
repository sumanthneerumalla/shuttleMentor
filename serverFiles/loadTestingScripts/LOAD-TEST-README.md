# ShuttleMentor Load Testing Tools

This directory contains tools for load testing the ShuttleMentor website (shuttlementor.com). These tools help measure how many requests per second the server can handle, along with detailed latency metrics.

## Available Scripts

1. **run-load-test.js** - The main script that runs the load test and generates an HTML report
2. **load-test.js** - Core load testing functionality
3. **load-test-report.js** - HTML report generator

## Quick Start

To run a load test against shuttlementor.com:

```bash
node run-load-test.js
```

This will:
1. Run a load test against shuttlementor.com
2. Save raw results to `load-test-results.json`
3. Generate an HTML report at `load-test-report.html`
4. Automatically open the report in your default browser

## Configuration

You can customize the load test by editing the `CONFIG` object in `run-load-test.js`:

```javascript
const CONFIG = {
  targetUrl: 'http://shuttlementor.com',   // URL to test (supports both HTTP and HTTPS)
  concurrentUsers: 100,                    // Number of concurrent connections
  testDurationSeconds: 10,                 // Duration of the test
  resultsFile: 'load-test-results.json',   // Output file for raw results
  reportFile: 'load-test-report.html',     // Output file for HTML report
  openBrowserAfterTest: true,              // Auto-open report in browser
  requestTimeout: 10000                    // Request timeout in milliseconds (10 seconds)
};
```

## Metrics Collected

The load test collects and reports the following metrics:

- **Total Requests**: Total number of HTTP requests made
- **Successful Requests**: Number of successful HTTP responses
- **Failed Requests**: Number of failed HTTP requests
- **Requests Per Second**: Average number of requests handled per second
- **Average Latency**: Average response time in milliseconds
- **Minimum Latency**: Fastest response time in milliseconds
- **Maximum Latency**: Slowest response time in milliseconds
- **95th Percentile Latency**: Response time that 95% of requests are faster than
- **99th Percentile Latency**: Response time that 99% of requests are faster than

## HTML Report

The HTML report includes:

1. Test summary information
2. Key metrics in an easy-to-read format
3. Latency distribution chart
4. Percentile latency chart

## Running Individual Components

### Just the Load Test

```bash
node load-test.js
```

### Just the Report Generator

```bash
node load-test-report.js [results-file] [output-file]
```

## Protocol Support

The load testing tool supports both HTTP and HTTPS protocols:

- Automatically detects the protocol from the URL
- Uses the appropriate module (http or https) based on the protocol
- Works with any valid HTTP or HTTPS URL

## Tips for Effective Load Testing

1. **Start Small**: Begin with a small number of concurrent users (5-10) and gradually increase
2. **Vary Test Duration**: Run tests of different durations to observe behavior over time
3. **Test at Different Times**: Server performance may vary based on time of day
4. **Monitor Server Resources**: If possible, monitor CPU, memory, and network usage on the server during tests
5. **Look for Patterns**: Watch for patterns in latency as load increases
6. **Adjust Timeout Settings**: Modify the `requestTimeout` value based on expected response times

## Interpreting Results

- **High Average Latency**: May indicate the server is overloaded
- **High 99th Percentile**: Suggests occasional slow responses that could affect user experience
- **Failed Requests**: Investigate server logs for errors
- **Low Requests Per Second**: May indicate bottlenecks in server configuration

## Troubleshooting

If you encounter issues:

1. Ensure you have network connectivity to shuttlementor.com
2. Check for HTTPS certificate issues
3. Verify Node.js is properly installed (v14+ recommended)
4. Try reducing the number of concurrent users
