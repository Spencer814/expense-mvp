# Factory Quick Reference Guide

This guide provides quick examples for using the test factories in the Expense Approval MVP.

## User Factory

### Basic Usage

```ruby
# Create a default employee user
user = create(:user)

# Build without saving to database
user = build(:user)

# Build with stubbed attributes (faster, no database)
user = build_stubbed(:user)
```

### Role Traits

```ruby
# Employee (default)
employee = create(:user, :employee)

# Manager
manager = create(:user, :manager)

# Finance
finance = create(:user, :finance)
```

### Custom Attributes

```ruby
# Override factory defaults
user = create(:user, name: 'John Doe', email: 'john@example.com')

# Manager with custom name
manager = create(:user, :manager, name: 'Jane Manager')
```

### Manager with Team

```ruby
# Create manager with 3 team members (default)
manager = create(:manager_with_team)

# Create manager with custom number of team members
manager = create(:manager_with_team, team_members_count: 5)

# Access team members
manager.team_members.count # => 5
manager.team_members.first.manager # => manager
```

### Manager-Employee Relationship

```ruby
# Create manager
manager = create(:user, :manager)

# Create employee reporting to manager
employee = create(:user, :employee, manager: manager)

# Verify relationship
employee.manager # => manager
manager.team_members # => [employee]
```

## Expense Factory

### Basic Usage

```ruby
# Create expense for a user
user = create(:user)
expense = create(:expense, user: user)

# Amount in cents (stored as integer)
expense = create(:expense, amount_cents: 5000) # $50.00
expense.amount_dollars # => 50.0
```

### Status Traits

```ruby
# Draft (default)
expense = create(:expense, :draft)
expense.status # => "draft"

# Submitted
expense = create(:expense, :submitted)
expense.status # => "submitted"
expense.submitted_at # => Time object

# Approved (creates approval record automatically)
expense = create(:expense, :approved)
expense.status # => "approved"
expense.approved_at # => Time object
expense.approvals.count # => 1

# Rejected (creates approval record with approved=false)
expense = create(:expense, :rejected)
expense.status # => "rejected"
expense.rejected_at # => Time object

# Paid
expense = create(:expense, :paid)
expense.status # => "paid"
expense.paid_at # => Time object
```

### Additional Traits

```ruby
# With receipt URL
expense = create(:expense, :with_receipt)
expense.receipt_url # => "https://example.com/receipt.jpg"

# High value ($5,000)
expense = create(:expense, :high_value)
expense.amount_cents # => 500000
expense.amount_dollars # => 5000.0

# Low value ($5)
expense = create(:expense, :low_value)
expense.amount_cents # => 500

# Recent expense (today)
expense = create(:expense, :recent)
expense.expense_date # => Date.today

# Old expense (90 days ago)
expense = create(:expense, :old)
expense.expense_date # => 90.days.ago
```

### Combining Traits

```ruby
# Submitted high-value expense with receipt
expense = create(:expense, :submitted, :high_value, :with_receipt)

# Approved recent expense
expense = create(:expense, :approved, :recent)
```

### Custom Attributes

```ruby
# Override any attribute
expense = create(:expense,
  title: 'Team Lunch',
  description: 'Quarterly team building',
  amount_cents: 15000,
  expense_date: Date.yesterday,
  category: 'meals'
)
```

### Creating Multiple Expenses

```ruby
# Create 5 draft expenses
expenses = create_list(:expense, 5, :draft)

# Create 3 submitted expenses for a user
user = create(:user)
expenses = create_list(:expense, 3, :submitted, user: user)
```

## Approval Factory

### Basic Usage

```ruby
# Create approval (approved by default)
expense = create(:expense, :submitted)
manager = create(:user, :manager)
approval = create(:approval, expense: expense, approver: manager)

approval.approved # => true
approval.comments # => "Approved - looks good"
```

### Approval/Rejection Traits

```ruby
# Approved
approval = create(:approval, :approved)
approval.approved # => true
approval.comments # => "Approved - looks good"

# Rejected
approval = create(:approval, :rejected)
approval.approved # => false
approval.comments # => "Rejected - needs more information"
```

### Comment Traits

```ruby
# With detailed comments (paragraph)
approval = create(:approval, :with_detailed_comments)

# Without comments
approval = create(:approval, :without_comments)
approval.comments # => nil
```

### Custom Approval

```ruby
expense = create(:expense, :submitted)
manager = create(:user, :manager)

# Approve with custom comment
approval = create(:approval,
  expense: expense,
  approver: manager,
  approved: true,
  comments: 'Great documentation, approved!'
)

# Reject with custom reason
approval = create(:approval,
  expense: expense,
  approver: manager,
  approved: false,
  comments: 'Please provide original receipt'
)
```

### Multiple Approvals (Audit Trail)

```ruby
expense = create(:expense, :submitted)
manager1 = create(:user, :manager, name: 'First Manager')
manager2 = create(:user, :manager, name: 'Second Manager')

# First rejection
create(:approval,
  expense: expense,
  approver: manager1,
  approved: false,
  comments: 'Need more details'
)

# Later approval from different manager
create(:approval,
  expense: expense,
  approver: manager2,
  approved: true,
  comments: 'Details provided, approved'
)

expense.approvals.count # => 2
```

## Common Test Scenarios

### Employee Creates and Submits Expense

```ruby
employee = create(:user, :employee)
expense = create(:expense, :draft, user: employee)

# Employee submits
expense.update(status: :submitted, submitted_at: Time.current)
```

### Manager Approves Team Member's Expense

```ruby
manager = create(:user, :manager)
employee = create(:user, :employee, manager: manager)
expense = create(:expense, :submitted, user: employee)

# Manager approves
create(:approval, expense: expense, approver: manager, approved: true)
expense.update(status: :approved, approved_at: Time.current)
```

### Finance Pays Approved Expense

```ruby
finance = create(:user, :finance)
expense = create(:expense, :approved)

# Finance marks as paid
expense.update(status: :paid, paid_at: Time.current)
```

### Complete Workflow

```ruby
# Setup users
employee = create(:user, :employee)
manager = create(:user, :manager)
finance = create(:user, :finance)
employee.update(manager: manager)

# Employee creates draft
expense = create(:expense, :draft, user: employee, amount_cents: 5000)

# Employee submits
expense.update(status: :submitted, submitted_at: Time.current)

# Manager approves
create(:approval, expense: expense, approver: manager, approved: true)
expense.update(status: :approved, approved_at: Time.current)

# Finance pays
expense.update(status: :paid, paid_at: Time.current)

# Verify complete
expense.reload
expense.status # => "paid"
expense.submitted_at # => Time
expense.approved_at # => Time
expense.paid_at # => Time
expense.approvals.count # => 1
```

### Dashboard Scenario

```ruby
# Create diverse expenses for dashboard
create_list(:expense, 5, :draft)
create_list(:expense, 3, :submitted)
create_list(:expense, 2, :approved)
create_list(:expense, 4, :paid)
create_list(:expense, 1, :rejected)

# Expenses by category
create(:expense, :submitted, category: 'travel', amount_cents: 100000)
create(:expense, :approved, category: 'meals', amount_cents: 5000)
create(:expense, :paid, category: 'office_supplies', amount_cents: 2500)

# Query
Expense.where(status: :submitted).count # => 4 (3 + travel)
Expense.where(category: 'travel').sum(:amount_cents) # => 100000
```

### Team Expenses for Manager

```ruby
manager = create(:user, :manager)
team_member1 = create(:user, :employee, manager: manager)
team_member2 = create(:user, :employee, manager: manager)
other_employee = create(:user, :employee)

# Team expenses
create(:expense, :submitted, user: team_member1)
create(:expense, :submitted, user: team_member2)

# Other employee expense (not visible to manager)
create(:expense, :submitted, user: other_employee)

# Query team expenses
Expense.for_team(manager).count # => 2
```

## Tips and Best Practices

### Use `let` for Lazy Loading

```ruby
RSpec.describe Expense, type: :model do
  let(:user) { create(:user) }
  let(:expense) { create(:expense, user: user) }

  it 'belongs to a user' do
    expect(expense.user).to eq(user)
  end
end
```

### Use `build` When You Don't Need Persistence

```ruby
# Faster for validation tests
it 'is invalid without a title' do
  expense = build(:expense, title: nil)
  expect(expense).not_to be_valid
end
```

### Use `create_list` for Multiple Records

```ruby
# Instead of:
5.times { create(:expense) }

# Use:
create_list(:expense, 5)
```

### Combine Traits for Complex Scenarios

```ruby
# High-value, approved expense with receipt
expense = create(:expense, :approved, :high_value, :with_receipt, user: employee)
```

### Override Timestamps When Needed

```ruby
# Create old expense
old_expense = create(:expense, :paid)
old_expense.update_column(:paid_at, 30.days.ago)
```

## Debugging Factories

### Check Factory Validity

```bash
# In Rails console or test
bundle exec rake factory_bot:lint
```

### Inspect Factory Attributes

```ruby
# In Rails console
FactoryBot.build(:expense).attributes
# => { "id"=>nil, "user_id"=>123, "title"=>"Product Name", ... }
```

### Create with Logging

```ruby
# Enable factory_bot logging
FactoryBot.use_parent_strategy = false

# Shows SQL in test output
expense = create(:expense)
```

## Factory Dependencies

When factories depend on other factories:

```ruby
# Expense depends on User
expense = create(:expense)  # Automatically creates user

# Approval depends on Expense and User
approval = create(:approval)  # Automatically creates expense and manager
```

## Performance Considerations

```ruby
# Fastest (no database, no validation)
user = build_stubbed(:user)

# Fast (no database, runs validation)
user = build(:user)

# Slower (database insert)
user = create(:user)

# Slowest (multiple database inserts)
create(:expense, :approved)  # Creates expense + user + approval + manager
```

## Common Mistakes to Avoid

```ruby
# ❌ Don't create when you can build
it 'validates presence of title' do
  expense = create(:expense, title: nil)  # Database not needed
end

# ✅ Do this instead
it 'validates presence of title' do
  expense = build(:expense, title: nil)
end

# ❌ Don't use multiple creates when you need the same user
expense1 = create(:expense)  # Creates user A
expense2 = create(:expense)  # Creates user B (different)

# ✅ Do this instead
user = create(:user)
expense1 = create(:expense, user: user)
expense2 = create(:expense, user: user)
```

---

**Quick Links:**
- Full test documentation: `spec/README.md`
- Factory implementations: `spec/factories/`
- Test examples: `spec/models/`, `spec/requests/`
