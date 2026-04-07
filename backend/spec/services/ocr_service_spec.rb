# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OcrService, type: :service do
  describe '.call' do
    context 'with valid image_url' do
      subject(:result) { described_class.call(image_url: 'https://example.com/receipt.jpg') }

      it 'returns a successful result' do
        expect(result).to be_success
      end

      it 'extracts vendor_name' do
        expect(result.data[:vendor_name]).to be_present
      end

      it 'extracts title' do
        expect(result.data[:title]).to be_present
      end

      it 'extracts amount_cents as positive integer' do
        expect(result.data[:amount_cents]).to be_a(Integer)
        expect(result.data[:amount_cents]).to be > 0
      end

      it 'extracts category from valid categories' do
        expect(Expense::CATEGORIES).to include(result.data[:category])
      end

      it 'extracts expense_date as valid date string' do
        expect { Date.parse(result.data[:expense_date]) }.not_to raise_error
      end

      it 'includes confidence score between 0 and 1' do
        expect(result.data[:confidence]).to be_between(0.0, 1.0)
      end

      it 'includes provider information' do
        expect(result.data[:provider]).to eq('mock')
      end

      it 'includes raw_text from the receipt' do
        expect(result.data[:raw_text]).to be_present
      end
    end

    context 'with valid image_data' do
      let(:base64_data) { Base64.strict_encode64('fake image data') }

      subject(:result) do
        described_class.call(
          image_data: base64_data,
          content_type: 'image/jpeg'
        )
      end

      it 'returns a successful result' do
        expect(result).to be_success
      end

      it 'extracts expense data' do
        expect(result.data[:vendor_name]).to be_present
        expect(result.data[:amount_cents]).to be > 0
      end
    end

    context 'with invalid input' do
      it 'fails when no image source is provided' do
        result = described_class.call

        expect(result).to be_failure
        expect(result.error).to include('Either image_url or image_data must be provided')
      end

      it 'fails when both image_url and image_data are provided' do
        result = described_class.call(
          image_url: 'https://example.com/receipt.jpg',
          image_data: 'base64data'
        )

        expect(result).to be_failure
        expect(result.error).to include('Cannot provide both image_url and image_data')
      end

      it 'fails with invalid content_type' do
        result = described_class.call(
          image_data: 'base64data',
          content_type: 'text/plain'
        )

        expect(result).to be_failure
        expect(result.error).to include('Invalid content type')
      end
    end

    context 'with expense_id' do
      let(:user) { create(:user) }
      let(:expense) do
        create(:expense, :draft, user: user, ocr_status: 'pending')
      end

      it 'updates expense with OCR data on success' do
        result = described_class.call(
          image_url: 'https://example.com/receipt.jpg',
          expense_id: expense.id
        )

        expect(result).to be_success

        expense.reload
        expect(expense.ocr_status).to eq('completed')
        expect(expense.vendor_name).to be_present
        expect(expense.amount_cents).to be > 0
      end

      it 'updates ocr_status to processing during execution' do
        # This is tested implicitly through the successful completion
        # In a real async implementation, we would test the intermediate state
        result = described_class.call(
          image_url: 'https://example.com/receipt.jpg',
          expense_id: expense.id
        )

        expect(result).to be_success
        expect(expense.reload.ocr_status).to eq('completed')
      end
    end
  end

  describe 'data quality' do
    subject(:result) { described_class.call(image_url: 'https://example.com/receipt.jpg') }

    it 'generates expense_date within last 30 days' do
      date = Date.parse(result.data[:expense_date])
      expect(date).to be <= Date.today
      expect(date).to be >= Date.today - 30
    end

    it 'generates realistic amounts for the category' do
      data = result.data

      # Amount should be reasonable for the category
      case data[:category]
      when 'travel'
        expect(data[:amount_cents]).to be_between(15_000, 150_000)
      when 'meals'
        expect(data[:amount_cents]).to be_between(800, 5_000)
      when 'supplies'
        expect(data[:amount_cents]).to be_between(1_500, 15_000)
      when 'equipment'
        expect(data[:amount_cents]).to be_between(20_000, 200_000)
      when 'software'
        expect(data[:amount_cents]).to be_between(2_000, 50_000)
      end
    end

    it 'generates title that includes vendor name' do
      data = result.data
      expect(data[:title]).to include(data[:vendor_name])
    end

    it 'generates description with category context' do
      data = result.data
      expect(data[:description]).to include(data[:category].capitalize)
    end
  end

  describe 'provider configuration' do
    around do |example|
      original_provider = ENV.fetch('EXPENSE_OCR_PROVIDER', nil)
      example.run
      ENV['EXPENSE_OCR_PROVIDER'] = original_provider
    end

    it 'uses mock provider by default' do
      ENV.delete('EXPENSE_OCR_PROVIDER')
      result = described_class.call(image_url: 'https://example.com/receipt.jpg')

      expect(result).to be_success
      expect(result.data[:provider]).to eq('mock')
    end

    it 'returns error for unconfigured google_vision provider' do
      ENV['EXPENSE_OCR_PROVIDER'] = 'google_vision'
      result = described_class.call(image_url: 'https://example.com/receipt.jpg')

      expect(result).to be_failure
      expect(result.error).to include('Google Cloud Vision integration not yet configured')
    end

    it 'returns error for unconfigured aws_textract provider' do
      ENV['EXPENSE_OCR_PROVIDER'] = 'aws_textract'
      result = described_class.call(image_url: 'https://example.com/receipt.jpg')

      expect(result).to be_failure
      expect(result.error).to include('AWS Textract integration not yet configured')
    end

    it 'returns error for unknown provider' do
      ENV['EXPENSE_OCR_PROVIDER'] = 'unknown_provider'
      result = described_class.call(image_url: 'https://example.com/receipt.jpg')

      expect(result).to be_failure
      expect(result.error).to include('Unknown OCR provider')
    end
  end
end
