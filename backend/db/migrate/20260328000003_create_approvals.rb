# frozen_string_literal: true

class CreateApprovals < ActiveRecord::Migration[7.0]
  def change
    create_table :approvals do |t|
      t.references :expense, null: false, foreign_key: true
      t.references :approver, null: false, foreign_key: { to_table: :users }
      t.string :decision, null: false
      t.text :comment

      t.timestamps
    end

    add_index :approvals, %i[expense_id approver_id], unique: true
    add_index :approvals, :decision
  end
end
