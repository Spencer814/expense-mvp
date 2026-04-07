# frozen_string_literal: true

module Api
  class ExpensesController < BaseController
    before_action :set_expense, only: %i[show update submit approve reject pay]
    before_action :authorize_expense_access, only: %i[show update]
    before_action :authorize_draft_edit, only: [:update]
    before_action :authorize_manager, only: %i[approve reject]
    before_action :authorize_finance, only: [:pay]

    # GET /api/expenses
    # Returns expenses filtered by user role:
    # - employee: own expenses only
    # - manager: own expenses + team expenses
    # - finance: all expenses
    def index
      expenses = filtered_expenses
      render_success(expenses.as_json(
        methods: [:amount_dollars],
        include: { user: { only: %i[id name email] } }
      ).map { |e| e.merge('amount' => e.delete('amount_dollars').to_s) })
    end

    # GET /api/expenses/:id
    # Returns single expense with user and approval history
    def show
      json = @expense.as_json(
        methods: [:amount_dollars],
        include: {
          user: { only: %i[id name email] },
          approvals: { include: { approver: { only: %i[id name] } } }
        }
      )
      json['amount'] = json.delete('amount_dollars').to_s
      render_success(json)
    end

    # POST /api/expenses
    # Creates new expense for current user with draft status
    def create
      expense = current_user.expenses.build(expense_params)

      if expense.save
        render_success(expense, :created)
      else
        render_error(expense.errors.full_messages.join(', '))
      end
    end

    # PATCH /api/expenses/:id
    # Updates expense - only drafts can be edited
    def update
      if @expense.update(expense_params)
        render_success(@expense)
      else
        render_error(@expense.errors.full_messages.join(', '))
      end
    end

    # POST /api/expenses/:id/submit
    # Changes status from draft to submitted
    def submit
      unless @expense.status == 'draft'
        return render_error('Only draft expenses can be submitted', :unprocessable_entity)
      end

      unless @expense.user_id == current_user.id
        return render_error('You can only submit your own expenses', :forbidden)
      end

      if @expense.update(status: 'submitted')
        render_success(@expense)
      else
        render_error(@expense.errors.full_messages.join(', '))
      end
    end

    # POST /api/expenses/:id/approve
    # Manager approves submitted expense, creates approval record
    def approve
      unless @expense.status == 'submitted'
        return render_error('Only submitted expenses can be approved', :unprocessable_entity)
      end

      ActiveRecord::Base.transaction do
        @expense.update!(status: 'approved', approved_at: Time.current)
        @expense.approvals.create!(
          approver: current_user,
          decision: 'approved',
          comment: params[:comment]
        )
      end

      render_success(@expense.reload.as_json(
        include: {
          user: { only: %i[id name email] },
          approvals: { include: { approver: { only: %i[id name] } } }
        }
      ))
    rescue ActiveRecord::RecordInvalid => e
      render_error(e.message)
    end

    # POST /api/expenses/:id/reject
    # Manager rejects submitted expense, creates approval record with comments
    def reject
      unless @expense.status == 'submitted'
        return render_error('Only submitted expenses can be rejected', :unprocessable_entity)
      end

      return render_error('Rejection comment is required', :unprocessable_entity) unless params[:comment].present?

      ActiveRecord::Base.transaction do
        @expense.update!(status: 'rejected')
        @expense.approvals.create!(
          approver: current_user,
          decision: 'rejected',
          comment: params[:comment]
        )
      end

      render_success(@expense.reload.as_json(
        include: {
          user: { only: %i[id name email] },
          approvals: { include: { approver: { only: %i[id name] } } }
        }
      ))
    rescue ActiveRecord::RecordInvalid => e
      render_error(e.message)
    end

    # POST /api/expenses/:id/pay
    # Finance marks approved expense as paid
    def pay
      unless @expense.status == 'approved'
        return render_error('Only approved expenses can be paid', :unprocessable_entity)
      end

      if @expense.update(status: 'paid', paid_at: Time.current)
        render_success(@expense)
      else
        render_error(@expense.errors.full_messages.join(', '))
      end
    end

    # POST /api/expenses/:id/parse_receipt
    # Processes a receipt image using OCR to extract expense data.
    #
    # Accepts either:
    # - image_url: URL to the receipt image
    # - image_data: Base64-encoded image data
    #
    # Returns extracted expense data or error details.
    #
    # @example Request with image URL
    #   POST /api/expenses/1/parse_receipt
    #   { "image_url": "https://storage.example.com/receipts/receipt123.jpg" }
    #
    # @example Request with base64 image
    #   POST /api/expenses/1/parse_receipt
    #   { "image_data": "data:image/jpeg;base64,/9j/4AAQ...", "content_type": "image/jpeg" }
    #
    def parse_receipt
      # Validate input
      unless params[:image_url].present? || params[:image_data].present?
        return render_error('Either image_url or image_data is required', :unprocessable_entity)
      end

      # Process receipt with OCR service
      result = OcrService.call(
        image_url: params[:image_url],
        image_data: extract_base64_data(params[:image_data]),
        content_type: params[:content_type] || 'image/jpeg',
        expense_id: params[:id]
      )

      if result.success?
        render_success(result.data)
      else
        render_error(result.error, :unprocessable_entity)
      end
    end

    private

    def set_expense
      @expense = Expense.find_by(id: params[:id])
      return if @expense

      render_error('Expense not found', :not_found)
    end

    # Filter expenses based on user role
    def filtered_expenses
      case current_user.role
      when 'employee'
        # Employees see only their own expenses
        current_user.expenses.order(created_at: :desc)
      when 'manager'
        # Managers see their own + team members' expenses
        # For MVP: show all employee expenses + own expenses
        Expense.joins(:user)
               .where('users.role = ? OR expenses.user_id = ?', 'employee', current_user.id)
               .order(created_at: :desc)
      when 'finance'
        # Finance sees all expenses
        Expense.order(created_at: :desc)
      else
        Expense.none
      end
    end

    # Authorize user can view/edit this expense
    def authorize_expense_access
      case current_user.role
      when 'employee'
        render_error('Unauthorized', :forbidden) unless @expense.user_id == current_user.id
      when 'manager'
        unless @expense.user_id == current_user.id || @expense.user.role == 'employee'
          render_error('Unauthorized', :forbidden)
        end
      when 'finance'
        # Finance can access all expenses
      else
        render_error('Unauthorized', :forbidden)
      end
    end

    # Only draft expenses can be edited
    def authorize_draft_edit
      return if @expense.status == 'draft'

      render_error('Only draft expenses can be edited', :forbidden)
    end

    # Only managers and finance can approve/reject
    def authorize_manager
      return if current_user.role.in?(%w[manager finance])

      render_error('Only managers can approve/reject expenses', :forbidden)
    end

    # Only finance can mark as paid
    def authorize_finance
      return if current_user.role == 'finance'

      render_error('Only finance users can mark expenses as paid', :forbidden)
    end

    def expense_params
      params.require(:expense).permit(:title, :description, :amount_cents, :category, :expense_date, :vendor_name,
        :receipt_url, :currency)
    end

    ##
    # Extracts raw base64 data from a data URL or returns the input as-is
    #
    # @param data [String, nil] The image data (may be data URL or raw base64)
    # @return [String, nil] The base64-encoded image data
    #
    def extract_base64_data(data)
      return nil if data.blank?

      # Handle data URLs like "data:image/jpeg;base64,/9j/4AAQ..."
      if data.include?(',')
        data.split(',').last
      else
        data
      end
    end
  end
end
