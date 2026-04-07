# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ApplicationService, type: :service do
  # Test subclass to verify base functionality
  class TestService < ApplicationService
    def initialize(should_succeed:, data: nil, error_message: nil)
      @should_succeed = should_succeed
      @data = data
      @error_message = error_message
    end

    def call
      if @should_succeed
        success(@data)
      else
        failure(@error_message)
      end
    end
  end

  # Test subclass that doesn't implement call
  class IncompleteService < ApplicationService
  end

  describe '.call' do
    it 'creates instance and invokes call' do
      result = TestService.call(should_succeed: true, data: { key: 'value' })

      expect(result).to be_success
      expect(result.data).to eq({ key: 'value' })
    end

    it 'passes arguments to initialize' do
      result = TestService.call(should_succeed: false, error_message: 'Something went wrong')

      expect(result).to be_failure
      expect(result.error).to eq('Something went wrong')
    end
  end

  describe '#call' do
    it 'raises NotImplementedError if not overridden' do
      expect { IncompleteService.call }.to raise_error(
        NotImplementedError,
        'IncompleteService must implement #call'
      )
    end
  end

  describe ApplicationService::Result do
    describe '#success?' do
      it 'returns true for successful results' do
        result = described_class.new(success: true, data: 'test')

        expect(result.success?).to be true
        expect(result.failure?).to be false
      end

      it 'returns false for failed results' do
        result = described_class.new(success: false, error: 'error')

        expect(result.success?).to be false
        expect(result.failure?).to be true
      end
    end

    describe '#data' do
      it 'returns the data for successful results' do
        result = described_class.new(success: true, data: { items: [1, 2, 3] })

        expect(result.data).to eq({ items: [1, 2, 3] })
      end

      it 'returns nil when not provided' do
        result = described_class.new(success: true)

        expect(result.data).to be_nil
      end
    end

    describe '#error' do
      it 'returns the error message for failed results' do
        result = described_class.new(success: false, error: 'Something failed')

        expect(result.error).to eq('Something failed')
      end

      it 'returns nil for successful results' do
        result = described_class.new(success: true, data: 'test')

        expect(result.error).to be_nil
      end
    end
  end
end
