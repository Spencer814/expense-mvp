# Expense MVP - Setup Instructions

## Prerequisites

Your system currently has Ruby 2.6.10 which is too old for modern Rails. You need to install a modern Ruby version.

## Step 1: Install rbenv and Ruby 3.2

Run these commands in your terminal:

```bash
# Install rbenv and ruby-build
brew install rbenv ruby-build

# Add rbenv to your shell (if not already added)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.2.2
rbenv install 3.2.2

# Set it as the local version for this project
cd ~/source/repos/GitHub/expense-mvp
rbenv local 3.2.2

# Verify Ruby version
ruby --version  # Should show ruby 3.2.2
```

## Step 2: Install Rails and Dependencies

```bash
# Install Rails
gem install rails -v 7.0.8

# Verify Rails is installed
rails --version  # Should show Rails 7.0.8
```

## Step 3: Generate the Rails API Backend

```bash
# Navigate to project root
cd ~/source/repos/GitHub/expense-mvp

# Generate Rails API app
rails new backend --api --database=sqlite3 --skip-test

# Navigate to backend
cd backend

# Add required gems to Gemfile (they should already be there if following this doc)
# - rack-cors (for CORS)
# - active_model_serializers (for JSON serialization)

# Install dependencies
bundle install
```

## Step 4: Run Database Migrations and Seeds

```bash
cd ~/source/repos/GitHub/expense-mvp/backend

# Run migrations to create database tables
rails db:migrate

# Seed the database with sample data
rails db:seed
```

## Step 5: Start the Rails Server

```bash
cd ~/source/repos/GitHub/expense-mvp/backend

# Start the server on port 3000
rails server
```

The API will be available at `http://localhost:3000`

## Alternative: Use Docker (Optional)

If you prefer not to install Ruby locally, you can use Docker:

```bash
# Create a Dockerfile in the backend directory
# Then run:
docker build -t expense-mvp-backend .
docker run -p 3000:3000 expense-mvp-backend
```

## Troubleshooting

### Ruby version not switching
```bash
rbenv rehash
rbenv local 3.2.2
```

### Bundle install fails
```bash
gem install bundler
bundle install
```

### Database issues
```bash
rails db:drop db:create db:migrate db:seed
```

## What Claude Has Prepared

Claude has created the following files in the `backend` directory:
- Database migrations for Users, Expenses, and Approvals
- Models with validations and relationships
- API controllers for all endpoints
- Seed data with sample users and expenses
- CORS configuration
- Routes configuration

Once you complete the steps above, the backend will be fully functional!
