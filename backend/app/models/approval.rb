# frozen_string_literal: true

class Approval < ApplicationRecord
  # Associations
  belongs_to :expense
  belongs_to :approver, class_name: 'User'

  # Enums
  enum decision: {
    approved: 'approved',
    rejected: 'rejected'
  }, _prefix: true

  # Validations
  validates :decision, presence: true, inclusion: { in: decisions.keys }
  validates :approver_id, uniqueness: { scope: :expense_id, message: 'has already approved/rejected this expense' }
  validates :comment, length: { maximum: 500 }, allow_blank: true

  # Callbacks
  after_create :notify_expense_owner

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :approved, -> { where(decision: 'approved') }
  scope :rejected, -> { where(decision: 'rejected') }

  private

  def notify_expense_owner
    # Hook for future notification system
    # Could send email, push notification, etc.
    Rails.logger.info "Expense ##{expense_id} was #{decision} by User ##{approver_id}"
  end
end
