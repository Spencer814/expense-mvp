# frozen_string_literal: true

##
# Expense model representing a single expense submission in the approval workflow.
#
# Expenses flow through states: draft → submitted → approved/rejected → paid
# OCR processing can extract data from uploaded receipt images.
#
# @!attribute [rw] title
#   @return [String] Short description of the expense (3-200 chars)
#
# @!attribute [rw] vendor_name
#   @return [String] Name of the vendor/merchant (2-100 chars)
#
# @!attribute [rw] amount_cents
#   @return [Integer] Amount in cents (e.g., $45.99 = 4599)
#
# @!attribute [rw] currency
#   @return [String] Currency code (USD, EUR, GBP, CAD)
#
# @!attribute [rw] expense_date
#   @return [Date] When the expense was incurred
#
# @!attribute [rw] category
#   @return [String] Expense category for reporting
#
# @!attribute [rw] status
#   @return [String] Current workflow status
#
# @!attribute [rw] ocr_status
#   @return [String] OCR processing status
#
# @!attribute [rw] ocr_confidence
#   @return [Decimal] OCR extraction confidence (0.0-1.0)
#
# @!attribute [rw] ocr_raw_text
#   @return [String] Raw text extracted from receipt
#
class Expense < ApplicationRecord
  # Constants
  CATEGORIES = %w[travel meals office supplies equipment software other].freeze
  CURRENCIES = %w[USD EUR GBP CAD].freeze

  # Associations
  belongs_to :user
  has_many :approvals, dependent: :destroy
  has_many :approvers, through: :approvals, source: :approver

  # Enums for status tracking
  enum status: {
    draft: 'draft',
    submitted: 'submitted',
    approved: 'approved',
    rejected: 'rejected',
    paid: 'paid'
  }, _prefix: true

  enum ocr_status: {
    pending: 'pending',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed'
  }, _prefix: :ocr

  # Validations
  validates :title, presence: true, length: { minimum: 3, maximum: 200 }
  validates :vendor_name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :amount_cents, presence: true, numericality: { greater_than: 0, only_integer: true }
  validates :currency, presence: true, inclusion: { in: %w[USD EUR GBP CAD] }
  validates :expense_date, presence: true
  validates :category, presence: true, inclusion: {
    in: %w[travel meals office supplies equipment software other]
  }
  validates :status, presence: true, inclusion: { in: statuses.keys }
  validates :description, length: { maximum: 1000 }, allow_blank: true

  validate :expense_date_not_in_future

  # Callbacks
  before_validation :set_defaults

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :pending_approval, -> { where(status: 'submitted') }
  scope :approved, -> { where(status: 'approved') }
  scope :rejected, -> { where(status: 'rejected') }

  # Instance methods
  def amount_dollars
    amount_cents / 100.0
  end

  def amount_dollars=(dollars)
    self.amount_cents = (dollars.to_f * 100).to_i
  end

  def submit!
    return false unless status_draft?

    update(
      status: 'submitted',
      submitted_at: Time.current
    )
  end

  def approve!(approver)
    return false unless status_submitted?

    transaction do
      approvals.create!(
        approver: approver,
        decision: 'approved'
      )

      update!(
        status: 'approved',
        approved_at: Time.current
      )
    end
  end

  def reject!(approver, comment = nil)
    return false unless status_submitted?

    transaction do
      approvals.create!(
        approver: approver,
        decision: 'rejected',
        comment: comment
      )

      update!(status: 'rejected')
    end
  end

  def mark_paid!
    return false unless status_approved?

    update(
      status: 'paid',
      paid_at: Time.current
    )
  end

  def can_be_submitted?
    status_draft? && valid?
  end

  def can_be_approved?
    status_submitted?
  end

  def can_be_rejected?
    status_submitted?
  end

  def can_be_paid?
    status_approved?
  end

  ##
  # Processes a receipt image with OCR and updates expense data
  #
  # @param image_url [String] URL of the receipt image
  # @param image_data [String] Base64-encoded image data (alternative to URL)
  # @return [ApplicationService::Result] OCR processing result
  #
  def process_receipt(image_url: nil, image_data: nil)
    OcrService.call(
      image_url: image_url,
      image_data: image_data,
      expense_id: id
    )
  end

  ##
  # Checks if OCR processing can be initiated
  #
  # @return [Boolean] true if expense is in draft status and not already processing
  #
  def can_process_ocr?
    status_draft? && !ocr_processing?
  end

  ##
  # Returns OCR data as a hash for API responses
  #
  # @return [Hash] OCR metadata
  #
  def ocr_metadata
    {
      status: ocr_status,
      confidence: ocr_confidence,
      provider: ocr_provider,
      processed_at: ocr_processed_at,
      has_raw_text: ocr_raw_text.present?
    }
  end

  private

  def set_defaults
    self.currency ||= 'EUR'
    self.status ||= 'draft'
  end

  def expense_date_not_in_future
    return unless expense_date.present? && expense_date > Date.today

    errors.add(:expense_date, 'cannot be in the future')
  end
end
