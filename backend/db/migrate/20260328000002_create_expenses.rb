# frozen_string_literal: true

class CreateExpenses < ActiveRecord::Migration[7.0]
  def change
    create_table :expenses do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :vendor_name, null: false
      t.integer :amount_cents, null: false
      t.string :currency, null: false, default: 'EUR'
      t.date :expense_date, null: false
      t.string :category, null: false
      t.text :description
      t.string :status, null: false, default: 'draft'
      t.string :receipt_url
      t.string :ocr_status
      t.datetime :submitted_at
      t.datetime :approved_at
      t.datetime :paid_at

      t.timestamps
    end

    add_index :expenses, :status
    add_index :expenses, :expense_date
    add_index :expenses, :category
  end
end
