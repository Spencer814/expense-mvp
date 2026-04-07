#!/bin/bash

###############################################################################
# K6 Performance Test Suite Runner
#
# This script runs all k6 performance tests in sequence and generates
# a consolidated report.
#
# Usage:
#   ./tests/k6/run-all-tests.sh
#   ./tests/k6/run-all-tests.sh --skip-stress  # Skip long stress test
#   ./tests/k6/run-all-tests.sh --quick        # Run quick versions only
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000/api}"
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse arguments
SKIP_STRESS=false
QUICK_MODE=false

for arg in "$@"; do
  case $arg in
    --skip-stress)
      SKIP_STRESS=true
      shift
      ;;
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo ""
      echo "Options:"
      echo "  --skip-stress    Skip the long-running stress test"
      echo "  --quick         Run abbreviated versions of tests"
      echo "  --help          Show this help message"
      exit 0
      ;;
  esac
done

###############################################################################
# Functions
###############################################################################

print_header() {
  echo ""
  echo -e "${BLUE}============================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check if k6 is installed
  if ! command -v k6 &> /dev/null; then
    print_error "k6 is not installed"
    echo ""
    echo "Install k6:"
    echo "  macOS:   brew install k6"
    echo "  Linux:   See https://k6.io/docs/getting-started/installation/"
    echo "  Docker:  docker pull grafana/k6"
    exit 1
  fi

  print_success "k6 is installed ($(k6 version))"

  # Check if API is accessible
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users" | grep -q "200"; then
    print_success "API is accessible at $BASE_URL"
  else
    print_error "API is not accessible at $BASE_URL"
    echo ""
    echo "Please start the backend API:"
    echo "  cd backend && rails server -p 3000"
    exit 1
  fi

  # Create results directory
  mkdir -p "$RESULTS_DIR"
  print_success "Results directory created: $RESULTS_DIR"
}

run_test() {
  local test_name=$1
  local test_file=$2
  local output_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.json"

  print_header "Running: $test_name"

  echo "Test file: $test_file"
  echo "Output: $output_file"
  echo ""

  if k6 run --out json="$output_file" "$test_file"; then
    print_success "$test_name completed successfully"
    return 0
  else
    print_error "$test_name failed"
    return 1
  fi
}

generate_summary() {
  print_header "Test Suite Summary"

  echo "Timestamp: $TIMESTAMP"
  echo "Base URL: $BASE_URL"
  echo ""

  # Count results
  local total_tests=$(ls "$RESULTS_DIR"/*_${TIMESTAMP}.json 2>/dev/null | wc -l)

  if [ "$total_tests" -eq 0 ]; then
    print_warning "No test results found"
    return
  fi

  echo "Total tests run: $total_tests"
  echo ""

  # List result files
  echo "Result files:"
  ls -lh "$RESULTS_DIR"/*_${TIMESTAMP}.json 2>/dev/null | awk '{print "  - " $9 " (" $5 ")"}'

  echo ""
  print_success "All test results saved to: $RESULTS_DIR"

  # Generate consolidated report
  local report_file="$RESULTS_DIR/consolidated_report_${TIMESTAMP}.txt"

  cat > "$report_file" <<EOF
================================================================================
K6 PERFORMANCE TEST REPORT
================================================================================

Generated: $(date)
Base URL: $BASE_URL

Test Results:
$(ls "$RESULTS_DIR"/*_${TIMESTAMP}.json 2>/dev/null | sed 's/^/  - /')

Summary:
  - Total Tests: $total_tests
  - All results: $RESULTS_DIR

To view individual results:
  cat $RESULTS_DIR/[test-name]_${TIMESTAMP}.json | jq

To analyze metrics:
  jq '.metrics.http_req_duration' $RESULTS_DIR/[test-name]_${TIMESTAMP}.json

================================================================================
EOF

  print_success "Consolidated report: $report_file"
}

###############################################################################
# Main Execution
###############################################################################

main() {
  print_header "K6 Performance Test Suite"

  if [ "$QUICK_MODE" = true ]; then
    print_warning "Running in QUICK mode (reduced load)"
  fi

  if [ "$SKIP_STRESS" = true ]; then
    print_warning "Skipping stress test"
  fi

  echo "Configuration:"
  echo "  Base URL: $BASE_URL"
  echo "  Results: $RESULTS_DIR"
  echo ""

  # Check prerequisites
  check_prerequisites

  # Track results
  local failed_tests=0

  # Run Test 1: API Load Test
  if run_test "api-load-test" "tests/k6/api-load-test.js"; then
    echo ""
  else
    ((failed_tests++))
  fi

  echo ""
  sleep 2  # Brief pause between tests

  # Run Test 2: Workflow Test
  if run_test "workflow-test" "tests/k6/workflow-test.js"; then
    echo ""
  else
    ((failed_tests++))
  fi

  # Run Test 3: Stress Test (unless skipped)
  if [ "$SKIP_STRESS" = false ]; then
    echo ""
    sleep 2  # Brief pause before stress test

    print_warning "Starting stress test - this will take ~9 minutes"
    echo ""

    if run_test "dashboard-stress-test" "tests/k6/dashboard-stress-test.js"; then
      echo ""
    else
      ((failed_tests++))
    fi
  else
    print_warning "Stress test skipped (use without --skip-stress to run)"
  fi

  # Generate summary
  echo ""
  generate_summary

  # Final status
  echo ""
  if [ $failed_tests -eq 0 ]; then
    print_header "All Tests Passed! 🎉"
    exit 0
  else
    print_header "Some Tests Failed"
    print_error "$failed_tests test(s) failed"
    exit 1
  fi
}

# Run main function
main

###############################################################################
# End of script
###############################################################################
