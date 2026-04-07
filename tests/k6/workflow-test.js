/**
 * K6 Workflow Test - Complete Expense Approval Flow
 *
 * Purpose: Simulate the complete expense lifecycle from creation to payment
 *
 * Flow:
 * 1. Employee creates an expense
 * 2. Employee submits the expense
 * 3. Manager approves the expense
 * 4. Finance marks the expense as paid
 *
 * This test validates:
 * - State transitions work correctly under load
 * - Role-based access works with X-User-Id header
 * - API handles concurrent workflow operations
 *
 * Run: k6 run tests/k6/workflow-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const workflowSuccessRate = new Rate('workflow_success');
const workflowDuration = new Trend('workflow_duration');
const expenseCreationTime = new Trend('expense_creation_time');
const expenseApprovalTime = new Trend('expense_approval_time');
const expensePaymentTime = new Trend('expense_payment_time');
const completedWorkflows = new Counter('completed_workflows');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '2m', target: 10 },   // Sustain 10 users for 2 minutes
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // Overall request duration
    'http_req_duration': ['p(95)<1000'],

    // Workflow success rate should be very high (95%+)
    'workflow_success': ['rate>0.95'],

    // Error rate should be minimal
    'errors': ['rate<0.05'],

    // Individual operation thresholds
    'expense_creation_time': ['p(95)<500'],
    'expense_approval_time': ['p(95)<750'],
    'expense_payment_time': ['p(95)<750'],

    // Complete workflow should finish in reasonable time
    'workflow_duration': ['p(95)<5000'], // 5 seconds for complete flow
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

// User IDs for different roles
const USERS = {
  employee: { id: 1, name: 'Alice Employee' },
  employee2: { id: 2, name: 'Bob Employee' },
  manager: { id: 3, name: 'Charlie Manager' },
  finance: { id: 4, name: 'Diana Finance' },
};

// Sample expense data generator
function generateExpenseData() {
  const categories = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Training'];
  const amounts = [2500, 5000, 7500, 10000, 15000, 25000]; // in cents

  return {
    title: `Test Expense ${Date.now()}-${Math.random().toString(36).substring(7)}`,
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    description: 'Performance test expense - auto-generated',
    date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Create HTTP params with user context
 */
function getParams(userId) {
  return {
    headers: {
      'X-User-Id': userId.toString(),
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Main workflow test scenario
 */
export default function () {
  const workflowStart = Date.now();
  let workflowSuccess = false;
  let expenseId = null;

  try {
    // STEP 1: Create expense as Employee
    group('Create Expense (Employee)', () => {
      const expenseData = generateExpenseData();
      const createStart = Date.now();

      const createResponse = http.post(
        `${BASE_URL}/expenses`,
        JSON.stringify(expenseData),
        getParams(USERS.employee.id)
      );

      expenseCreationTime.add(Date.now() - createStart);

      const createCheck = check(createResponse, {
        'create - status is 201 or 200': (r) => r.status === 201 || r.status === 200,
        'create - has expense id': (r) => {
          try {
            const body = JSON.parse(r.body);
            expenseId = body.id || body.expense?.id;
            return expenseId !== null && expenseId !== undefined;
          } catch (e) {
            return false;
          }
        },
        'create - status is draft': (r) => {
          try {
            const body = JSON.parse(r.body);
            const status = body.status || body.expense?.status;
            return status === 'draft';
          } catch (e) {
            return false;
          }
        },
      });

      if (!createCheck) {
        errorRate.add(1);
        console.log(`Failed to create expense: ${createResponse.status} - ${createResponse.body}`);
        return;
      }

      // Simulate user reviewing the created expense
      sleep(1);
    });

    if (!expenseId) {
      errorRate.add(1);
      return;
    }

    // STEP 2: Submit expense as Employee
    group('Submit Expense (Employee)', () => {
      const submitResponse = http.post(
        `${BASE_URL}/expenses/${expenseId}/submit`,
        null,
        getParams(USERS.employee.id)
      );

      const submitCheck = check(submitResponse, {
        'submit - status is 200': (r) => r.status === 200,
        'submit - status is submitted': (r) => {
          try {
            const body = JSON.parse(r.body);
            const status = body.status || body.expense?.status;
            return status === 'submitted';
          } catch (e) {
            return false;
          }
        },
      });

      if (!submitCheck) {
        errorRate.add(1);
        console.log(`Failed to submit expense ${expenseId}: ${submitResponse.status}`);
        return;
      }

      // Simulate time between submission and manager review
      sleep(1);
    });

    // STEP 3: Approve expense as Manager
    group('Approve Expense (Manager)', () => {
      const approveStart = Date.now();

      const approveResponse = http.post(
        `${BASE_URL}/expenses/${expenseId}/approve`,
        null,
        getParams(USERS.manager.id)
      );

      expenseApprovalTime.add(Date.now() - approveStart);

      const approveCheck = check(approveResponse, {
        'approve - status is 200': (r) => r.status === 200,
        'approve - status is approved': (r) => {
          try {
            const body = JSON.parse(r.body);
            const status = body.status || body.expense?.status;
            return status === 'approved';
          } catch (e) {
            return false;
          }
        },
      });

      if (!approveCheck) {
        errorRate.add(1);
        console.log(`Failed to approve expense ${expenseId}: ${approveResponse.status}`);
        return;
      }

      // Simulate time between approval and payment processing
      sleep(1);
    });

    // STEP 4: Mark as paid - Finance Admin
    group('Mark Paid (Finance)', () => {
      const payStart = Date.now();

      const payResponse = http.post(
        `${BASE_URL}/expenses/${expenseId}/pay`,
        null,
        getParams(USERS.finance.id)
      );

      expensePaymentTime.add(Date.now() - payStart);

      const payCheck = check(payResponse, {
        'pay - status is 200': (r) => r.status === 200,
        'pay - status is paid': (r) => {
          try {
            const body = JSON.parse(r.body);
            const status = body.status || body.expense?.status;
            return status === 'paid';
          } catch (e) {
            return false;
          }
        },
      });

      if (!payCheck) {
        errorRate.add(1);
        console.log(`Failed to mark expense ${expenseId} as paid: ${payResponse.status}`);
        return;
      }

      workflowSuccess = true;
      completedWorkflows.add(1);
    });

    // STEP 5: Verify final state
    group('Verify Final State', () => {
      const verifyResponse = http.get(
        `${BASE_URL}/expenses/${expenseId}`,
        getParams(USERS.finance.id)
      );

      check(verifyResponse, {
        'verify - can retrieve expense': (r) => r.status === 200,
        'verify - final status is paid': (r) => {
          try {
            const body = JSON.parse(r.body);
            const status = body.status || body.expense?.status;
            return status === 'paid';
          } catch (e) {
            return false;
          }
        },
      });
    });

    // Record total workflow duration
    workflowDuration.add(Date.now() - workflowStart);
    workflowSuccessRate.add(workflowSuccess);

  } catch (error) {
    errorRate.add(1);
    workflowSuccessRate.add(false);
    console.log(`Workflow error: ${error}`);
  }

  // Think time before next workflow iteration
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Test alternative workflow: Rejection path
 */
export function rejectionScenario() {
  const expenseData = generateExpenseData();
  let expenseId = null;

  // Create and submit expense
  const createResponse = http.post(
    `${BASE_URL}/expenses`,
    JSON.stringify(expenseData),
    getParams(USERS.employee.id)
  );

  const body = JSON.parse(createResponse.body);
  expenseId = body.id || body.expense?.id;

  if (expenseId) {
    http.post(
      `${BASE_URL}/expenses/${expenseId}/submit`,
      null,
      getParams(USERS.employee.id)
    );

    // Manager rejects instead of approving
    const rejectResponse = http.post(
      `${BASE_URL}/expenses/${expenseId}/reject`,
      null,
      getParams(USERS.manager.id)
    );

    check(rejectResponse, {
      'reject - status is 200': (r) => r.status === 200,
      'reject - status is rejected': (r) => {
        try {
          const body = JSON.parse(r.body);
          const status = body.status || body.expense?.status;
          return status === 'rejected';
        } catch (e) {
          return false;
        }
      },
    });
  }

  sleep(1);
}

/**
 * Setup function
 */
export function setup() {
  console.log('Starting Workflow Test');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Workflow Steps:');
  console.log('  1. Employee creates expense (draft)');
  console.log('  2. Employee submits expense (submitted)');
  console.log('  3. Manager approves expense (approved)');
  console.log('  4. Finance marks as paid (paid)');
  console.log('');
  console.log('Test Configuration:');
  console.log('  - Virtual Users: 5 -> 10 (sustained)');
  console.log('  - Duration: 4 minutes total');
  console.log('  - Target: 95% workflow success rate');
  console.log('');
}

/**
 * Teardown function
 */
export function teardown(data) {
  console.log('Workflow Test completed');
}
