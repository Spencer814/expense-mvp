# frozen_string_literal: true

module Api
  class DashboardController < BaseController
    # GET /api/dashboard
    # Returns aggregated expense metrics for finance dashboard
    # Format matches frontend DashboardData interface
    def index
      dashboard_data = {
        stats: {
          submitted_count: Expense.where(status: 'submitted').count,
          approved_count: Expense.where(status: 'approved').count,
          paid_count: Expense.where(status: 'paid').count,
          pending_amount: (Expense.where(status: %w[submitted approved]).sum(:amount_cents) / 100.0).to_s
        },
        category_totals: category_totals_array
      }

      render_success(dashboard_data)
    end

    private

    # Returns category totals as array of { category, total } for frontend
    def category_totals_array
      Expense.where.not(status: 'draft')
             .group(:category)
             .sum(:amount_cents)
             .map { |category, cents| { category: category, total: (cents / 100.0).to_s } }
    end
  end
end
