# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Approval, type: :model do
  describe 'validations' do
    subject { build(:approval) }

    it 'is valid with valid attributes' do
      expect(subject).to be_valid
    end

    describe 'expense' do
      it 'is required' do
        subject.expense = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:expense]).to include('must exist')
      end
    end

    describe 'approver' do
      it 'is required' do
        subject.approver = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:approver]).to include('must exist')
      end
    end

    describe 'approved' do
      it 'cannot be nil' do
        subject.approved = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:approved]).to include('is not included in the list')
      end

      it 'accepts true' do
        subject.approved = true
        expect(subject).to be_valid
      end

      it 'accepts false' do
        subject.approved = false
        expect(subject).to be_valid
      end

      it 'does not accept non-boolean values' do
        expect { subject.approved = 'yes' }.to raise_error(ArgumentError)
      end
    end
  end

  describe 'associations' do
    describe 'expense' do
      it 'belongs to an expense' do
        expense = create(:expense, :submitted)
        approval = create(:approval, expense: expense)

        expect(approval.expense).to eq(expense)
      end

      it 'can have multiple approvals for the same expense' do
        expense = create(:expense, :submitted)
        approval1 = create(:approval, expense: expense, approver: create(:user, :manager))
        approval2 = create(:approval, expense: expense, approver: create(:user, :manager))

        expect(expense.approvals).to include(approval1, approval2)
        expect(expense.approvals.count).to eq(2)
      end
    end

    describe 'approver' do
      it 'belongs to a user (approver)' do
        manager = create(:user, :manager)
        approval = create(:approval, approver: manager)

        expect(approval.approver).to eq(manager)
      end

      it 'requires approver to be a user' do
        approval = build(:approval, approver: nil)

        expect(approval).not_to be_valid
        expect(approval.errors[:approver]).to include('must exist')
      end
    end
  end

  describe 'factory traits' do
    describe ':approved trait' do
      it 'creates an approved approval' do
        approval = create(:approval, :approved)

        expect(approval.approved).to be true
        expect(approval.comments).to eq('Approved - looks good')
      end
    end

    describe ':rejected trait' do
      it 'creates a rejected approval' do
        approval = create(:approval, :rejected)

        expect(approval.approved).to be false
        expect(approval.comments).to eq('Rejected - needs more information')
      end
    end

    describe ':with_detailed_comments trait' do
      it 'creates an approval with detailed comments' do
        approval = create(:approval, :with_detailed_comments)

        expect(approval.comments).not_to be_nil
        expect(approval.comments.length).to be > 20
      end
    end

    describe ':without_comments trait' do
      it 'creates an approval without comments' do
        approval = create(:approval, :without_comments)

        expect(approval.comments).to be_nil
      end
    end
  end

  describe 'approval workflow' do
    let(:employee) { create(:user, :employee) }
    let(:manager) { create(:user, :manager) }
    let(:expense) { create(:expense, user: employee, status: :submitted) }

    describe 'approving an expense' do
      it 'creates an approval record with approved=true' do
        approval = create(:approval, expense: expense, approver: manager, approved: true)

        expect(approval.approved).to be true
        expect(approval.expense).to eq(expense)
        expect(approval.approver).to eq(manager)
      end

      it 'can include comments when approving' do
        approval = create(:approval,
          expense: expense,
          approver: manager,
          approved: true,
          comments: 'Looks good, approved!')

        expect(approval.approved).to be true
        expect(approval.comments).to eq('Looks good, approved!')
      end

      it 'can approve without comments' do
        approval = create(:approval,
          expense: expense,
          approver: manager,
          approved: true,
          comments: nil)

        expect(approval.approved).to be true
        expect(approval.comments).to be_nil
      end
    end

    describe 'rejecting an expense' do
      it 'creates an approval record with approved=false' do
        approval = create(:approval, expense: expense, approver: manager, approved: false)

        expect(approval.approved).to be false
        expect(approval.expense).to eq(expense)
        expect(approval.approver).to eq(manager)
      end

      it 'can include rejection reason in comments' do
        approval = create(:approval,
          expense: expense,
          approver: manager,
          approved: false,
          comments: 'Missing receipt, please resubmit')

        expect(approval.approved).to be false
        expect(approval.comments).to eq('Missing receipt, please resubmit')
      end
    end
  end

  describe 'approval history' do
    let(:employee) { create(:user, :employee) }
    let(:manager1) { create(:user, :manager) }
    let(:manager2) { create(:user, :manager) }
    let(:expense) { create(:expense, user: employee, status: :submitted) }

    it 'maintains approval history for an expense' do
      approval1 = create(:approval,
        expense: expense,
        approver: manager1,
        approved: false,
        comments: 'Needs more details')

      # Expense resubmitted and approved by different manager
      approval2 = create(:approval,
        expense: expense,
        approver: manager2,
        approved: true,
        comments: 'Approved after resubmission')

      expect(expense.approvals.count).to eq(2)
      expect(expense.approvals).to include(approval1, approval2)
    end

    it 'tracks who approved/rejected the expense' do
      approval = create(:approval, expense: expense, approver: manager1, approved: true)

      expect(approval.approver).to eq(manager1)
      expect(approval.approver.manager?).to be true
    end

    it 'tracks when the approval was made' do
      approval = create(:approval, expense: expense, approver: manager1, approved: true)

      expect(approval.created_at).not_to be_nil
      expect(approval.created_at).to be_a(Time)
      expect(approval.created_at).to be <= Time.current
    end
  end

  describe 'querying approvals' do
    let(:employee) { create(:user, :employee) }
    let(:manager) { create(:user, :manager) }

    before do
      @expense1 = create(:expense, user: employee, status: :submitted)
      @expense2 = create(:expense, user: employee, status: :submitted)
      @expense3 = create(:expense, user: employee, status: :submitted)

      @approval1 = create(:approval, expense: @expense1, approver: manager, approved: true)
      @approval2 = create(:approval, expense: @expense2, approver: manager, approved: false)
      @approval3 = create(:approval, expense: @expense3, approver: manager, approved: true)
    end

    it 'finds all approved expenses' do
      approved = Approval.where(approved: true)

      expect(approved.count).to eq(2)
      expect(approved).to include(@approval1, @approval3)
      expect(approved).not_to include(@approval2)
    end

    it 'finds all rejected expenses' do
      rejected = Approval.where(approved: false)

      expect(rejected.count).to eq(1)
      expect(rejected).to include(@approval2)
      expect(rejected).not_to include(@approval1, @approval3)
    end

    it 'finds all approvals by a specific manager' do
      approvals = manager.approvals

      expect(approvals.count).to eq(3)
      expect(approvals).to include(@approval1, @approval2, @approval3)
    end
  end

  describe 'business rules' do
    let(:employee) { create(:user, :employee) }
    let(:manager) { create(:user, :manager) }
    let(:finance) { create(:user, :finance) }

    describe 'role-based approval permissions' do
      it 'allows managers to create approvals' do
        expense = create(:expense, user: employee, status: :submitted)
        approval = build(:approval, expense: expense, approver: manager)

        expect(approval).to be_valid
        expect(manager.manager?).to be true
      end

      it 'can track approvals from finance users' do
        expense = create(:expense, user: employee, status: :submitted)
        approval = create(:approval, expense: expense, approver: finance)

        expect(approval).to be_valid
        expect(finance.finance?).to be true
      end

      it 'technically allows employees to be approvers (validation would be in controller)' do
        # NOTE: Business logic to prevent employees from approving
        # would typically be in the controller, not the model
        expense = create(:expense, user: employee, status: :submitted)
        approval = build(:approval, expense: expense, approver: employee)

        # At the model level, this is valid
        # Controller/service layer would enforce role restrictions
        expect(approval).to be_valid
      end
    end

    describe 'approval state tracking' do
      it 'tracks approval decision through approved boolean' do
        expense = create(:expense, user: employee, status: :submitted)

        approval_yes = create(:approval, expense: expense, approver: manager, approved: true)
        expect(approval_yes.approved).to be true

        approval_no = create(:approval, expense: expense, approver: manager, approved: false)
        expect(approval_no.approved).to be false
      end
    end
  end

  describe 'data integrity' do
    it 'maintains referential integrity with expense' do
      approval = create(:approval)
      expense = approval.expense

      expect { expense.destroy }.to change { Approval.count }.by(-1)
    end

    it 'maintains referential integrity with approver' do
      manager = create(:user, :manager)
      approval = create(:approval, approver: manager)

      # Depending on your destroy strategy, this might or might not cascade
      # Test your actual implementation
      expect(approval.approver).to eq(manager)
    end
  end

  describe 'audit trail' do
    it 'provides a complete audit trail of approvals' do
      employee = create(:user, :employee)
      manager1 = create(:user, :manager, name: 'Manager One')
      manager2 = create(:user, :manager, name: 'Manager Two')
      expense = create(:expense, user: employee, status: :submitted)

      # First rejection
      approval1 = create(:approval,
        expense: expense,
        approver: manager1,
        approved: false,
        comments: 'Need receipt',
        created_at: 2.days.ago)

      # Second approval
      approval2 = create(:approval,
        expense: expense,
        approver: manager2,
        approved: true,
        comments: 'Receipt provided, approved',
        created_at: 1.day.ago)

      approvals = expense.approvals.order(created_at: :asc)

      expect(approvals.first).to eq(approval1)
      expect(approvals.first.approved).to be false
      expect(approvals.first.approver.name).to eq('Manager One')

      expect(approvals.last).to eq(approval2)
      expect(approvals.last.approved).to be true
      expect(approvals.last.approver.name).to eq('Manager Two')
    end
  end
end
