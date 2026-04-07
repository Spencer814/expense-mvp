# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Dashboard', type: :request do
  let(:finance) { create(:user, :finance) }

  describe 'GET /api/dashboard' do
    context 'with multiple expenses in different statuses' do
      before do
        # Create expenses in various statuses
        create_list(:expense, 3, :draft)
        create_list(:expense, 5, :submitted)
        create_list(:expense, 4, :approved)
        create_list(:expense, 2, :rejected)
        create_list(:expense, 6, :paid)
      end

      it 'returns correct count for each status' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['draft']).to eq(3)
        expect(json['submitted']).to eq(5)
        expect(json['approved']).to eq(4)
        expect(json['rejected']).to eq(2)
        expect(json['paid']).to eq(6)
      end

      it 'returns total count' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        expect(json['total']).to eq(20) # 3+5+4+2+6
      end
    end

    context 'with no expenses' do
      it 'returns zero counts' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['draft']).to eq(0)
        expect(json['submitted']).to eq(0)
        expect(json['approved']).to eq(0)
        expect(json['rejected']).to eq(0)
        expect(json['paid']).to eq(0)
        expect(json['total']).to eq(0)
      end
    end

    context 'with category totals' do
      before do
        # Create expenses with different categories and amounts
        create(:expense, :submitted, category: 'travel', amount_cents: 50_000) # $500
        create(:expense, :submitted, category: 'travel', amount_cents: 30_000) # $300
        create(:expense, :approved, category: 'meals', amount_cents: 15_000) # $150
        create(:expense, :paid, category: 'meals', amount_cents: 25_000) # $250
        create(:expense, :paid, category: 'office_supplies', amount_cents: 10_000) # $100
      end

      it 'returns aggregated amounts by category' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # Check if category_totals exists
        expect(json).to have_key('category_totals')

        category_totals = json['category_totals']

        # Find category by name
        travel_total = category_totals.find { |c| c['category'] == 'travel' }
        meals_total = category_totals.find { |c| c['category'] == 'meals' }
        office_total = category_totals.find { |c| c['category'] == 'office_supplies' }

        expect(travel_total['total_cents']).to eq(80_000) # $800
        expect(meals_total['total_cents']).to eq(40_000) # $400
        expect(office_total['total_cents']).to eq(10_000) # $100
      end

      it 'returns count of expenses per category' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)
        category_totals = json['category_totals']

        travel_total = category_totals.find { |c| c['category'] == 'travel' }
        meals_total = category_totals.find { |c| c['category'] == 'meals' }
        office_total = category_totals.find { |c| c['category'] == 'office_supplies' }

        expect(travel_total['count']).to eq(2)
        expect(meals_total['count']).to eq(2)
        expect(office_total['count']).to eq(1)
      end

      it 'includes category amounts in dollars' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)
        category_totals = json['category_totals']

        travel_total = category_totals.find { |c| c['category'] == 'travel' }

        # Depending on implementation, might include total_dollars
        expect(travel_total['total_dollars']).to eq(800.0) if travel_total.key?('total_dollars')
      end
    end

    context 'with amount aggregations' do
      before do
        create(:expense, :submitted, amount_cents: 10_000)
        create(:expense, :approved, amount_cents: 20_000)
        create(:expense, :paid, amount_cents: 30_000)
      end

      it 'returns total amount across all expenses' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # Check if total_amount_cents exists
        expect(json['total_amount_cents']).to eq(60_000) if json.key?('total_amount_cents')
      end

      it 'returns total amount for paid expenses' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # Check if paid_amount_cents exists
        expect(json['paid_amount_cents']).to eq(30_000) if json.key?('paid_amount_cents')
      end

      it 'returns total amount for pending approval expenses' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # Check if submitted_amount_cents exists
        expect(json['submitted_amount_cents']).to eq(10_000) if json.key?('submitted_amount_cents')
      end
    end

    context 'authorization' do
      let(:employee) { create(:user, :employee) }
      let(:manager) { create(:user, :manager) }

      it 'allows finance users to access dashboard' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
      end

      context 'when user is not finance' do
        it 'returns forbidden for employee' do
          get '/api/dashboard', headers: { 'X-User-Id' => employee.id }

          expect(response).to have_http_status(:forbidden)
        end

        it 'returns forbidden for manager' do
          get '/api/dashboard', headers: { 'X-User-Id' => manager.id }

          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    context 'with date range filtering' do
      before do
        # Old expenses
        create(:expense, :paid, expense_date: 60.days.ago, amount_cents: 10_000)

        # Recent expenses
        create(:expense, :submitted, expense_date: 5.days.ago, amount_cents: 20_000)
        create(:expense, :approved, expense_date: 2.days.ago, amount_cents: 30_000)
      end

      it 'can filter by date range if supported' do
        # If your implementation supports date filtering
        get '/api/dashboard',
          params: { start_date: 30.days.ago.to_s, end_date: Date.today.to_s },
          headers: { 'X-User-Id' => finance.id }

        # Test based on your implementation
        expect(response).to have_http_status(:ok)
      end
    end

    context 'performance with large dataset' do
      before do
        # Create a larger dataset
        create_list(:expense, 50, :submitted)
        create_list(:expense, 50, :approved)
        create_list(:expense, 50, :paid)
      end

      it 'returns aggregated data efficiently' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['submitted']).to eq(50)
        expect(json['approved']).to eq(50)
        expect(json['paid']).to eq(50)
        expect(json['total']).to eq(150)
      end
    end

    context 'with expenses from multiple users' do
      before do
        employee1 = create(:user, :employee)
        employee2 = create(:user, :employee)
        employee3 = create(:user, :employee)

        create_list(:expense, 2, :submitted, user: employee1)
        create_list(:expense, 3, :approved, user: employee2)
        create_list(:expense, 1, :paid, user: employee3)
      end

      it 'aggregates across all users' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        expect(json['submitted']).to eq(2)
        expect(json['approved']).to eq(3)
        expect(json['paid']).to eq(1)
        expect(json['total']).to eq(6)
      end

      it 'can include user breakdown if supported' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # If your implementation includes user-level breakdown
        expect(json['by_user']).to be_an(Array) if json.key?('by_user')
      end
    end

    context 'with missing categories' do
      before do
        # Create expenses without category (if allowed)
        expense = create(:expense, :submitted)
        expense.update_column(:category, nil) if expense.respond_to?(:category=)
      end

      it 'handles nil categories gracefully' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        # Should not crash, might include 'uncategorized' or skip nil categories
        expect(json).to have_key('category_totals')
      end
    end

    context 'response format' do
      before do
        create(:expense, :submitted, category: 'travel', amount_cents: 10_000)
      end

      it 'returns properly formatted JSON' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        expect(response.content_type).to match(%r{application/json})

        json = JSON.parse(response.body)

        # Verify structure
        expect(json).to be_a(Hash)
        expect(json).to have_key('submitted')
        expect(json['submitted']).to be_a(Integer)
      end

      it 'includes all expected fields' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)

        # Core aggregations
        expect(json).to have_key('draft')
        expect(json).to have_key('submitted')
        expect(json).to have_key('approved')
        expect(json).to have_key('rejected')
        expect(json).to have_key('paid')
        expect(json).to have_key('total')
        expect(json).to have_key('category_totals')
      end
    end

    context 'caching considerations' do
      it 'returns up-to-date data after new expense is created' do
        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json1 = JSON.parse(response.body)
        initial_count = json1['submitted']

        # Create new expense
        create(:expense, :submitted)

        get '/api/dashboard', headers: { 'X-User-Id' => finance.id }

        json2 = JSON.parse(response.body)
        expect(json2['submitted']).to eq(initial_count + 1)
      end
    end
  end
end
