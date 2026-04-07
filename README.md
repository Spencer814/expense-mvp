# Expense Approval MVP

A full-stack expense approval workflow application demonstrating finance domain patterns.

## Tech Stack

- **Backend:** Ruby on Rails API + SQLite
- **Frontend:** React + TypeScript (Vite)
- **State Management:** Local React state (no Redux needed for MVP)

## Features

- **Expense CRUD** with state machine workflow
- **Role-based access:** Employee, Manager, Finance Admin
- **Mock OCR** for receipt parsing
- **Finance Dashboard** with aggregated metrics

## Expense Workflow

```
draft → submitted → approved → paid
                 ↘ rejected
```

## User Roles

| Role | Capabilities |
|------|-------------|
| Employee | Create, edit drafts, submit expenses |
| Manager | View team expenses, approve/reject |
| Finance | View all expenses, mark as paid, see dashboard |

## Quick Start

### Prerequisites

- Ruby 3.0+ (or compatible version)
- Node.js 18+
- SQLite

### Backend Setup

```bash
cd backend
bundle install
rails db:migrate
rails db:seed
rails server -p 3000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

## API Endpoints

### Users
- `GET /api/users` - List all users (for role switching)

### Expenses
- `GET /api/expenses` - List expenses (filtered by role)
- `GET /api/expenses/:id` - Expense detail
- `POST /api/expenses` - Create expense
- `PATCH /api/expenses/:id` - Update draft expense
- `POST /api/expenses/:id/submit` - Submit for approval
- `POST /api/expenses/:id/approve` - Manager approves
- `POST /api/expenses/:id/reject` - Manager rejects
- `POST /api/expenses/:id/pay` - Finance marks paid
- `POST /api/expenses/:id/parse_receipt` - Mock OCR

### Dashboard
- `GET /api/dashboard` - Aggregated metrics

## Simulated Authentication

This MVP uses header-based user simulation:
- Set `X-User-Id` header to switch users
- Frontend provides a dropdown to switch roles

## Project Structure

```
expense-mvp/
├── backend/                 # Rails API
│   ├── app/
│   │   ├── controllers/api/
│   │   └── models/
│   └── db/
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
├── BUILD-LOG.md           # Build process documentation
├── TESTING-PLAN.md        # Testing strategy
└── README.md
```

## Key Design Decisions

1. **State Machine Pattern:** Explicit status transitions with business rules
2. **Role-Based Filtering:** API filters data based on user role
3. **Mock OCR:** Stubbed endpoint for receipt parsing
4. **Cents Storage:** Amounts stored as integers (cents) to avoid floating-point issues

## Interview Talking Points

- State machine design mirrors NgRx/Redux patterns
- Role-based access without complex auth
- Mock integrations for MVP speed
- Dashboard aggregation for business visibility
- Audit trail through Approvals table
