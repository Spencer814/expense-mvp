# frozen_string_literal: true

##
# Service for extracting expense data from receipt images using OCR.
#
# This service provides a pluggable architecture for OCR processing:
# - Accepts receipt images via URL or base64-encoded data
# - Extracts vendor name, amount, date, and description
# - Returns structured data matching Expense model attributes
#
# The service supports multiple OCR providers (configurable via EXPENSE_OCR_PROVIDER):
# - :mock - Returns realistic mock data (default for development/testing)
# - :google_vision - Google Cloud Vision API (production)
# - :aws_textract - AWS Textract (alternative production option)
#
# @example Basic usage with image URL
#   result = OcrService.call(image_url: 'https://example.com/receipt.jpg')
#   if result.success?
#     expense_data = result.data
#     # => { vendor_name: 'Office Depot', amount_cents: 4599, ... }
#   end
#
# @example With base64 image data
#   result = OcrService.call(image_data: base64_encoded_string, content_type: 'image/jpeg')
#
class OcrService < ApplicationService
  # Valid content types for receipt images
  VALID_CONTENT_TYPES = %w[image/jpeg image/png image/gif image/webp application/pdf].freeze

  # Maximum image size in bytes (10MB)
  MAX_IMAGE_SIZE = 10 * 1024 * 1024

  # Vendor patterns for enhanced mock data generation
  VENDOR_PATTERNS = [
    { name: 'Office Depot', category: 'supplies', keywords: %w[paper toner staples folders] },
    { name: 'Starbucks', category: 'meals', keywords: %w[coffee latte frappuccino pastry] },
    { name: 'United Airlines', category: 'travel', keywords: %w[flight airfare ticket boarding] },
    { name: 'Marriott Hotels', category: 'travel', keywords: %w[room night lodging hotel] },
    { name: 'Uber', category: 'travel', keywords: %w[ride trip fare transportation] },
    { name: 'Best Buy', category: 'equipment', keywords: %w[laptop monitor keyboard mouse] },
    { name: 'Adobe', category: 'software', keywords: %w[license subscription creative cloud] },
    { name: 'Amazon Web Services', category: 'software', keywords: %w[cloud hosting compute storage] },
    { name: 'Chipotle', category: 'meals', keywords: %w[burrito bowl tacos lunch] },
    { name: 'The Home Depot', category: 'supplies', keywords: %w[tools hardware maintenance repair] }
  ].freeze

  ##
  # Creates a new OCR service instance
  #
  # @param image_url [String, nil] URL of the receipt image
  # @param image_data [String, nil] Base64-encoded image data
  # @param content_type [String] MIME type of the image (default: 'image/jpeg')
  # @param expense_id [Integer, nil] Optional expense ID to update with OCR results
  #
  def initialize(image_url: nil, image_data: nil, content_type: 'image/jpeg', expense_id: nil)
    super()
    @image_url = image_url
    @image_data = image_data
    @content_type = content_type
    @expense_id = expense_id
  end

  ##
  # Processes the receipt image and extracts expense data
  #
  # @return [ApplicationService::Result] Result containing extracted expense data or error
  #   On success, data contains:
  #   - vendor_name [String] Name of the vendor
  #   - title [String] Generated title for the expense
  #   - amount_cents [Integer] Amount in cents
  #   - category [String] Expense category
  #   - expense_date [String] Date of the expense (ISO 8601)
  #   - description [String] Generated description
  #   - confidence [Float] OCR confidence score (0.0-1.0)
  #
  def call
    validation_result = validate_input
    return validation_result if validation_result&.failure?

    update_ocr_status(:processing)
    result = process_with_provider
    handle_successful_result(result)
    result
  rescue StandardError => e
    handle_processing_error(e)
  end

  private

  ##
  # Validates the input parameters
  #
  # @return [ApplicationService::Result, nil] Failure result if validation fails, nil otherwise
  #
  def validate_input
    return failure('Either image_url or image_data must be provided') if @image_url.blank? && @image_data.blank?
    return failure('Cannot provide both image_url and image_data') if @image_url.present? && @image_data.present?

    unless VALID_CONTENT_TYPES.include?(@content_type)
      return failure("Invalid content type: #{@content_type}. Must be one of: #{VALID_CONTENT_TYPES.join(', ')}")
    end

    nil
  end

  ##
  # Handles successful OCR result by updating expense
  #
  # @param result [ApplicationService::Result] The OCR result
  #
  def handle_successful_result(result)
    update_expense_with_ocr_data(result.data) if result.success? && @expense_id
  end

  ##
  # Handles processing errors
  #
  # @param error [StandardError] The error that occurred
  # @return [ApplicationService::Result] Failure result
  #
  def handle_processing_error(error)
    update_ocr_status(:failed)
    Rails.logger.error("OCR processing failed: #{error.message}")
    failure("OCR processing failed: #{error.message}")
  end

  ##
  # Routes processing to the configured OCR provider
  #
  # @return [ApplicationService::Result] Result from the provider
  #
  def process_with_provider
    provider = ENV.fetch('EXPENSE_OCR_PROVIDER', 'mock').to_sym

    case provider
    when :mock
      process_with_mock
    when :google_vision
      process_with_google_vision
    when :aws_textract
      process_with_aws_textract
    else
      failure("Unknown OCR provider: #{provider}")
    end
  end

  ##
  # Processes receipt using mock OCR (for development/testing)
  # Generates realistic-looking expense data based on simulated receipt parsing
  #
  # @return [ApplicationService::Result] Mock OCR results
  #
  def process_with_mock
    # Simulate processing delay (realistic for actual OCR)
    sleep(rand(0.3..0.8))

    # Generate realistic mock data
    vendor = VENDOR_PATTERNS.sample
    amount_cents = generate_realistic_amount(vendor[:category])
    expense_date = generate_realistic_date

    extracted_data = {
      vendor_name: vendor[:name],
      title: generate_title(vendor),
      amount_cents: amount_cents,
      category: vendor[:category],
      expense_date: expense_date.to_s,
      description: generate_description(vendor),
      confidence: rand(0.85..0.98).round(2),
      raw_text: generate_mock_raw_text(vendor, amount_cents, expense_date),
      provider: 'mock'
    }

    success(extracted_data)
  end

  ##
  # Processes receipt using Google Cloud Vision API
  # @note Not yet implemented - requires google-cloud-vision gem and API credentials
  #
  # @return [ApplicationService::Result] Google Vision OCR results
  #
  def process_with_google_vision
    # TODO: Implement Google Cloud Vision integration
    # Requires:
    # 1. Add 'google-cloud-vision' gem to Gemfile
    # 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
    # 3. Enable Cloud Vision API in Google Cloud Console
    #
    # Example implementation:
    # require 'google/cloud/vision'
    # client = Google::Cloud::Vision.image_annotator
    # response = client.text_detection(image: image_source)
    # text = response.responses.first.full_text_annotation.text
    # parse_receipt_text(text)

    failure('Google Cloud Vision integration not yet configured. Set EXPENSE_OCR_PROVIDER=mock for development.')
  end

  ##
  # Processes receipt using AWS Textract
  # @note Not yet implemented - requires aws-sdk-textract gem and AWS credentials
  #
  # @return [ApplicationService::Result] AWS Textract OCR results
  #
  def process_with_aws_textract
    # TODO: Implement AWS Textract integration
    # Requires:
    # 1. Add 'aws-sdk-textract' gem to Gemfile
    # 2. Configure AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    # 3. Set AWS_REGION environment variable
    #
    # Example implementation:
    # client = Aws::Textract::Client.new
    # response = client.analyze_expense(document: { bytes: image_bytes })
    # parse_textract_response(response)

    failure('AWS Textract integration not yet configured. Set EXPENSE_OCR_PROVIDER=mock for development.')
  end

  ##
  # Generates a realistic amount based on expense category
  #
  # @param category [String] The expense category
  # @return [Integer] Amount in cents
  #
  def generate_realistic_amount(category)
    ranges = {
      'travel' => 15_000..150_000,    # $150 - $1,500
      'meals' => 800..5_000,          # $8 - $50
      'supplies' => 1_500..15_000,    # $15 - $150
      'equipment' => 20_000..200_000, # $200 - $2,000
      'software' => 2_000..50_000,    # $20 - $500
      'other' => 1_000..10_000        # $10 - $100
    }

    range = ranges.fetch(category, ranges['other'])
    rand(range)
  end

  ##
  # Generates a realistic expense date (within last 30 days)
  #
  # @return [Date] A date within the last 30 days
  #
  def generate_realistic_date
    Date.today - rand(0..30)
  end

  ##
  # Generates an expense title based on vendor
  #
  # @param vendor [Hash] Vendor data from VENDOR_PATTERNS
  # @return [String] Generated title
  #
  def generate_title(vendor)
    item = vendor[:keywords].sample
    "#{vendor[:name]} - #{item.capitalize}"
  end

  ##
  # Generates a description based on vendor
  #
  # @param vendor [Hash] Vendor data from VENDOR_PATTERNS
  # @return [String] Generated description
  #
  def generate_description(vendor)
    items = vendor[:keywords].sample(rand(1..3))
    "#{vendor[:category].capitalize} expense: #{items.join(', ')}"
  end

  ##
  # Generates mock raw text (simulating actual OCR output)
  #
  # @param vendor [Hash] Vendor data
  # @param amount_cents [Integer] Amount in cents
  # @param date [Date] Expense date
  # @return [String] Simulated raw OCR text
  #
  def generate_mock_raw_text(vendor, amount_cents, date)
    [
      mock_header(vendor),
      mock_datetime(date),
      mock_line_items(vendor),
      mock_totals(amount_cents),
      'Thank you for your business!'
    ].join("\n\n")
  end

  def mock_header(vendor)
    address = "#{rand(100..999)} #{%w[Main Commerce Tech Business].sample} #{%w[St Blvd Park Center].sample}"
    city = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA'].sample
    "#{vendor[:name].upcase}\n#{address}\n#{city}"
  end

  def mock_datetime(date)
    "Date: #{date.strftime('%m/%d/%Y')}\nTime: #{rand(8..20)}:#{format('%02d', rand(0..59))}"
  end

  def mock_line_items(vendor)
    vendor[:keywords].sample(rand(1..3)).map { |keyword|
      "#{keyword.capitalize.ljust(20)} $#{rand(5..50)}.#{format('%02d', rand(0..99))}"
    }.join("\n")
  end

  def mock_totals(amount_cents)
    amount = amount_cents / 100.0
    subtotal = format('%.2f', amount * 0.9)
    tax = format('%.2f', amount * 0.1)
    total = format('%.2f', amount)
    "Subtotal: $#{subtotal}\nTax: $#{tax}\nTotal: $#{total}"
  end

  ##
  # Updates the OCR status on the associated expense
  #
  # @param status [Symbol] The new OCR status (:pending, :processing, :completed, :failed)
  #
  def update_ocr_status(status)
    return unless @expense_id

    expense = Expense.find_by(id: @expense_id)
    expense&.update(ocr_status: status)
  end

  ##
  # Updates the expense with extracted OCR data
  #
  # @param ocr_data [Hash] The extracted OCR data
  #
  def update_expense_with_ocr_data(ocr_data)
    expense = Expense.find_by(id: @expense_id)
    return unless expense

    expense.update(
      vendor_name: ocr_data[:vendor_name],
      title: ocr_data[:title],
      amount_cents: ocr_data[:amount_cents],
      category: ocr_data[:category],
      expense_date: ocr_data[:expense_date],
      description: ocr_data[:description],
      ocr_status: :completed,
      ocr_confidence: ocr_data[:confidence],
      ocr_raw_text: ocr_data[:raw_text]
    )
  end
end
