/**
 * K6 Stress Test - Dashboard Aggregation
 *
 * Purpose: Find the breaking point of the dashboard endpoint under increasing load
 *
 * This test gradually increases load from 10 to 100 virtual users to:
 * - Identify performance degradation points
 * - Find the maximum sustainable load
 * - Monitor response time trends under stress
 * - Detect memory leaks or resource exhaustion
 *
 * The dashboard endpoint is particularly CPU-intensive as it aggregates
 * data across all expenses, making it a good candidate for stress testing.
 *
 * Run: k6 run tests/k6/dashboard-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const dashboardResponseTime = new Trend('dashboard_response_time');
const slowResponses = new Counter('slow_responses'); // Responses > 1s
const verySlowResponses = new Counter('very_slow_responses'); // Responses > 3s
const currentVUs = new Gauge('current_virtual_users');
const successfulRequests = new Counter('successful_requests');

// Test configuration - Gradual stress ramp
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Baseline: 10 users
    { duration: '1m', target: 20 },   // Increase to 20
    { duration: '1m', target: 40 },   // Increase to 40
    { duration: '1m', target: 60 },   // Increase to 60
    { duration: '1m', target: 80 },   // Increase to 80
    { duration: '2m', target: 100 },  // Push to 100 users
    { duration: '1m', target: 100 },  // Sustain max load
    { duration: '1m', target: 0 },    // Ramp down (recovery test)
  ],
  thresholds: {
    // We expect some degradation, so thresholds are more lenient
    'http_req_duration': ['p(50)<1000', 'p(90)<3000'],

    // Error rate threshold - we tolerate up to 10% errors at peak
    'errors': ['rate<0.10'],

    // Dashboard-specific thresholds
    'dashboard_response_time': [
      'p(50)<1000',  // Median should stay reasonable
      'p(90)<3000',  // 90th percentile can degrade under stress
      'p(95)<5000',  // 95th percentile threshold
    ],

    // Track percentage of slow responses
    'http_req_failed': ['rate<0.10'], // Max 10% failures
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

// Users that can access dashboard (managers and finance)
const PRIVILEGED_USERS = [
  { id: 3, role: 'manager', name: 'Charlie Manager' },
  { id: 4, role: 'finance', name: 'Diana Finance' },
  { id: 5, role: 'manager', name: 'Eve Manager' },
  { id: 6, role: 'finance', name: 'Frank Finance' },
];

/**
 * Main stress test scenario
 */
export default function () {
  // Track current VU count for analysis
  currentVUs.add(__VU);

  // Randomly select a privileged user
  const user = PRIVILEGED_USERS[Math.floor(Math.random() * PRIVILEGED_USERS.length)];

  const params = {
    headers: {
      'X-User-Id': user.id.toString(),
      'Content-Type': 'application/json',
    },
  };

  // Test dashboard endpoint
  const startTime = Date.now();

  const response = http.get(`${BASE_URL}/dashboard`, params);

  const duration = Date.now() - startTime;
  dashboardResponseTime.add(duration);

  // Track slow responses
  if (duration > 1000) {
    slowResponses.add(1);
  }
  if (duration > 3000) {
    verySlowResponses.add(1);
  }

  // Comprehensive checks
  const isSuccess = check(response, {
    'status is 200': (r) => r.status === 200,
    'response is JSON': (r) => {
      const contentType = r.headers['Content-Type'] || r.headers['content-type'];
      return contentType && contentType.includes('application/json');
    },
    'has required fields': (r) => {
      try {
        const body = JSON.parse(r.body);
        // Check for common dashboard fields
        const hasFields = (
          (body.total_expenses !== undefined || body.totalExpenses !== undefined) ||
          (body.pending_count !== undefined || body.pendingCount !== undefined) ||
          (body.total_amount !== undefined || body.totalAmount !== undefined)
        );
        return hasFields;
      } catch (e) {
        return false;
      }
    },
    'response time acceptable': (r) => r.timings.duration < 5000,
  });

  if (isSuccess) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);

    // Log failures for debugging
    if (response.status !== 200) {
      console.log(`[VU ${__VU}] Dashboard request failed: ${response.status} - ${response.body?.substring(0, 100)}`);
    }
  }

  // Also test the expenses endpoint to see comparative performance
  const expensesResponse = http.get(`${BASE_URL}/expenses`, params);

  check(expensesResponse, {
    'expenses - status is 200': (r) => r.status === 200,
    'expenses - faster than dashboard': (r) => r.timings.duration < duration,
  });

  // Variable think time based on current load
  // Higher load = shorter think time (more aggressive)
  const thinkTime = __VU > 60 ? 0.5 : (__VU > 30 ? 1 : 2);
  sleep(Math.random() * thinkTime + 0.5);
}

/**
 * Setup function - Create test data if needed
 */
export function setup() {
  console.log('Starting Dashboard Stress Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');
  console.log('Stress Test Profile:');
  console.log('  Stage 1: 10 VUs  (1 min) - Baseline');
  console.log('  Stage 2: 20 VUs  (1 min) - Light load');
  console.log('  Stage 3: 40 VUs  (1 min) - Moderate load');
  console.log('  Stage 4: 60 VUs  (1 min) - Heavy load');
  console.log('  Stage 5: 80 VUs  (1 min) - Very heavy load');
  console.log('  Stage 6: 100 VUs (2 min) - Stress load');
  console.log('  Stage 7: 100 VUs (1 min) - Sustained stress');
  console.log('  Stage 8: 0 VUs   (1 min) - Recovery');
  console.log('');
  console.log('Objectives:');
  console.log('  - Find maximum sustainable load');
  console.log('  - Identify response time degradation points');
  console.log('  - Monitor error rates at peak load');
  console.log('  - Verify system recovery after stress');
  console.log('');

  // Verify dashboard is accessible
  const testParams = {
    headers: {
      'X-User-Id': '4',
      'Content-Type': 'application/json',
    },
  };

  const testResponse = http.get(`${BASE_URL}/dashboard`, testParams);

  if (testResponse.status !== 200) {
    console.log('WARNING: Dashboard endpoint not accessible');
    console.log(`Status: ${testResponse.status}`);
    console.log(`Response: ${testResponse.body}`);
  } else {
    console.log('Dashboard endpoint verified - starting stress test');
    console.log('');
  }

  return {
    baselineResponseTime: testResponse.timings.duration,
  };
}

/**
 * Teardown function - Analysis and reporting
 */
export function teardown(data) {
  console.log('');
  console.log('='.repeat(60));
  console.log('Dashboard Stress Test - Complete');
  console.log('='.repeat(60));

  if (data && data.baselineResponseTime) {
    console.log(`Baseline response time: ${data.baselineResponseTime.toFixed(2)}ms`);
  }

  console.log('');
  console.log('Analysis Tips:');
  console.log('  1. Compare p50, p90, p95 response times across load stages');
  console.log('  2. Identify at what VU count response times spike significantly');
  console.log('  3. Check error_rate to find the breaking point');
  console.log('  4. Monitor slow_responses and very_slow_responses metrics');
  console.log('  5. Verify system recovered during ramp-down phase');
  console.log('');
  console.log('Next Steps:');
  console.log('  - If errors spike before 50 VUs: Optimize dashboard queries');
  console.log('  - If response times > 3s at 30 VUs: Add caching layer');
  console.log('  - If system sustains 100 VUs: Try higher load or longer duration');
  console.log('');
}

/**
 * Handle HTTP errors gracefully
 */
export function handleSummary(data) {
  const successRate = (data.metrics.successful_requests?.values?.count || 0) /
                      (data.metrics.http_reqs?.values?.count || 1) * 100;

  const avgResponseTime = data.metrics.dashboard_response_time?.values?.avg || 0;
  const p95ResponseTime = data.metrics.dashboard_response_time?.values['p(95)'] || 0;
  const errorPercentage = (data.metrics.errors?.values?.rate || 0) * 100;

  return {
    'stdout': `
╔════════════════════════════════════════════════════════════╗
║          DASHBOARD STRESS TEST SUMMARY                     ║
╠════════════════════════════════════════════════════════════╣
║ Total Requests:     ${String(data.metrics.http_reqs?.values?.count || 0).padEnd(10)} ║
║ Success Rate:       ${successRate.toFixed(2).padStart(6)}%                        ║
║ Error Rate:         ${errorPercentage.toFixed(2).padStart(6)}%                        ║
║ Avg Response Time:  ${avgResponseTime.toFixed(2).padStart(8)}ms                      ║
║ P95 Response Time:  ${p95ResponseTime.toFixed(2).padStart(8)}ms                      ║
║ Slow Responses:     ${String(data.metrics.slow_responses?.values?.count || 0).padEnd(10)} (>1s)    ║
║ Very Slow:          ${String(data.metrics.very_slow_responses?.values?.count || 0).padEnd(10)} (>3s)    ║
╚════════════════════════════════════════════════════════════╝
`,
  };
}
