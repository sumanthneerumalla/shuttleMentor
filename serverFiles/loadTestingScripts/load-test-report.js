import fs from "fs";

/**
 * Generates an HTML report from the load test results
 * @param {string} resultsFile - Path to the JSON results file
 * @param {string} outputFile - Path to save the HTML report
 */
function generateHtmlReport(
	resultsFile = "load-test-results.json",
	outputFile = "load-test-report.html",
) {
	try {
		// Read the results file
		const data = fs.readFileSync(resultsFile, "utf8");
		const metrics = JSON.parse(data);

		// Calculate additional statistics
		const latencyDistribution = calculateLatencyDistribution(metrics.latencies);

		// Generate HTML content
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Results - ${new Date().toLocaleString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #7f8c8d;
    }
    .chart-container {
      height: 300px;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>Load Test Results</h1>
  <div class="summary">
    <h2>Test Summary</h2>
    <p><strong>Target URL:</strong> ${metrics.targetUrl || "https://shuttlementor.com"}</p>
    <p><strong>Test Duration:</strong> ${((metrics.endTime - metrics.startTime) / 1000).toFixed(2)} seconds</p>
    <p><strong>Concurrent Users:</strong> ${metrics.concurrentUsers || "N/A"}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-label">Total Requests</div>
      <div class="metric-value">${metrics.totalRequests}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Successful Requests</div>
      <div class="metric-value">${metrics.successfulRequests}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Failed Requests</div>
      <div class="metric-value">${metrics.failedRequests}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Requests Per Second</div>
      <div class="metric-value">${metrics.requestsPerSecond.toFixed(2)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Average Latency</div>
      <div class="metric-value">${metrics.avgLatency.toFixed(2)} ms</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Maximum Latency</div>
      <div class="metric-value">${metrics.maxLatency.toFixed(2)} ms</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">95th Percentile</div>
      <div class="metric-value">${metrics.p95Latency.toFixed(2)} ms</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">99th Percentile</div>
      <div class="metric-value">${metrics.p99Latency.toFixed(2)} ms</div>
    </div>
  </div>

  <h2>Latency Distribution</h2>
  <div class="chart-container">
    <canvas id="latencyDistribution"></canvas>
  </div>

  <h2>Latency Percentiles</h2>
  <div class="chart-container">
    <canvas id="latencyPercentiles"></canvas>
  </div>

  <script>
    // Latency distribution chart
    const latencyDistributionCtx = document.getElementById('latencyDistribution').getContext('2d');
    new Chart(latencyDistributionCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(latencyDistribution.labels)},
        datasets: [{
          label: 'Number of Requests',
          data: ${JSON.stringify(latencyDistribution.counts)},
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Requests'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Latency (ms)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Request Latency Distribution'
          }
        }
      }
    });

    // Latency percentiles chart
    const latencyPercentilesCtx = document.getElementById('latencyPercentiles').getContext('2d');
    new Chart(latencyPercentilesCtx, {
      type: 'line',
      data: {
        labels: ['0%', '25%', '50%', '75%', '90%', '95%', '99%', '100%'],
        datasets: [{
          label: 'Latency',
          data: ${JSON.stringify(calculatePercentiles(metrics.latencies))},
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Latency (ms)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Percentile'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Latency Percentiles'
          }
        }
      }
    });
  </script>
</body>
</html>
    `;

		// Write the HTML report
		fs.writeFileSync(outputFile, html);
		console.log(`HTML report generated at: ${outputFile}`);
	} catch (error) {
		console.error("Error generating HTML report:", error);
	}
}

/**
 * Calculate latency distribution for visualization
 * @param {number[]} latencies - Array of latency values
 * @returns {{labels: string[], counts: number[]}} Distribution data
 */
function calculateLatencyDistribution(latencies) {
	// Skip if no latencies
	if (!latencies || latencies.length === 0) {
		return { labels: [], counts: [] };
	}

	// Find min and max latency
	const minLatency = Math.min(...latencies);
	const maxLatency = Math.max(...latencies);

	// Create 10 buckets for the distribution
	const bucketCount = 10;
	const bucketSize = Math.max(
		1,
		Math.ceil((maxLatency - minLatency) / bucketCount),
	);

	const buckets = Array(bucketCount).fill(0);
	const labels = [];

	// Create labels
	for (let i = 0; i < bucketCount; i++) {
		const start = minLatency + i * bucketSize;
		const end = start + bucketSize;
		labels.push(`${start.toFixed(0)}-${end.toFixed(0)}`);
	}

	// Count latencies in each bucket
	latencies.forEach((latency) => {
		const bucketIndex = Math.min(
			bucketCount - 1,
			Math.floor((latency - minLatency) / bucketSize),
		);
		buckets[bucketIndex]++;
	});

	return {
		labels,
		counts: buckets,
	};
}

/**
 * Calculate percentiles for visualization
 * @param {number[]} latencies - Array of latency values
 * @returns {number[]} Percentile values
 */
function calculatePercentiles(latencies) {
	if (!latencies || latencies.length === 0) {
		return [0, 0, 0, 0, 0, 0, 0, 0];
	}

	const sorted = [...latencies].sort((a, b) => a - b);
	const len = sorted.length;

	/**
	 * Helper function to safely get array value or default to 0
	 * @param {number[]} arr - Array to get value from
	 * @param {number} index - Index to access
	 * @returns {number} - The value at index or 0 if out of bounds
	 */
	const safeGet = (arr, index) =>
		index >= 0 && index < arr.length ? (arr[index] ?? 0) : 0;

	return [
		safeGet(sorted, 0), // 0%
		safeGet(sorted, Math.floor(len * 0.25)), // 25%
		safeGet(sorted, Math.floor(len * 0.5)), // 50%
		safeGet(sorted, Math.floor(len * 0.75)), // 75%
		safeGet(sorted, Math.floor(len * 0.9)), // 90%
		safeGet(sorted, Math.floor(len * 0.95)), // 95%
		safeGet(sorted, Math.floor(len * 0.99)), // 99%
		safeGet(sorted, len - 1), // 100%
	];
}

// Export the function
export { generateHtmlReport };

// If this file is run directly, generate a report
if (process.argv[1]?.endsWith("load-test-report.js")) {
	const resultsFile = process.argv[2] || "load-test-results.json";
	const outputFile = process.argv[3] || "load-test-report.html";
	generateHtmlReport(resultsFile, outputFile);
}
