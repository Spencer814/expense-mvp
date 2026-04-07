# Expense MVP - Quick Start Guide

This guide will get your Expense Approval MVP up and running in minutes.

## Current Status

✅ **Backend API** - Fully configured and ready
⏳ **Frontend** - Not yet created
⏳ **Testing** - Pending

## Prerequisites Check

Run these commands to check your environment:

```bash
# Check Ruby version (need 3.2+)
ruby --version

# Check if rbenv is installed
which rbenv

# Check if Rails is installed
which rails
```

## Option 1: Quick Setup (If You Have Ruby 3.2+)

If `ruby --version` shows 3.2.0 or higher, you're ready to go:

```bash
cd ~/source/repos/GitHub/expense-mvp/backend

# Install dependencies
bundle install

# Set up database
rails db:create
rails db:migrate
rails db:seed

# Start server
rails server
```

Visit http://localhost:3000/api/users to verify it's working.

## Option 2: Full Setup (Need to Install Ruby)

If your Ruby version is below 3.2.0, follow these steps:

### 1. Install rbenv and Ruby

```bash
# Install rbenv via Homebrew
brew install rbenv ruby-build

# Initialize rbenv in your shell
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.2.2
rbenv install 3.2.2

# Set as local version for this project
cd ~/source/repos/GitHub/expense-mvp
rbenv local 3.2.2

# Verify
ruby --version  # Should show ruby 3.2.2
```

### 2. Install Rails

```bash
gem install rails -v 7.0.8
gem install bundler
```

### 3. Set Up Backend

```bash
cd ~/source/repos/GitHub/expense-mvp/backend

# Install all dependencies
bundle install

# Create and migrate database
rails db:create
rails db:migrate

# Load seed data
rails db:seed

# Start the server
rails server
```

## Verify Installation

### Test the API

Open a new terminal and run:

```bash
# List all users
curl http://localhost:3000/api/users

# List all expenses
curl http://localhost:3000/api/expenses

# Get dashboard metrics
curl http://localhost:3000/api/dashboard
```

You should see JSON responses with user and expense data.

### Seed Data Includes

**Users:**
- Employee: Emma Employee (emma.employee@example.com, ID: usually 3)
- Manager: Mike Manager (mike.manager@example.com, ID: usually 2)
- Finance: Sarah Finance (sarah.finance@example.com, ID: usually 1)

**Expenses:**
- 1 Draft (editable)
- 2 Submitted (awaiting approval)
- 1 Approved (awaiting payment)
- 1 Paid (completed)
- 1 Rejected (denied)

## Test the Workflow

Try these API calls to test the expense workflow:

```bash
# Create a new expense
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "expense": {
      "user_id": 3,
      "title": "New Test Expense",
      "vendor_name": "Test Vendor",
      "amount_cents": 5000,
      "expense_date": "2026-03-28",
      "category": "supplies",
      "description": "Testing the API"
    }
  }'

# Submit an expense (use the ID from the response above or an existing draft)
curl -X POST http://localhost:3000/api/expenses/1/submit

# Approve an expense (as a manager)
curl -X POST http://localhost:3000/api/expenses/1/approve \
  -H "Content-Type: application/json" \
  -d '{"approver_id": 2, "comment": "Approved!"}'

# Mark as paid (as finance)
curl -X POST http://localhost:3000/api/expenses/1/pay
```

## Common Issues

### "bundle: command not found"
```bash
gem install bundler
rbenv rehash
```

### "rails: command not found"
```bash
gem install rails -v 7.0.8
rbenv rehash
```

### "SQLite3 error"
```bash
# On macOS with Homebrew
brew install sqlite3

# Then retry bundle install
bundle install
```

### Port 3000 already in use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
rails server -p 3001
```

## Project Structure

```
expense-mvp/
├── backend/              # Rails API (READY)
│   ├── app/
│   │   ├── controllers/  # API endpoints
│   │   ├── models/       # Business logic
│   │   └── serializers/  # JSON formatting
│   ├── config/           # Configuration
│   ├── db/
│   │   ├── migrate/      # Database migrations
│   │   └── seeds.rb      # Sample data
│   └── spec/             # RSpec tests
├── frontend/             # React app (TODO)
├── BUILD-LOG.md          # Detailed build log
├── SETUP-INSTRUCTIONS.md # Detailed setup guide
└── QUICKSTART.md         # This file
```

## Next Steps

1. ✅ Backend API is running
2. ⏳ Create React frontend
3. ⏳ Connect frontend to backend
4. ⏳ Test complete workflow

## Need Help?

- See `backend/README.md` for API documentation
- See `SETUP-INSTRUCTIONS.md` for detailed Ruby/Rails setup
- See `BUILD-LOG.md` for complete build history and decisions

## API Documentation

Once the server is running, these endpoints are available:

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details

### Expenses
- `GET /api/expenses` - List expenses (supports ?status= and ?user_id= filters)
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses` - Create new expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/submit` - Submit for approval
- `POST /api/expenses/:id/approve` - Approve (requires approver_id)
- `POST /api/expenses/:id/reject` - Reject (requires approver_id and comment)
- `POST /api/expenses/:id/pay` - Mark as paid

### Dashboard
- `GET /api/dashboard` - Get aggregated metrics

Happy coding!
