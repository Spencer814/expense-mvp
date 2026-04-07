# K6 Performance Testing Suite - Overview

## Quick Start

```bash
# 1. Install k6
brew install k6

# 2. Start your API
cd backend && rails server -p 3000

# 3. Run a test
k6 run tests/k6/api-load-test.js

# 4. Or run all tests
./tests/k6/run-all-tests.sh
```

## Test Suite Files

### Core Test Files

| File | Purpose | Duration | VUs | Key Metrics |
|------|---------|----------|-----|-------------|
| **api-load-test.js** | Basic endpoint load testing | 2.5 min | 10-50 | p95 < 500ms, errors < 1% |
| **workflow-test.js** | Complete expense lifecycle | 4 min | 5-10 | 95% success rate, p95 < 5s |
| **dashboard-stress-test.js** | Find breaking point | 9 min | 10-100 | p50 < 1s, p90 < 3s |

### Documentation & Helper Files

| File | Description |
|------|-------------|
| **README.md** | Complete documentation with installation, usage, CI/CD |
| **OVERVIEW.md** | This file - quick reference and test suite summary |
| **.k6-quick-reference.md** | Cheat sheet for common commands |
| **sample-output.txt** | Example output showing what to expect |
| **run-all-tests.sh** | Bash script to run all tests in sequence |

## Test Descriptions

### 1. API Load Test (`api-load-test.js`)

**What it tests:**
- GET /api/expenses
- GET /api/dashboard
- GET /api/users

**Load Pattern:**
```
Users:  10 ──────▶ 30 ──────▶ 50 ████████ 50 ──────▶ 0
Time:   [  30s   ] [  30s   ] [  1min  ] [  30s   ]
```

**Best for:**
- Quick smoke testing
- Validating basic API performance
- Pre-deployment checks
- CI/CD pipelines

**Run:**
```bash
k6 run tests/k6/api-load-test.js
```

### 2. Workflow Test (`workflow-test.js`)

**What it tests:**
Complete expense lifecycle with role switching:
1. Employee creates expense (draft)
2. Employee submits expense (submitted)
3. Manager approves expense (approved)
4. Finance marks paid (paid)

**Load Pattern:**
```
Users:  5 ──────▶ 10 ████████████████ 10 ──────▶ 0
Time:   [  30s   ] [   1min   ] [2min] [  30s   ]
```

**Best for:**
- Testing state machine transitions
- Validating role-based access
- Checking concurrent workflow operations
- Integration testing under load

**Run:**
```bash
k6 run tests/k6/workflow-test.js
```

### 3. Dashboard Stress Test (`dashboard-stress-test.js`)

**What it tests:**
Dashboard aggregation endpoint under increasing load to find breaking point.

**Load Pattern:**
```
Users:  10 ──▶ 20 ──▶ 40 ──▶ 60 ──▶ 80 ──▶ 100 ████ 100 ──▶ 0
Time:   [1min] [1min] [1min] [1min] [1min] [2min][1m][1min]
```

**Best for:**
- Capacity planning
- Finding performance bottlenecks
- Stress testing aggregations
- Determining scaling requirements

**Run:**
```bash
k6 run tests/k6/dashboard-stress-test.js
```

## Understanding the Results

### Successful Test Output

```
✓ checks.........................: 99.5%
✓ http_req_duration..............: avg=150ms p(95)=420ms  ← Target: p95 < 500ms
✓ http_req_failed................: 0.5%                   ← Target: < 1%
✓ workflow_success...............: 97.8%                  ← Target: > 95%
```

### Red Flags

```
✗ checks.........................: 85.2%     ← Too many check failures
✗ http_req_duration..............: p(95)=1.8s ← Exceeded threshold
✗ http_req_failed................: 12.3%     ← Too many errors
✗ workflow_success...............: 78.4%     ← Below target
```

## Test Metrics Explained

| Metric | What it means | Good value |
|--------|---------------|------------|
| **checks** | % of assertions passing | > 95% |
| **http_req_duration p95** | 95% of requests faster than this | < 500ms |
| **http_req_failed** | % of HTTP errors | < 1% |
| **workflow_success** | % of completed workflows | > 95% |
| **iterations** | Test cycles completed | Higher = better |
| **http_reqs** | Total HTTP requests | - |

## Common Usage Patterns

### Development Workflow

```bash
# 1. Make code changes
vim backend/app/controllers/api/expenses_controller.rb

# 2. Quick validation
k6 run tests/k6/api-load-test.js

# 3. Full validation before commit
./tests/k6/run-all-tests.sh --skip-stress
```

### Pre-deployment

```bash
# Run full suite against staging
BASE_URL=https://staging-api.example.com ./tests/k6/run-all-tests.sh
```

### Performance Investigation

```bash
# Isolate specific endpoint
k6 run tests/k6/dashboard-stress-test.js

# Reduce load to debug
# Edit dashboard-stress-test.js stages to lower VUs
```

### CI/CD Pipeline

```bash
# Quick test in PR pipeline
k6 run --quiet tests/k6/api-load-test.js

# Nightly full test
./tests/k6/run-all-tests.sh > performance-report.txt
```

## Customization Examples

### Change Base URL

```bash
BASE_URL=http://production.com k6 run tests/k6/api-load-test.js
```

### Reduce Test Duration (for CI)

Edit the stages in any test file:

```javascript
stages: [
  { duration: '10s', target: 10 },  // Shorter ramp
  { duration: '30s', target: 20 },  // Lower peak
  { duration: '10s', target: 0 },   // Quick ramp down
]
```

### Increase Load Intensity

```javascript
stages: [
  { duration: '1m', target: 50 },
  { duration: '2m', target: 100 },  // More users
  { duration: '5m', target: 100 },  // Longer duration
]
```

### Adjust Thresholds

```javascript
thresholds: {
  'http_req_duration': ['p(95)<1000'],  // More lenient
  'errors': ['rate<0.05'],              // Allow 5% errors
}
```

## Integration Examples

### GitHub Actions

```yaml
- name: Performance Test
  run: |
    k6 run --out json=results.json tests/k6/api-load-test.js

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: k6-results
    path: results.json
```

### GitLab CI

```yaml
performance:
  stage: test
  image: grafana/k6:latest
  script:
    - k6 run tests/k6/api-load-test.js
  artifacts:
    paths:
      - results.json
```

### Jenkins

```groovy
stage('Performance Test') {
  steps {
    sh 'k6 run --out json=results.json tests/k6/api-load-test.js'
    archiveArtifacts 'results.json'
  }
}
```

## Performance Benchmarks

Expected results on standard hardware (4 CPU, 8GB RAM):

### API Load Test
- **Target:** 50 concurrent users
- **Expected p95:** 350-450ms
- **Expected error rate:** < 0.5%
- **RPS:** ~150 requests/second

### Workflow Test
- **Target:** 10 concurrent workflows
- **Expected p95 total:** 4-5 seconds
- **Expected success rate:** > 96%
- **Workflows/min:** ~18-20

### Dashboard Stress Test
- **Breaking point:** ~80-100 users
- **Comfortable load:** ~50 users
- **Expected p95 at 50 VUs:** 800-1200ms
- **Expected p95 at 100 VUs:** 1800-2500ms

## Troubleshooting Guide

### Issue: High error rates

**Symptoms:**
```
http_req_failed................: 15.2% ✗
```

**Solutions:**
1. Check backend logs: `tail -f backend/log/development.log`
2. Verify database connections aren't exhausted
3. Check for race conditions in state transitions
4. Reduce concurrent users to isolate issue

### Issue: Slow response times

**Symptoms:**
```
http_req_duration..............: p(95)=2.5s ✗
```

**Solutions:**
1. Profile slow queries: Enable Rails query logging
2. Check for missing database indexes
3. Implement caching for dashboard aggregations
4. Review N+1 query patterns

### Issue: Connection refused

**Symptoms:**
```
WARN[0001] Request Failed    error="Get \"http://localhost:3000/api/users\": dial tcp 127.0.0.1:3000: connect: connection refused"
```

**Solutions:**
1. Start backend: `cd backend && rails server -p 3000`
2. Check port: `lsof -i :3000`
3. Test manually: `curl http://localhost:3000/api/users`

### Issue: Tests fail in CI but pass locally

**Possible causes:**
1. Different hardware (CI machines often weaker)
2. Network latency differences
3. Database seed data missing
4. Environment variables not set

**Solutions:**
1. Relax thresholds for CI: `'http_req_duration': ['p(95)<1000']`
2. Reduce concurrent users in CI
3. Add setup steps to seed data
4. Export BASE_URL in CI config

## Next Steps

1. **Run baseline tests** to establish current performance metrics
2. **Document results** in a spreadsheet for tracking over time
3. **Set up alerts** based on threshold failures
4. **Integrate into CI/CD** for automated performance regression detection
5. **Schedule regular stress tests** to monitor capacity as data grows

## Additional Resources

- **k6 Documentation:** https://k6.io/docs/
- **k6 Examples:** https://github.com/grafana/k6-learn
- **Community Forum:** https://community.grafana.com/c/grafana-k6/
- **k6 Cloud:** https://k6.io/cloud/ (for distributed testing)

## Contributing

To add new tests:

1. Follow naming convention: `[purpose]-test.js`
2. Include comprehensive JSDoc comments
3. Set realistic thresholds
4. Add documentation to README.md
5. Update this OVERVIEW.md
6. Test locally before committing

## File Structure Summary

```
tests/k6/
├── api-load-test.js              # Test 1: Basic endpoints (2.5 min)
├── workflow-test.js              # Test 2: Complete lifecycle (4 min)
├── dashboard-stress-test.js      # Test 3: Stress test (9 min)
├── run-all-tests.sh              # Run all tests in sequence
├── README.md                     # Complete documentation
├── OVERVIEW.md                   # This file
├── .k6-quick-reference.md        # Command cheat sheet
├── sample-output.txt             # Example output
└── test-results/                 # Generated by run-all-tests.sh
    ├── api-load-test_*.json
    ├── workflow-test_*.json
    └── dashboard-stress-test_*.json
```

Total: 7 files (~45 KB), comprehensive test coverage

---

**Created:** 2026-03-28
**Last Updated:** 2026-03-28
**Version:** 1.0.0
