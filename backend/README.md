# Expense Approval MVP - Backend API

A Ruby on Rails API backend for managing expense submissions, approvals, and payments.

## Tech Stack

- Ruby 3.2+
- Rails 7.0.8
- SQLite3
- Rack CORS
- Active Model Serializers

## Features

- User management with roles (employee, manager, finance)
- Expense CRUD operations with state machine
- Approval workflow
- Dashboard analytics
- Full test coverage with RSpec

## Getting Started

### Prerequisites

- Ruby 3.2 or higher
- Bundler
- SQLite3

### Installation

1. Install dependencies:
```bash
bundle install
```

2. Set up the database:
```bash
rails db:create
rails db:migrate
rails db:seed
```

3. Start the server:
```bash
rails server
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Users

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details

### Expenses

- `GET /api/expenses` - List all expenses (filterable by status, user)
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses` - Create new expense
- `PATCH /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/submit` - Submit expense for approval
- `POST /api/expenses/:id/approve` - Approve expense
- `POST /api/expenses/:id/reject` - Reject expense
- `POST /api/expenses/:id/pay` - Mark expense as paid
- `POST /api/expenses/:id/parse_receipt` - Mock OCR parsing

### Dashboard

- `GET /api/dashboard` - Get dashboard metrics

## Database Schema

### Users
- id, name, email, role, manager_id, department, timestamps

### Expenses
- id, user_id, title, vendor_name, amount_cents, currency, expense_date
- category, description, status, receipt_url, ocr_status
- submitted_at, approved_at, paid_at, timestamps

### Approvals
- id, expense_id, approver_id, decision, comment, timestamps

## Expense Status Flow

```
draft → submitted → approved → paid
          ↓
       rejected
```

## Seed Data

The seed file creates:
- 1 Finance Admin (Sarah Finance)
- 1 Manager (Mike Manager)
- 1 Employee (Emma Employee)
- 6 sample expenses in various states

## Testing

Run the test suite:
```bash
rspec
```

Run with coverage:
```bash
rspec --format documentation
```

## Development

### Console
```bash
rails console
```

### Database Reset
```bash
rails db:reset
```

### Code Quality
```bash
rubocop
```

## Project Structure

```
backend/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   └── api/
│   │       ├── base_controller.rb
│   │       ├── users_controller.rb
│   │       ├── expenses_controller.rb
│   │       └── dashboard_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── expense.rb
│   │   └── approval.rb
│   └── serializers/
├── config/
│   ├── routes.rb
│   ├── database.yml
│   └── initializers/
│       └── cors.rb
├── db/
│   ├── migrate/
│   └── seeds.rb
└── spec/
```

## License

MIT
