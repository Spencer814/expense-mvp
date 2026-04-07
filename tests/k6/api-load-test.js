/**
 * K6 Load Test - Expense API Endpoints
 *
 * Purpose: Test basic API endpoints under realistic load conditions
 *
 * Simulates 10-50 concurrent users accessing the expense and dashboard APIs
 * with realistic ramp-up and ramp-down patterns.
 *
 * Run: k6 run tests/k6/api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const expensesResponseTime = new Trend('expenses_response_time');
const dashboardResponseTime = new Trend('dashboard_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '30s', target: 30 },  // Ramp up to 30 users over 30s
    { duration: '1m', target: 50 },   // Sustain 50 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30s
  ],
  thresholds: {
    // 95th percentile response time must be under 500ms
    'http_req_duration': ['p(95)<500'],

    // Error rate must be less than 1%
    'errors': ['rate<0.01'],

    // Specific endpoint thresholds
    'expenses_response_time': ['p(95)<500', 'p(99)<1000'],
    'dashboard_response_time': ['p(95)<750', 'p(99)<1500'], // Dashboard may be slower due to aggregation
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

// Simulated users with different roles
const USERS = [
  { id: 1, role: 'employee', name: 'Alice Employee' },
  { id: 2, role: 'employee', name: 'Bob Employee' },
  { id: 3, role: 'manager', name: 'Charlie Manager' },
  { id: 4, role: 'finance', name: 'Diana Finance' },
];

/**
 * Main test scenario
 * Each virtual user will randomly access different endpoints
 */
export default function () {
  // Randomly select a user to simulate
  const user = USERS[Math.floor(Math.random() * USERS.length)];

  const params = {
    headers: {
      'X-User-Id': user.id.toString(),
      'Content-Type': 'application/json',
    },
  };

  // Test 1: GET /api/expenses
  const expensesStart = Date.now();
  const expensesResponse = http.get(`${BASE_URL}/expenses`, params);
  expensesResponseTime.add(Date.now() - expensesStart);

  const expensesCheck = check(expensesResponse, {
    'expenses - status is 200': (r) => r.status === 200,
    'expenses - response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    'expenses - has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body.expenses);
      } catch (e) {
        return false;
      }
    },
    'expenses - response time < 1s': (r) => r.timings.duration < 1000,
  });

  errorRate.add(!expensesCheck);

  // Simulate user reading the list
  sleep(Math.random() * 2 + 1); // 1-3 seconds

  // Test 2: GET /api/dashboard (only for managers and finance users)
  if (user.role === 'manager' || user.role === 'finance') {
    const dashboardStart = Date.now();
    const dashboardResponse = http.get(`${BASE_URL}/dashboard`, params);
    dashboardResponseTime.add(Date.now() - dashboardStart);

    const dashboardCheck = check(dashboardResponse, {
      'dashboard - status is 200': (r) => r.status === 200,
      'dashboard - response is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
      'dashboard - has metrics': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total_expenses !== undefined || body.totalExpenses !== undefined;
        } catch (e) {
          return false;
        }
      },
      'dashboard - response time < 1.5s': (r) => r.timings.duration < 1500,
    });

    errorRate.add(!dashboardCheck);

    // Simulate user reviewing dashboard
    sleep(Math.random() * 3 + 2); // 2-5 seconds
  } else {
    // Employees might check their expense details less frequently
    sleep(Math.random() * 2 + 1); // 1-3 seconds
  }

  // Test 3: GET /api/users (for role switching)
  const usersResponse = http.get(`${BASE_URL}/users`, params);

  const usersCheck = check(usersResponse, {
    'users - status is 200': (r) => r.status === 200,
    'users - has users array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || Array.isArray(body.users);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!usersCheck);

  // Think time between iterations
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log('Starting API Load Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Configuration:');
  console.log('  - Virtual Users: 10 -> 30 -> 50 -> 0');
  console.log('  - Duration: 2.5 minutes total');
  console.log('  - Thresholds: p95 < 500ms, error rate < 1%');
  console.log('');
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  console.log('API Load Test completed');
}
