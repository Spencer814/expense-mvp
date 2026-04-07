# frozen_string_literal: true

class User < ApplicationRecord
  # Associations
  has_many :expenses, dependent: :destroy
  has_many :approvals, foreign_key: :approver_id, dependent: :destroy
  belongs_to :manager, class_name: 'User', optional: true
  has_many :subordinates, class_name: 'User', foreign_key: :manager_id

  # Enums
  enum role: {
    employee: 'employee',
    manager: 'manager',
    finance: 'finance'
  }, _prefix: true

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
    uniqueness: { case_sensitive: false },
    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, presence: true, inclusion: { in: roles.keys }
  validates :department, length: { maximum: 100 }, allow_blank: true

  # Callbacks
  before_validation :normalize_email

  # Scopes
  scope :employees, -> { where(role: 'employee') }
  scope :managers, -> { where(role: 'manager') }
  scope :finance_team, -> { where(role: 'finance') }

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
