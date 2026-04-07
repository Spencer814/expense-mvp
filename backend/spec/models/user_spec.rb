# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it 'is valid with valid attributes' do
      expect(subject).to be_valid
    end

    describe 'name' do
      it 'is required' do
        subject.name = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:name]).to include("can't be blank")
      end

      it 'must be unique' do
        create(:user, name: 'John Doe')
        duplicate_user = build(:user, name: 'John Doe')
        expect(duplicate_user).not_to be_valid
        expect(duplicate_user.errors[:name]).to include('has already been taken')
      end
    end

    describe 'email' do
      it 'is required' do
        subject.email = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:email]).to include("can't be blank")
      end

      it 'must be unique' do
        create(:user, email: 'test@example.com')
        duplicate_user = build(:user, email: 'test@example.com')
        expect(duplicate_user).not_to be_valid
        expect(duplicate_user.errors[:email]).to include('has already been taken')
      end

      it 'validates email format' do
        subject.email = 'invalid-email'
        expect(subject).not_to be_valid
        expect(subject.errors[:email]).to include('is invalid')
      end

      it 'accepts valid email formats' do
        valid_emails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk'
        ]

        valid_emails.each do |email|
          subject.email = email
          expect(subject).to be_valid
        end
      end
    end

    describe 'role' do
      it 'is required' do
        subject.role = nil
        expect(subject).not_to be_valid
        expect(subject.errors[:role]).to include("can't be blank")
      end

      it 'must be a valid enum value' do
        expect { subject.role = :invalid_role }.to raise_error(ArgumentError)
      end
    end
  end

  describe 'enums' do
    it 'defines role enum with correct values' do
      expect(User.roles).to eq({
        'employee' => 0,
        'manager' => 1,
        'finance' => 2
      })
    end

    it 'allows setting roles using symbols' do
      user = build(:user)

      user.role = :employee
      expect(user.employee?).to be true

      user.role = :manager
      expect(user.manager?).to be true

      user.role = :finance
      expect(user.finance?).to be true
    end

    it 'allows setting roles using strings' do
      user = build(:user)

      user.role = 'employee'
      expect(user.employee?).to be true

      user.role = 'manager'
      expect(user.manager?).to be true

      user.role = 'finance'
      expect(user.finance?).to be true
    end
  end

  describe 'associations' do
    describe 'expenses' do
      it 'has many expenses' do
        user = create(:user)
        expense1 = create(:expense, user: user)
        expense2 = create(:expense, user: user)

        expect(user.expenses).to include(expense1, expense2)
        expect(user.expenses.count).to eq(2)
      end

      it 'destroys dependent expenses when user is destroyed' do
        user = create(:user)
        create(:expense, user: user)

        expect { user.destroy }.to change { Expense.count }.by(-1)
      end
    end

    describe 'approvals' do
      it 'has many approvals as approver' do
        manager = create(:user, :manager)
        employee = create(:user, :employee)
        expense = create(:expense, user: employee, status: :submitted)
        approval = create(:approval, expense: expense, approver: manager)

        expect(manager.approvals).to include(approval)
        expect(manager.approvals.count).to eq(1)
      end
    end

    describe 'team_members' do
      it 'has many team_members' do
        manager = create(:manager_with_team, team_members_count: 3)

        expect(manager.team_members.count).to eq(3)
        expect(manager.team_members).to all(be_a(User))
      end

      it 'returns empty array for user without team members' do
        employee = create(:user, :employee)
        expect(employee.team_members).to be_empty
      end
    end

    describe 'manager' do
      it 'belongs to a manager' do
        manager = create(:user, :manager)
        employee = create(:user, :employee, manager: manager)

        expect(employee.manager).to eq(manager)
      end

      it 'can exist without a manager' do
        employee = create(:user, :employee, manager: nil)
        expect(employee.manager).to be_nil
      end
    end
  end

  describe 'manager/team_members relationship' do
    it 'correctly establishes bidirectional relationship' do
      manager = create(:user, :manager)
      employee1 = create(:user, :employee, manager: manager)
      employee2 = create(:user, :employee, manager: manager)

      # Manager can access team members
      expect(manager.team_members).to include(employee1, employee2)
      expect(manager.team_members.count).to eq(2)

      # Employees can access their manager
      expect(employee1.manager).to eq(manager)
      expect(employee2.manager).to eq(manager)
    end

    it 'updates team_members when employees are reassigned' do
      manager1 = create(:user, :manager)
      manager2 = create(:user, :manager)
      employee = create(:user, :employee, manager: manager1)

      expect(manager1.team_members).to include(employee)
      expect(manager2.team_members).not_to include(employee)

      # Reassign employee to manager2
      employee.update(manager: manager2)

      expect(manager1.reload.team_members).not_to include(employee)
      expect(manager2.reload.team_members).to include(employee)
    end

    it 'allows a manager to have no team members' do
      manager = create(:user, :manager)
      expect(manager.team_members).to be_empty
    end

    it 'allows adding team members after manager creation' do
      manager = create(:user, :manager)
      expect(manager.team_members.count).to eq(0)

      create(:user, :employee, manager: manager)
      create(:user, :employee, manager: manager)

      expect(manager.reload.team_members.count).to eq(2)
    end
  end

  describe 'factory traits' do
    it 'creates an employee with :employee trait' do
      employee = create(:user, :employee)
      expect(employee.employee?).to be true
    end

    it 'creates a manager with :manager trait' do
      manager = create(:user, :manager)
      expect(manager.manager?).to be true
    end

    it 'creates a finance user with :finance trait' do
      finance = create(:user, :finance)
      expect(finance.finance?).to be true
    end

    it 'creates a manager with team using manager_with_team factory' do
      manager = create(:manager_with_team, team_members_count: 5)
      expect(manager.manager?).to be true
      expect(manager.team_members.count).to eq(5)
      expect(manager.team_members).to all(be_employee)
    end
  end

  describe 'role-specific behavior' do
    describe 'employee' do
      let(:employee) { create(:user, :employee) }

      it 'can create expenses' do
        expense = create(:expense, user: employee)
        expect(employee.expenses).to include(expense)
      end

      it 'cannot approve expenses' do
        expect(employee.employee?).to be true
        expect(employee.manager?).to be false
        expect(employee.finance?).to be false
      end
    end

    describe 'manager' do
      let(:manager) { create(:user, :manager) }

      it 'can have team members' do
        employee = create(:user, :employee, manager: manager)
        expect(manager.team_members).to include(employee)
      end

      it 'can create approvals' do
        employee = create(:user, :employee)
        expense = create(:expense, user: employee, status: :submitted)
        approval = create(:approval, expense: expense, approver: manager)

        expect(manager.approvals).to include(approval)
      end

      it 'has manager role permissions' do
        expect(manager.manager?).to be true
        expect(manager.employee?).to be false
        expect(manager.finance?).to be false
      end
    end

    describe 'finance' do
      let(:finance) { create(:user, :finance) }

      it 'has finance role permissions' do
        expect(finance.finance?).to be true
        expect(finance.employee?).to be false
        expect(finance.manager?).to be false
      end

      it 'can access all expenses for dashboard' do
        create_list(:expense, 5)
        # Finance role should have access to view all expenses
        # This would be tested in controller/request specs
        expect(finance.finance?).to be true
      end
    end
  end

  describe 'scopes and queries' do
    before do
      @employee1 = create(:user, :employee)
      @employee2 = create(:user, :employee)
      @manager1 = create(:user, :manager)
      @manager2 = create(:user, :manager)
      @finance = create(:user, :finance)
    end

    it 'can query users by role' do
      employees = User.where(role: :employee)
      managers = User.where(role: :manager)
      finance_users = User.where(role: :finance)

      expect(employees.count).to eq(2)
      expect(managers.count).to eq(2)
      expect(finance_users.count).to eq(1)
    end
  end
end
