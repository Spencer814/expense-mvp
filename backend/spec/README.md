# RSpec Test Suite for Expense Approval MVP

This directory contains comprehensive test coverage for the Expense Approval MVP backend.

## Setup

### 1. Install Testing Gems

```bash
cd backend
bundle install
```

This will install:
- `rspec-rails` - RSpec testing framework for Rails
- `factory_bot_rails` - Test data factories
- `database_cleaner-active_record` - Database cleaning strategies
- `faker` - Realistic fake data generation

### 2. Initialize RSpec (if not already done)

```bash
rails generate rspec:install
```

Note: This project already has RSpec configured, so this step may not be necessary.

### 3. Create and Migrate Test Database

```bash
RAILS_ENV=test rails db:create
RAILS_ENV=test rails db:migrate
```

## Running Tests

### Run All Tests

```bash
bundle exec rspec
```

### Run Specific Test Files

```bash
# Model tests
bundle exec rspec spec/models/user_spec.rb
bundle exec rspec spec/models/expense_spec.rb
bundle exec rspec spec/models/approval_spec.rb

# Request tests
bundle exec rspec spec/requests/api/expenses_spec.rb
bundle exec rspec spec/requests/api/dashboard_spec.rb
bundle exec rspec spec/requests/api/users_spec.rb
```

### Run Tests by Type

```bash
# All model tests
bundle exec rspec spec/models

# All request tests
bundle exec rspec spec/requests
```

### Run Specific Test Example

```bash
# Run a specific describe block or it example
bundle exec rspec spec/models/user_spec.rb:25
```

### Run with Different Formats

```bash
# Documentation format (detailed output)
bundle exec rspec --format documentation

# Progress format (dots)
bundle exec rspec --format progress

# HTML output
bundle exec rspec --format html --out rspec_results.html
```

## Test Structure

```
spec/
├── factories/           # FactoryBot factories for test data
│   ├── users.rb        # User factory with role traits
│   ├── expenses.rb     # Expense factory with status traits
│   └── approvals.rb    # Approval factory
├── models/             # Model unit tests
│   ├── user_spec.rb    # User model tests
│   ├── expense_spec.rb # Expense model tests
│   └── approval_spec.rb # Approval model tests
├── requests/           # API endpoint tests
│   └── api/
│       ├── expenses_spec.rb  # Expense endpoints
│       ├── dashboard_spec.rb # Dashboard aggregations
│       └── users_spec.rb     # User endpoints
├── rails_helper.rb     # Rails-specific RSpec configuration
├── spec_helper.rb      # General RSpec configuration
└── README.md          # This file
```

## Test Coverage

### Model Tests (spec/models/)

**user_spec.rb** - 40+ test cases covering:
- Validations (name, email, role)
- Role enum (employee, manager, finance)
- Associations (expenses, approvals, team_members, manager)
- Manager/team_members bidirectional relationship
- Role-specific behavior

**expense_spec.rb** - 60+ test cases covering:
- Validations (title, amount_cents, expense_date, user)
- Status enum (draft, submitted, approved, rejected, paid)
- Associations (user, approvals)
- Scopes (for_user, for_team)
- amount_dollars conversion method
- Status transitions and timestamp tracking
- Business logic

**approval_spec.rb** - 30+ test cases covering:
- Validations (expense, approver, approved)
- Associations (expense, approver)
- Approval/rejection workflow
- Audit trail functionality
- Business rules

### Request Tests (spec/requests/api/)

**expenses_spec.rb** - 50+ test cases covering:
- GET /api/expenses - Role-based filtering (employee, manager, finance)
- GET /api/expenses/:id - Show endpoint
- POST /api/expenses - Create with validation
- PATCH /api/expenses/:id - Update (only drafts)
- POST /api/expenses/:id/submit - Submit transition
- POST /api/expenses/:id/approve - Manager approval
- POST /api/expenses/:id/reject - Manager rejection
- POST /api/expenses/:id/pay - Finance payment
- POST /api/expenses/:id/parse_receipt - Mock OCR
- Authorization checks

**dashboard_spec.rb** - 25+ test cases covering:
- Status count aggregations
- Category totals (amount and count)
- Amount aggregations
- Finance-only authorization
- Date range filtering
- Performance with large datasets

**users_spec.rb** - 30+ test cases covering:
- GET /api/users - List all users
- Response format validation
- Role filtering
- Manager-employee relationships
- Edge cases (special characters, long names)
- Performance testing

## Factories

### User Factory

```ruby
# Basic usage
create(:user)                    # Default employee
create(:user, :employee)         # Employee
create(:user, :manager)          # Manager
create(:user, :finance)          # Finance
create(:manager_with_team)       # Manager with 3 team members
create(:manager_with_team, team_members_count: 5)  # Custom count
```

### Expense Factory

```ruby
# Status traits
create(:expense, :draft)
create(:expense, :submitted)
create(:expense, :approved)      # Includes approval
create(:expense, :rejected)      # Includes rejection
create(:expense, :paid)

# Additional traits
create(:expense, :with_receipt)
create(:expense, :high_value)    # $5,000
create(:expense, :low_value)     # $5
create(:expense, :recent)
create(:expense, :old)

# Combine traits
create(:expense, :submitted, :high_value, :with_receipt)
```

### Approval Factory

```ruby
create(:approval)                # Default approved
create(:approval, :approved)     # Explicitly approved
create(:approval, :rejected)     # Rejected
create(:approval, :with_detailed_comments)
create(:approval, :without_comments)
```

## Configuration

### Database Cleaner

Tests use Database Cleaner with transaction strategy:
- Each test runs in a transaction
- Database is rolled back after each test
- Ensures test isolation

### FactoryBot

FactoryBot methods are included globally:
- Use `create`, `build`, `build_stubbed` without prefix
- Configured in `rails_helper.rb`

## Continuous Integration

### Running Tests in CI

```bash
# Setup
bundle install --jobs=4 --retry=3
RAILS_ENV=test rails db:create db:migrate

# Run tests
bundle exec rspec --format progress --format RspecJunitFormatter --out rspec.xml
```

### Test Performance

- Full test suite should complete in < 30 seconds
- Individual test files in < 5 seconds
- Use `--profile` flag to identify slow tests:

```bash
bundle exec rspec --profile 10
```

## Troubleshooting

### Database Issues

```bash
# Reset test database
RAILS_ENV=test rails db:reset

# Or drop and recreate
RAILS_ENV=test rails db:drop db:create db:migrate
```

### Factory Issues

```bash
# Check if factories are valid
bundle exec rake factory_bot:lint
```

### Debugging Tests

```ruby
# Add to any test
require 'pry'

it 'does something' do
  binding.pry  # Debugger will stop here
  expect(something).to eq(something_else)
end
```

### Running Tests in Random Order

```bash
# Run with specific seed
bundle exec rspec --seed 12345

# Find seed that causes failures
bundle exec rspec --order random
```

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on other tests
2. **Clear Test Names**: Use descriptive `it` block names
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion
4. **Factory Usage**: Use factories instead of creating records manually
5. **Let vs Before**: Use `let` for lazy-loaded variables, `before` for setup
6. **Subject**: Use `subject` for the object under test
7. **Shared Examples**: Create shared examples for common behavior
8. **Test Coverage**: Aim for >90% coverage on critical business logic

## Adding New Tests

### Model Test Template

```ruby
require 'rails_helper'

RSpec.describe MyModel, type: :model do
  describe 'validations' do
    subject { build(:my_model) }

    it 'is valid with valid attributes' do
      expect(subject).to be_valid
    end
  end

  describe 'associations' do
    # Test relationships
  end

  describe 'methods' do
    # Test custom methods
  end
end
```

### Request Test Template

```ruby
require 'rails_helper'

RSpec.describe 'Api::MyResource', type: :request do
  let(:user) { create(:user) }

  describe 'GET /api/my_resource' do
    it 'returns success' do
      get '/api/my_resource', headers: { 'X-User-Id' => user.id }
      expect(response).to have_http_status(:ok)
    end
  end
end
```

## Resources

- [RSpec Documentation](https://rspec.info/)
- [FactoryBot Documentation](https://github.com/thoughtbot/factory_bot)
- [Database Cleaner](https://github.com/DatabaseCleaner/database_cleaner)
- [Better Specs](https://www.betterspecs.org/)

## Test Metrics

Run these commands to analyze test quality:

```bash
# Test coverage (requires simplecov gem)
COVERAGE=true bundle exec rspec

# Find slow tests
bundle exec rspec --profile 20

# Check for pending tests
bundle exec rspec --format documentation | grep PENDING
```
