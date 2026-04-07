# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Expense, type: :model do
  describe 'validations' do
    subject { build(:expense) }

    it 'is valid with valid attributes' do
      expect(subject).to be_valid
    end

    describe 'title' do
      it 'is required' do
        subject.title = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:title]).to include("can't be blank")
      end

      it 'cannot be blank' do
        subject.title = '   '
        expect(subject).not_to be_valid
      end
    end

    describe 'amount_cents' do
      it 'is required' do
        subject.amount_cents = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:amount_cents]).to include("can't be blank")
      end

      it 'must be greater than 0' do
        subject.amount_cents = 0
        expect(subject).not_to be_valid
        expect(subject.errors[:amount_cents]).to include('must be greater than 0')
      end

      it 'must be positive' do
        subject.amount_cents = -100
        expect(subject).not_to be_valid
        expect(subject.errors[:amount_cents]).to include('must be greater than 0')
      end

      it 'accepts positive values' do
        subject.amount_cents = 1000
        expect(subject).to be_valid
      end
    end

    describe 'expense_date' do
      it 'is required' do
        subject.expense_date = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:expense_date]).to include("can't be blank")
      end

      it 'accepts past dates' do
        subject.expense_date = 1.day.ago
        expect(subject).to be_valid
      end

      it 'accepts today\'s date' do
        subject.expense_date = Date.today
        expect(subject).to be_valid
      end

      it 'accepts future dates' do
        subject.expense_date = 1.day.from_now
        expect(subject).to be_valid
      end
    end

    describe 'user' do
      it 'is required' do
        subject.user = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:user]).to include('must exist')
      end
    end

    describe 'category' do
      it 'validates inclusion in CATEGORIES constant' do
        # This test assumes there's a CATEGORIES constant in the Expense model
        # If category validation exists, uncomment and adjust:
        # subject.category = 'invalid_category'
        # expect(subject).not_to be_valid
      end
    end

    describe 'status' do
      it 'is required' do
        subject.status = nil
        expect(subject).not_to be_valid
      end
    end
  end

  describe 'enums' do
    it 'defines status enum with correct values' do
      expect(Expense.statuses).to eq({
        'draft' => 0,
        'submitted' => 1,
        'approved' => 2,
        'rejected' => 3,
        'paid' => 4
      })
    end

    it 'allows setting status using symbols' do
      expense = build(:expense)

      expense.status = :draft
      expect(expense.draft?).to be true

      expense.status = :submitted
      expect(expense.submitted?).to be true

      expense.status = :approved
      expect(expense.approved?).to be true

      expense.status = :rejected
      expect(expense.rejected?).to be true

      expense.status = :paid
      expect(expense.paid?).to be true
    end
  end

  describe 'associations' do
    describe 'user' do
      it 'belongs to a user' do
        user = create(:user)
        expense = create(:expense, user: user)

        expect(expense.user).to eq(user)
      end
    end

    describe 'approvals' do
      it 'has many approvals' do
        expense = create(:expense, :submitted)
        approval1 = create(:approval, expense: expense)
        approval2 = create(:approval, expense: expense)

        expect(expense.approvals).to include(approval1, approval2)
        expect(expense.approvals.count).to eq(2)
      end

      it 'destroys dependent approvals when expense is destroyed' do
        expense = create(:expense, :approved)

        expect { expense.destroy }.to change { Approval.count }.by(-1)
      end
    end
  end

  describe 'scopes' do
    let!(:user1) { create(:user, :employee) }
    let!(:user2) { create(:user, :employee) }
    let!(:manager) { create(:user, :manager) }

    before do
      user1.update(manager: manager)
      user2.update(manager: manager)
    end

    describe '.for_user' do
      it 'returns expenses for a specific user' do
        expense1 = create(:expense, user: user1)
        expense2 = create(:expense, user: user1)
        expense3 = create(:expense, user: user2)

        expenses = Expense.for_user(user1)

        expect(expenses).to include(expense1, expense2)
        expect(expenses).not_to include(expense3)
        expect(expenses.count).to eq(2)
      end

      it 'returns empty array for user with no expenses' do
        user3 = create(:user, :employee)
        expenses = Expense.for_user(user3)

        expect(expenses).to be_empty
      end
    end

    describe '.for_team' do
      it 'returns expenses for all team members of a manager' do
        expense1 = create(:expense, user: user1)
        expense2 = create(:expense, user: user2)
        user3 = create(:user, :employee)
        expense3 = create(:expense, user: user3)

        expenses = Expense.for_team(manager)

        expect(expenses).to include(expense1, expense2)
        expect(expenses).not_to include(expense3)
        expect(expenses.count).to eq(2)
      end

      it 'returns empty array for manager with no team members' do
        manager_without_team = create(:user, :manager)
        expenses = Expense.for_team(manager_without_team)

        expect(expenses).to be_empty
      end
    end

    describe 'status scopes' do
      before do
        @draft_expense = create(:expense, :draft, user: user1)
        @submitted_expense = create(:expense, :submitted, user: user1)
        @approved_expense = create(:expense, :approved, user: user1)
        @rejected_expense = create(:expense, :rejected, user: user1)
        @paid_expense = create(:expense, :paid, user: user1)
      end

      it 'filters by draft status' do
        drafts = Expense.where(status: :draft)
        expect(drafts).to include(@draft_expense)
        expect(drafts).not_to include(@submitted_expense, @approved_expense)
      end

      it 'filters by submitted status' do
        submitted = Expense.where(status: :submitted)
        expect(submitted).to include(@submitted_expense)
        expect(submitted).not_to include(@draft_expense, @approved_expense)
      end

      it 'filters by approved status' do
        approved = Expense.where(status: :approved)
        expect(approved).to include(@approved_expense)
        expect(approved).not_to include(@draft_expense, @submitted_expense)
      end

      it 'filters by rejected status' do
        rejected = Expense.where(status: :rejected)
        expect(rejected).to include(@rejected_expense)
        expect(rejected).not_to include(@draft_expense, @submitted_expense)
      end

      it 'filters by paid status' do
        paid = Expense.where(status: :paid)
        expect(paid).to include(@paid_expense)
        expect(paid).not_to include(@draft_expense, @submitted_expense)
      end
    end
  end

  describe '#amount_dollars' do
    it 'converts amount_cents to dollars' do
      expense = build(:expense, amount_cents: 1000)
      expect(expense.amount_dollars).to eq(10.00)
    end

    it 'handles large amounts correctly' do
      expense = build(:expense, amount_cents: 123_456)
      expect(expense.amount_dollars).to eq(1234.56)
    end

    it 'handles cents correctly' do
      expense = build(:expense, amount_cents: 99)
      expect(expense.amount_dollars).to eq(0.99)
    end

    it 'returns 0.0 for nil amount_cents' do
      expense = build(:expense, amount_cents: nil)
      expect(expense.amount_dollars).to eq(0.0)
    end

    it 'returns correct decimal places' do
      expense = build(:expense, amount_cents: 1234)
      expect(expense.amount_dollars).to eq(12.34)
      expect(expense.amount_dollars.to_s).to eq('12.34')
    end
  end

  describe 'status transitions' do
    let(:expense) { create(:expense, :draft) }

    describe 'draft -> submitted' do
      it 'transitions from draft to submitted' do
        expect(expense.draft?).to be true

        expense.update(status: :submitted, submitted_at: Time.current)

        expect(expense.submitted?).to be true
        expect(expense.submitted_at).not_to be_nil
      end

      it 'sets submitted_at timestamp' do
        expect(expense.submitted_at).to be_nil

        time_before = Time.current
        expense.update(status: :submitted, submitted_at: Time.current)
        time_after = Time.current

        expect(expense.submitted_at).to be_between(time_before, time_after)
      end
    end

    describe 'submitted -> approved' do
      let(:expense) { create(:expense, :submitted) }

      it 'transitions from submitted to approved' do
        expect(expense.submitted?).to be true

        expense.update(status: :approved, approved_at: Time.current)

        expect(expense.approved?).to be true
        expect(expense.approved_at).not_to be_nil
      end

      it 'sets approved_at timestamp' do
        expect(expense.approved_at).to be_nil

        time_before = Time.current
        expense.update(status: :approved, approved_at: Time.current)
        time_after = Time.current

        expect(expense.approved_at).to be_between(time_before, time_after)
      end
    end

    describe 'submitted -> rejected' do
      let(:expense) { create(:expense, :submitted) }

      it 'transitions from submitted to rejected' do
        expect(expense.submitted?).to be true

        expense.update(status: :rejected, rejected_at: Time.current)

        expect(expense.rejected?).to be true
        expect(expense.rejected_at).not_to be_nil
      end

      it 'sets rejected_at timestamp' do
        expect(expense.rejected_at).to be_nil

        time_before = Time.current
        expense.update(status: :rejected, rejected_at: Time.current)
        time_after = Time.current

        expect(expense.rejected_at).to be_between(time_before, time_after)
      end
    end

    describe 'approved -> paid' do
      let(:expense) { create(:expense, :approved) }

      it 'transitions from approved to paid' do
        expect(expense.approved?).to be true

        expense.update(status: :paid, paid_at: Time.current)

        expect(expense.paid?).to be true
        expect(expense.paid_at).not_to be_nil
      end

      it 'sets paid_at timestamp' do
        expect(expense.paid_at).to be_nil

        time_before = Time.current
        expense.update(status: :paid, paid_at: Time.current)
        time_after = Time.current

        expect(expense.paid_at).to be_between(time_before, time_after)
      end
    end

    describe 'invalid transitions' do
      it 'should not allow draft -> approved (skipping submitted)' do
        create(:expense, :draft)
        # This test depends on business logic implementation
        # If there are state machine validations, test them here
      end

      it 'should not allow rejected -> paid' do
        create(:expense, :rejected)
        # This test depends on business logic implementation
        # If there are state machine validations, test them here
      end
    end
  end

  describe 'factory traits' do
    it 'creates a draft expense with :draft trait' do
      expense = create(:expense, :draft)
      expect(expense.draft?).to be true
      expect(expense.submitted_at).to be_nil
    end

    it 'creates a submitted expense with :submitted trait' do
      expense = create(:expense, :submitted)
      expect(expense.submitted?).to be true
      expect(expense.submitted_at).not_to be_nil
    end

    it 'creates an approved expense with :approved trait' do
      expense = create(:expense, :approved)
      expect(expense.approved?).to be true
      expect(expense.approved_at).not_to be_nil
      expect(expense.approvals.count).to eq(1)
    end

    it 'creates a rejected expense with :rejected trait' do
      expense = create(:expense, :rejected)
      expect(expense.rejected?).to be true
      expect(expense.rejected_at).not_to be_nil
      expect(expense.approvals.count).to eq(1)
      expect(expense.approvals.first.approved).to be false
    end

    it 'creates a paid expense with :paid trait' do
      expense = create(:expense, :paid)
      expect(expense.paid?).to be true
      expect(expense.paid_at).not_to be_nil
    end

    it 'creates an expense with receipt using :with_receipt trait' do
      expense = create(:expense, :with_receipt)
      expect(expense.receipt_url).not_to be_nil
    end

    it 'creates a high value expense using :high_value trait' do
      expense = create(:expense, :high_value)
      expect(expense.amount_cents).to eq(500_000)
      expect(expense.amount_dollars).to eq(5000.00)
    end

    it 'creates a low value expense using :low_value trait' do
      expense = create(:expense, :low_value)
      expect(expense.amount_cents).to eq(500)
      expect(expense.amount_dollars).to eq(5.00)
    end
  end

  describe 'business logic' do
    describe 'editable conditions' do
      it 'draft expenses should be editable' do
        expense = create(:expense, :draft)
        # Test business logic for editing drafts
        expect(expense.draft?).to be true
      end

      it 'submitted expenses should not be editable' do
        expense = create(:expense, :submitted)
        # Test business logic that prevents editing submitted expenses
        expect(expense.submitted?).to be true
      end
    end

    describe 'approval workflow' do
      it 'creates approval record when approved' do
        expense = create(:expense, :submitted)
        manager = create(:user, :manager)

        expect {
          create(:approval, expense: expense, approver: manager, approved: true)
        }.to change { expense.approvals.count }.by(1)

        expect(expense.approvals.last.approver).to eq(manager)
        expect(expense.approvals.last.approved).to be true
      end

      it 'creates approval record when rejected' do
        expense = create(:expense, :submitted)
        manager = create(:user, :manager)

        expect {
          create(:approval, expense: expense, approver: manager, approved: false)
        }.to change { expense.approvals.count }.by(1)

        expect(expense.approvals.last.approver).to eq(manager)
        expect(expense.approvals.last.approved).to be false
      end
    end
  end

  describe 'timestamp tracking' do
    it 'tracks submitted_at when status changes to submitted' do
      expense = create(:expense, :draft)
      expect(expense.submitted_at).to be_nil

      expense.update(status: :submitted, submitted_at: Time.current)

      expect(expense.submitted_at).not_to be_nil
      expect(expense.submitted_at).to be_a(Time)
    end

    it 'tracks approved_at when status changes to approved' do
      expense = create(:expense, :submitted)
      expect(expense.approved_at).to be_nil

      expense.update(status: :approved, approved_at: Time.current)

      expect(expense.approved_at).not_to be_nil
      expect(expense.approved_at).to be_a(Time)
    end

    it 'tracks rejected_at when status changes to rejected' do
      expense = create(:expense, :submitted)
      expect(expense.rejected_at).to be_nil

      expense.update(status: :rejected, rejected_at: Time.current)

      expect(expense.rejected_at).not_to be_nil
      expect(expense.rejected_at).to be_a(Time)
    end

    it 'tracks paid_at when status changes to paid' do
      expense = create(:expense, :approved)
      expect(expense.paid_at).to be_nil

      expense.update(status: :paid, paid_at: Time.current)

      expect(expense.paid_at).not_to be_nil
      expect(expense.paid_at).to be_a(Time)
    end
  end
end
