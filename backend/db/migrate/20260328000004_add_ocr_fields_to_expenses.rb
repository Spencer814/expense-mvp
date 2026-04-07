# frozen_string_literal: true

##
# Adds OCR processing metadata fields to expenses table.
#
# These fields support the OCR service by storing:
# - confidence: The OCR engine's confidence score (0.0-1.0)
# - raw_text: The full text extracted from the receipt
# - provider: Which OCR service processed the receipt
# - processed_at: When OCR processing completed
#
class AddOcrFieldsToExpenses < ActiveRecord::Migration[7.0]
  def change
    add_column :expenses, :ocr_confidence, :decimal, precision: 3, scale: 2
    add_column :expenses, :ocr_raw_text, :text
    add_column :expenses, :ocr_provider, :string
    add_column :expenses, :ocr_processed_at, :datetime

    add_index :expenses, :ocr_status
  end
end
