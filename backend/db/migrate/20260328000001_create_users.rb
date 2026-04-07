# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[7.0]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :role, null: false, default: 'employee'
      t.integer :manager_id
      t.string :department

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, :manager_id
    add_index :users, :role
  end
end
