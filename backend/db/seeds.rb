# frozen_string_literal: true

# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Clear existing data
puts 'Clearing existing data...'
Approval.destroy_all
Expense.destroy_all
User.destroy_all

puts 'Creating users...'

# Create Finance Admin
finance_admin = User.create!(
  name: 'Marta Puig',
  email: 'marta.puig@empresa.cat',
  role: 'finance',
  department: 'Finances'
)

puts "✓ Created finance admin: #{finance_admin.name} (#{finance_admin.email})"

# Create Manager
manager = User.create!(
  name: 'Jordi Soler',
  email: 'jordi.soler@empresa.cat',
  role: 'manager',
  department: 'Vendes'
)

puts "✓ Created manager: #{manager.name} (#{manager.email})"

# Create Employee
employee = User.create!(
  name: 'Núria Fernández',
  email: 'nuria.fernandez@empresa.cat',
  role: 'employee',
  department: 'Vendes',
  manager_id: manager.id
)

puts "✓ Created employee: #{employee.name} (#{employee.email})"

puts "\nCreating sample expenses..."

# Employee's Draft Expense
draft_expense = Expense.create!(
  user: employee,
  title: 'samples.officeSupplies.title',
  vendor_name: 'FNAC Triangle',
  amount_cents: 4500, # 45.00€
  currency: 'EUR',
  expense_date: Date.today - 2.days,
  category: 'supplies',
  description: 'samples.officeSupplies.description',
  status: 'draft'
)

puts "✓ Created draft expense: #{draft_expense.title} (#{draft_expense.amount_dollars}€)"

# Employee's Submitted Expense (awaiting approval)
submitted_expense = Expense.create!(
  user: employee,
  title: 'samples.businessLunch.title',
  vendor_name: 'Can Culleretes',
  amount_cents: 12_500, # 125.00€
  currency: 'EUR',
  expense_date: Date.today - 3.days,
  category: 'meals',
  description: 'samples.businessLunch.description',
  status: 'submitted',
  submitted_at: Time.current - 1.day
)

puts "✓ Created submitted expense: #{submitted_expense.title} (#{submitted_expense.amount_dollars}€)"

# Employee's Approved Expense (awaiting payment)
approved_expense = Expense.create!(
  user: employee,
  title: 'samples.softwareLicense.title',
  vendor_name: 'Salesforce EU',
  amount_cents: 29_900, # 299.00€
  currency: 'EUR',
  expense_date: Date.today - 7.days,
  category: 'software',
  description: 'samples.softwareLicense.description',
  status: 'approved',
  submitted_at: Time.current - 5.days,
  approved_at: Time.current - 3.days
)

# Create approval record for approved expense
Approval.create!(
  expense: approved_expense,
  approver: manager,
  decision: 'approved',
  comment: 'approvalComments.approved'
)

puts "✓ Created approved expense: #{approved_expense.title} (#{approved_expense.amount_dollars}€)"

# Employee's Paid Expense
paid_expense = Expense.create!(
  user: employee,
  title: 'samples.conferenceTravel.title',
  vendor_name: 'Vueling Airlines',
  amount_cents: 38_000, # 380.00€
  currency: 'EUR',
  expense_date: Date.today - 14.days,
  category: 'travel',
  description: 'samples.conferenceTravel.description',
  status: 'paid',
  submitted_at: Time.current - 12.days,
  approved_at: Time.current - 10.days,
  paid_at: Time.current - 8.days
)

# Create approval record for paid expense
Approval.create!(
  expense: paid_expense,
  approver: manager,
  decision: 'approved',
  comment: 'approvalComments.approvedConference'
)

puts "✓ Created paid expense: #{paid_expense.title} (#{paid_expense.amount_dollars}€)"

# Manager's Expense
manager_expense = Expense.create!(
  user: manager,
  title: 'samples.teamBuilding.title',
  vendor_name: 'PortAventura World',
  amount_cents: 65_000, # 650.00€
  currency: 'EUR',
  expense_date: Date.today - 5.days,
  category: 'other',
  description: 'samples.teamBuilding.description',
  status: 'submitted',
  submitted_at: Time.current - 2.days
)

puts "✓ Created manager expense: #{manager_expense.title} (#{manager_expense.amount_dollars}€)"

# Employee's Rejected Expense
rejected_expense = Expense.create!(
  user: employee,
  title: 'samples.personalItem.title',
  vendor_name: 'El Corte Inglés',
  amount_cents: 8000, # 80.00€
  currency: 'EUR',
  expense_date: Date.today - 10.days,
  category: 'other',
  description: 'samples.personalItem.description',
  status: 'rejected',
  submitted_at: Time.current - 8.days
)

# Create rejection approval record
Approval.create!(
  expense: rejected_expense,
  approver: manager,
  decision: 'rejected',
  comment: 'approvalComments.rejected'
)

puts "✓ Created rejected expense: #{rejected_expense.title} (#{rejected_expense.amount_dollars}€)"

puts "\n#{'=' * 80}"
puts 'Seed completed successfully!'
puts '=' * 80

puts "\nUsers created:"
puts "  - Finance: #{finance_admin.email} (ID: #{finance_admin.id})"
puts "  - Manager: #{manager.email} (ID: #{manager.id})"
puts "  - Employee: #{employee.email} (ID: #{employee.id})"

puts "\nExpenses created:"
puts "  Total: #{Expense.count} expenses"
puts "  - Draft: #{Expense.by_status('draft').count}"
puts "  - Submitted: #{Expense.by_status('submitted').count}"
puts "  - Approved: #{Expense.by_status('approved').count}"
puts "  - Rejected: #{Expense.by_status('rejected').count}"
puts "  - Paid: #{Expense.by_status('paid').count}"

puts "\nApprovals created:"
puts "  Total: #{Approval.count} approvals"

puts "\nYou can now:"
puts '  1. Start the server: rails server'
puts '  2. Test the API: curl http://localhost:3000/api/users'
puts '  3. View expenses: curl http://localhost:3000/api/expenses'
puts "\n"
