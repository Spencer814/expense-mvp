# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Expenses', type: :request do
  let(:employee) { create(:user, :employee) }
  let(:manager) { create(:user, :manager) }
  let(:finance) { create(:user, :finance) }

  describe 'GET /api/expenses' do
    context 'when user is an employee' do
      before do
        employee.update(manager: manager)
        @own_expense = create(:expense, user: employee, status: :draft)
        @other_expense = create(:expense, user: create(:user, :employee), status: :submitted)
      end

      it 'returns only their own expenses' do
        get '/api/expenses', headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(1)
        expect(json.first['id']).to eq(@own_expense.id)
      end

      it 'does not return other employees expenses' do
        get '/api/expenses', headers: { 'X-User-Id' => employee.id }

        json = JSON.parse(response.body)
        expense_ids = json.map { |e| e['id'] }

        expect(expense_ids).not_to include(@other_expense.id)
      end
    end

    context 'when user is a manager' do
      before do
        @team_member1 = create(:user, :employee, manager: manager)
        @team_member2 = create(:user, :employee, manager: manager)
        @other_employee = create(:user, :employee)

        @team_expense1 = create(:expense, user: @team_member1, status: :submitted)
        @team_expense2 = create(:expense, user: @team_member2, status: :submitted)
        @other_expense = create(:expense, user: @other_employee, status: :submitted)
      end

      it 'returns expenses from their team members' do
        get '/api/expenses', headers: { 'X-User-Id' => manager.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expense_ids = json.map { |e| e['id'] }
        expect(expense_ids).to include(@team_expense1.id, @team_expense2.id)
      end

      it 'does not return expenses from non-team members' do
        get '/api/expenses', headers: { 'X-User-Id' => manager.id }

        json = JSON.parse(response.body)
        expense_ids = json.map { |e| e['id'] }

        expect(expense_ids).not_to include(@other_expense.id)
      end
    end

    context 'when user is finance' do
      before do
        @expense1 = create(:expense, user: employee, status: :approved)
        @expense2 = create(:expense, user: create(:user, :employee), status: :paid)
        @expense3 = create(:expense, user: create(:user, :employee), status: :submitted)
      end

      it 'returns all expenses' do
        get '/api/expenses', headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(3)
        expense_ids = json.map { |e| e['id'] }
        expect(expense_ids).to include(@expense1.id, @expense2.id, @expense3.id)
      end

      it 'can see expenses in any status' do
        get '/api/expenses', headers: { 'X-User-Id' => finance.id }

        json = JSON.parse(response.body)
        statuses = json.map { |e| e['status'] }

        expect(statuses).to include('approved', 'paid', 'submitted')
      end
    end

    context 'without X-User-Id header' do
      it 'returns unauthorized or uses default behavior' do
        get '/api/expenses'

        # Depending on implementation, this might return 401 or empty array
        # Adjust based on your actual implementation
        expect(response).to have_http_status(:ok).or have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/expenses/:id' do
    let(:expense) { create(:expense, user: employee) }

    context 'when expense exists' do
      it 'returns the expense' do
        get "/api/expenses/#{expense.id}", headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['id']).to eq(expense.id)
        expect(json['title']).to eq(expense.title)
        expect(json['amount_cents']).to eq(expense.amount_cents)
      end
    end

    context 'when expense does not exist' do
      it 'returns not found' do
        get '/api/expenses/99999', headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/expenses' do
    let(:valid_attributes) do
      {
        title: 'Office Supplies',
        description: 'Pens and paper',
        amount_cents: 2500,
        expense_date: Date.today.to_s,
        category: 'office_supplies'
      }
    end

    context 'with valid parameters' do
      it 'creates a new expense' do
        expect {
          post '/api/expenses',
            params: { expense: valid_attributes },
            headers: { 'X-User-Id' => employee.id }
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it 'returns the created expense' do
        post '/api/expenses',
          params: { expense: valid_attributes },
          headers: { 'X-User-Id' => employee.id }

        json = JSON.parse(response.body)

        expect(json['title']).to eq('Office Supplies')
        expect(json['amount_cents']).to eq(2500)
        expect(json['status']).to eq('draft')
      end

      it 'associates the expense with the current user' do
        post '/api/expenses',
          params: { expense: valid_attributes },
          headers: { 'X-User-Id' => employee.id }

        json = JSON.parse(response.body)
        expense = Expense.find(json['id'])

        expect(expense.user_id).to eq(employee.id)
      end
    end

    context 'with invalid parameters' do
      it 'returns unprocessable entity when title is missing' do
        invalid_attributes = valid_attributes.merge(title: nil)

        post '/api/expenses',
          params: { expense: invalid_attributes },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns unprocessable entity when amount_cents is missing' do
        invalid_attributes = valid_attributes.merge(amount_cents: nil)

        post '/api/expenses',
          params: { expense: invalid_attributes },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns unprocessable entity when amount_cents is not positive' do
        invalid_attributes = valid_attributes.merge(amount_cents: -100)

        post '/api/expenses',
          params: { expense: invalid_attributes },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns unprocessable entity when expense_date is missing' do
        invalid_attributes = valid_attributes.merge(expense_date: nil)

        post '/api/expenses',
          params: { expense: invalid_attributes },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error messages' do
        invalid_attributes = valid_attributes.merge(title: nil, amount_cents: nil)

        post '/api/expenses',
          params: { expense: invalid_attributes },
          headers: { 'X-User-Id' => employee.id }

        json = JSON.parse(response.body)

        expect(json).to have_key('errors')
      end
    end
  end

  describe 'PATCH /api/expenses/:id' do
    context 'when expense is in draft status' do
      let(:expense) { create(:expense, :draft, user: employee) }

      it 'updates the expense' do
        patch "/api/expenses/#{expense.id}",
          params: { expense: { title: 'Updated Title' } },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
        expense.reload
        expect(expense.title).to eq('Updated Title')
      end

      it 'allows updating amount_cents' do
        patch "/api/expenses/#{expense.id}",
          params: { expense: { amount_cents: 5000 } },
          headers: { 'X-User-Id' => employee.id }

        expense.reload
        expect(expense.amount_cents).to eq(5000)
      end
    end

    context 'when expense is submitted' do
      let(:expense) { create(:expense, :submitted, user: employee) }

      it 'does not allow updates' do
        original_title = expense.title

        patch "/api/expenses/#{expense.id}",
          params: { expense: { title: 'Should Not Update' } },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
        expense.reload
        expect(expense.title).to eq(original_title)
      end
    end

    context 'when expense is approved' do
      let(:expense) { create(:expense, :approved, user: employee) }

      it 'does not allow updates' do
        original_title = expense.title

        patch "/api/expenses/#{expense.id}",
          params: { expense: { title: 'Should Not Update' } },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
        expense.reload
        expect(expense.title).to eq(original_title)
      end
    end

    context 'with invalid parameters' do
      let(:expense) { create(:expense, :draft, user: employee) }

      it 'returns unprocessable entity' do
        patch "/api/expenses/#{expense.id}",
          params: { expense: { amount_cents: -100 } },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/expenses/:id/submit' do
    let(:expense) { create(:expense, :draft, user: employee) }

    context 'when expense is in draft status' do
      it 'transitions expense to submitted' do
        post "/api/expenses/#{expense.id}/submit",
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
        expense.reload
        expect(expense.status).to eq('submitted')
      end

      it 'sets submitted_at timestamp' do
        expect(expense.submitted_at).to be_nil

        post "/api/expenses/#{expense.id}/submit",
          headers: { 'X-User-Id' => employee.id }

        expense.reload
        expect(expense.submitted_at).not_to be_nil
      end
    end

    context 'when expense is already submitted' do
      let(:expense) { create(:expense, :submitted, user: employee) }

      it 'returns unprocessable entity' do
        post "/api/expenses/#{expense.id}/submit",
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/expenses/:id/approve' do
    let(:team_member) { create(:user, :employee, manager: manager) }
    let(:expense) { create(:expense, :submitted, user: team_member) }

    context 'when user is a manager' do
      it 'approves the expense' do
        post "/api/expenses/#{expense.id}/approve",
          params: { comments: 'Looks good!' },
          headers: { 'X-User-Id' => manager.id }

        expect(response).to have_http_status(:ok)
        expense.reload
        expect(expense.status).to eq('approved')
      end

      it 'sets approved_at timestamp' do
        expect(expense.approved_at).to be_nil

        post "/api/expenses/#{expense.id}/approve",
          params: { comments: 'Approved' },
          headers: { 'X-User-Id' => manager.id }

        expense.reload
        expect(expense.approved_at).not_to be_nil
      end

      it 'creates an approval record' do
        expect {
          post "/api/expenses/#{expense.id}/approve",
            params: { comments: 'Approved' },
            headers: { 'X-User-Id' => manager.id }
        }.to change(Approval, :count).by(1)

        approval = Approval.last
        expect(approval.expense_id).to eq(expense.id)
        expect(approval.approver_id).to eq(manager.id)
        expect(approval.approved).to be true
      end

      it 'saves approval comments' do
        post "/api/expenses/#{expense.id}/approve",
          params: { comments: 'Looks good, approved!' },
          headers: { 'X-User-Id' => manager.id }

        approval = Approval.last
        expect(approval.comments).to eq('Looks good, approved!')
      end
    end

    context 'when user is not a manager' do
      it 'returns forbidden' do
        post "/api/expenses/#{expense.id}/approve",
          params: { comments: 'Should not work' },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when expense is not submitted' do
      let(:expense) { create(:expense, :draft, user: team_member) }

      it 'returns unprocessable entity' do
        post "/api/expenses/#{expense.id}/approve",
          params: { comments: 'Cannot approve draft' },
          headers: { 'X-User-Id' => manager.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/expenses/:id/reject' do
    let(:team_member) { create(:user, :employee, manager: manager) }
    let(:expense) { create(:expense, :submitted, user: team_member) }

    context 'when user is a manager' do
      it 'rejects the expense' do
        post "/api/expenses/#{expense.id}/reject",
          params: { comments: 'Need more details' },
          headers: { 'X-User-Id' => manager.id }

        expect(response).to have_http_status(:ok)
        expense.reload
        expect(expense.status).to eq('rejected')
      end

      it 'sets rejected_at timestamp' do
        expect(expense.rejected_at).to be_nil

        post "/api/expenses/#{expense.id}/reject",
          params: { comments: 'Rejected' },
          headers: { 'X-User-Id' => manager.id }

        expense.reload
        expect(expense.rejected_at).not_to be_nil
      end

      it 'creates an approval record with approved=false' do
        expect {
          post "/api/expenses/#{expense.id}/reject",
            params: { comments: 'Need receipt' },
            headers: { 'X-User-Id' => manager.id }
        }.to change(Approval, :count).by(1)

        approval = Approval.last
        expect(approval.expense_id).to eq(expense.id)
        expect(approval.approver_id).to eq(manager.id)
        expect(approval.approved).to be false
      end

      it 'saves rejection comments' do
        post "/api/expenses/#{expense.id}/reject",
          params: { comments: 'Missing receipt' },
          headers: { 'X-User-Id' => manager.id }

        approval = Approval.last
        expect(approval.comments).to eq('Missing receipt')
      end
    end

    context 'when user is not a manager' do
      it 'returns forbidden' do
        post "/api/expenses/#{expense.id}/reject",
          params: { comments: 'Should not work' },
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe 'POST /api/expenses/:id/pay' do
    let(:expense) { create(:expense, :approved, user: employee) }

    context 'when user is finance' do
      it 'marks the expense as paid' do
        post "/api/expenses/#{expense.id}/pay",
          headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:ok)
        expense.reload
        expect(expense.status).to eq('paid')
      end

      it 'sets paid_at timestamp' do
        expect(expense.paid_at).to be_nil

        post "/api/expenses/#{expense.id}/pay",
          headers: { 'X-User-Id' => finance.id }

        expense.reload
        expect(expense.paid_at).not_to be_nil
      end
    end

    context 'when user is not finance' do
      it 'returns forbidden for employee' do
        post "/api/expenses/#{expense.id}/pay",
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:forbidden)
      end

      it 'returns forbidden for manager' do
        post "/api/expenses/#{expense.id}/pay",
          headers: { 'X-User-Id' => manager.id }

        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when expense is not approved' do
      let(:expense) { create(:expense, :submitted, user: employee) }

      it 'returns unprocessable entity' do
        post "/api/expenses/#{expense.id}/pay",
          headers: { 'X-User-Id' => finance.id }

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/expenses/:id/parse_receipt' do
    let(:expense) { create(:expense, :draft, user: employee) }

    context 'with mock OCR' do
      it 'returns mock parsed data' do
        post "/api/expenses/#{expense.id}/parse_receipt",
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        # Mock OCR should return structured data
        expect(json).to have_key('merchant')
        expect(json).to have_key('amount')
        expect(json).to have_key('date')
      end

      it 'returns consistent mock data format' do
        post "/api/expenses/#{expense.id}/parse_receipt",
          headers: { 'X-User-Id' => employee.id }

        json = JSON.parse(response.body)

        expect(json['merchant']).to be_a(String)
        expect(json['amount']).to be_a(Numeric)
        expect(json['date']).to be_a(String)
      end

      it 'can be called multiple times' do
        3.times do
          post "/api/expenses/#{expense.id}/parse_receipt",
            headers: { 'X-User-Id' => employee.id }

          expect(response).to have_http_status(:ok)
        end
      end
    end

    context 'when expense does not exist' do
      it 'returns not found' do
        post '/api/expenses/99999/parse_receipt',
          headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'authorization checks' do
    let(:employee1) { create(:user, :employee) }
    let(:employee2) { create(:user, :employee) }
    let(:expense1) { create(:expense, user: employee1) }

    it 'prevents employee from viewing another employees expense' do
      get "/api/expenses/#{expense1.id}",
        headers: { 'X-User-Id' => employee2.id }

      # Depending on implementation, might return 403 or 404
      expect(response).to have_http_status(:forbidden).or have_http_status(:not_found)
    end

    it 'prevents employee from updating another employees expense' do
      patch "/api/expenses/#{expense1.id}",
        params: { expense: { title: 'Hacked' } },
        headers: { 'X-User-Id' => employee2.id }

      expect(response).to have_http_status(:forbidden).or have_http_status(:not_found)
    end
  end
end
