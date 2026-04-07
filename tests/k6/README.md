# K6 Performance Testing Suite

This directory contains k6 performance tests for the Expense Approval MVP API.

## Overview

The test suite includes three types of performance tests:

1. **API Load Test** - Tests basic endpoints under realistic load
2. **Workflow Test** - Tests complete expense lifecycle under concurrent load
3. **Dashboard Stress Test** - Finds the breaking point of dashboard aggregation

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

**Windows:**
```powershell
choco install k6
# or
winget install k6
```

**Docker (all platforms):**
```bash
docker pull grafana/k6
```

### Verify Installation

```bash
k6 version
```

## Running the Tests

Make sure your backend API is running before executing tests:

```bash
cd backend
rails server -p 3000
```

### 1. API Load Test

Tests basic GET endpoints with realistic user load patterns.

**Run:**
```bash
k6 run tests/k6/api-load-test.js
```

**What it tests:**
- `GET /api/expenses` - List expenses
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/users` - User list

**Load profile:**
- Ramps from 10 → 30 → 50 virtual users
- Sustains 50 users for 1 minute
- Total duration: ~2.5 minutes

**Success criteria:**
- ✅ 95th percentile response time < 500ms
- ✅ Error rate < 1%
- ✅ Dashboard p95 < 750ms

**Expected output:**
```
✓ expenses - status is 200
✓ expenses - response is JSON
✓ dashboard - status is 200
✓ dashboard - has metrics

checks.........................: 99.xx% ✓ xxxx ✗ xx
http_req_duration..............: avg=xxx ms p(95)=xxx ms
```

### 2. Workflow Test

Tests the complete expense approval workflow with role-based operations.

**Run:**
```bash
k6 run tests/k6/workflow-test.js
```

**What it tests:**
Complete lifecycle for each virtual user:
1. Employee creates expense → `POST /api/expenses`
2. Employee submits → `POST /api/expenses/:id/submit`
3. Manager approves → `POST /api/expenses/:id/approve`
4. Finance pays → `POST /api/expenses/:id/pay`

**Load profile:**
- 5-10 concurrent users
- Each completes full workflow
- 4 minute total duration

**Success criteria:**
- ✅ 95% workflow completion rate
- ✅ Each step p95 < 750ms
- ✅ Full workflow p95 < 5 seconds

**Expected output:**
```
✓ create - status is 201
✓ submit - status is 200
✓ approve - status is 200
✓ pay - status is 200

workflow_success...............: 95.xx% ✓ xxx
completed_workflows............: xxx
```

### 3. Dashboard Stress Test

Gradually increases load to find the breaking point.

**Run:**
```bash
k6 run tests/k6/dashboard-stress-test.js
```

**What it tests:**
- Dashboard aggregation under increasing load
- Response time degradation patterns
- System recovery after stress

**Load profile:**
- Gradual ramp: 10 → 20 → 40 → 60 → 80 → 100 users
- 9 minute total duration
- Identifies breaking point

**Success criteria:**
- ✅ Median response time < 1s
- ✅ 90th percentile < 3s
- ✅ Error rate < 10% (stress allows higher errors)

**Expected output:**
```
╔════════════════════════════════════════╗
║   DASHBOARD STRESS TEST SUMMARY        ║
╠════════════════════════════════════════╣
║ Success Rate:       95.xx%             ║
║ Avg Response Time:  xxx ms             ║
║ P95 Response Time:  xxx ms             ║
╚════════════════════════════════════════╝
```

## Customizing Tests

### Change Base URL

```bash
# Use environment variable
BASE_URL=http://production-api.com k6 run tests/k6/api-load-test.js

# Or edit the script
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
```

### Adjust Load Levels

Edit the `options.stages` array in each test:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Change target users
    { duration: '2m', target: 100 },  // Change duration
  ],
};
```

### Modify Thresholds

```javascript
thresholds: {
  'http_req_duration': ['p(95)<1000'],  // Make stricter/looser
  'errors': ['rate<0.05'],              // Adjust error tolerance
}
```

## Interpreting Results

### Key Metrics

| Metric | Description | Good Target |
|--------|-------------|-------------|
| `http_req_duration` | Time to complete request | p95 < 500ms |
| `http_req_failed` | % of failed requests | < 1% |
| `checks` | % of assertion passes | > 95% |
| `iterations` | Completed test iterations | Higher is better |
| `vus` | Current virtual users | Matches config |

### Response Time Percentiles

- **p(50)** - Median: Half of requests faster
- **p(90)** - 90th percentile: 90% of requests faster
- **p(95)** - 95th percentile: Typical SLA threshold
- **p(99)** - 99th percentile: Worst-case user experience

### Understanding Check Failures

```bash
# Look for specific check failures
✗ dashboard - status is 200        # API errors
✗ create - has expense id          # Missing data in response
✗ submit - status is submitted     # State transition issues
```

### Common Issues

**High error rates:**
- Check backend logs for exceptions
- Verify database can handle concurrent writes
- Check for deadlocks or race conditions

**Slow response times:**
- Profile slow database queries
- Consider adding indexes
- Implement caching for dashboard aggregations

**Failed checks:**
- Validate API response formats
- Check role-based access logic
- Verify state machine transitions

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/performance.yml`:

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest

    services:
      rails:
        image: rails:latest
        ports:
          - 3000:3000

    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Setup Backend
        run: |
          cd backend
          bundle install
          rails db:migrate
          rails db:seed
          rails server -p 3000 &
          sleep 5

      - name: Run API Load Test
        run: k6 run tests/k6/api-load-test.js

      - name: Run Workflow Test
        run: k6 run tests/k6/workflow-test.js

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: |
            summary.json
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
performance:
  stage: test
  image: grafana/k6:latest
  services:
    - name: ruby:3.0
      alias: api
  script:
    - k6 run tests/k6/api-load-test.js
    - k6 run tests/k6/workflow-test.js
  artifacts:
    paths:
      - summary.json
    expire_in: 1 week
```

### Docker Compose Integration

Create `docker-compose.perf.yml`:

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - RAILS_ENV=test

  k6:
    image: grafana/k6:latest
    depends_on:
      - api
    volumes:
      - ./tests/k6:/scripts
    command: run /scripts/api-load-test.js
    environment:
      - BASE_URL=http://api:3000/api
```

Run with:
```bash
docker-compose -f docker-compose.perf.yml up
```

## Advanced Usage

### Output Results to JSON

```bash
k6 run --out json=results.json tests/k6/api-load-test.js
```

### Generate HTML Report

```bash
# Using k6-reporter
npm install -g k6-to-junit

k6 run --out json=results.json tests/k6/api-load-test.js
k6-to-junit results.json > results.xml
```

### Cloud Integration (k6 Cloud)

```bash
# Sign up at k6.io/cloud
k6 login cloud

# Run test in cloud
k6 cloud tests/k6/api-load-test.js
```

### Distributed Load Testing

Use k6 Operator on Kubernetes:

```yaml
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: expense-load-test
spec:
  parallelism: 4
  script:
    configMap:
      name: api-load-test
      file: api-load-test.js
```

## Performance Baseline

Expected performance on standard hardware (4 CPU, 8GB RAM):

| Test | VUs | RPS | Avg Response | P95 Response | Error Rate |
|------|-----|-----|--------------|--------------|------------|
| API Load | 50 | ~150 | 150ms | 400ms | < 0.5% |
| Workflow | 10 | ~40 | 250ms | 800ms | < 1% |
| Dashboard Stress | 100 | ~200 | 800ms | 2500ms | < 5% |

## Troubleshooting

### "Connection refused" errors
```bash
# Ensure backend is running
cd backend && rails server -p 3000

# Check if port is accessible
curl http://localhost:3000/api/users
```

### High memory usage during tests
```bash
# Reduce virtual users or use ramping
# Increase --max-vus flag
k6 run --max-vus 200 tests/k6/api-load-test.js
```

### Rate limiting errors (429)
```bash
# Add delays or adjust backend rate limits
# In test script, increase sleep times
sleep(Math.random() * 5 + 2);  // Longer pauses
```

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6-learn)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/api-load-testing/)
- [Grafana k6 Community](https://community.grafana.com/c/grafana-k6/)

## Contributing

When adding new performance tests:

1. Follow the existing structure and naming conventions
2. Include comprehensive comments explaining the test purpose
3. Set realistic thresholds based on expected performance
4. Add documentation to this README
5. Test locally before committing

## License

Same as parent project.
