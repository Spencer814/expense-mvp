# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_03_28_000004) do
  create_table "approvals", force: :cascade do |t|
    t.integer "expense_id", null: false
    t.integer "approver_id", null: false
    t.string "decision", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["approver_id"], name: "index_approvals_on_approver_id"
    t.index ["decision"], name: "index_approvals_on_decision"
    t.index ["expense_id", "approver_id"], name: "index_approvals_on_expense_id_and_approver_id", unique: true
    t.index ["expense_id"], name: "index_approvals_on_expense_id"
  end

  create_table "expenses", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "title", null: false
    t.string "vendor_name", null: false
    t.integer "amount_cents", null: false
    t.string "currency", default: "EUR", null: false
    t.date "expense_date", null: false
    t.string "category", null: false
    t.text "description"
    t.string "status", default: "draft", null: false
    t.string "receipt_url"
    t.string "ocr_status"
    t.datetime "submitted_at"
    t.datetime "approved_at"
    t.datetime "paid_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "ocr_confidence", precision: 3, scale: 2
    t.text "ocr_raw_text"
    t.string "ocr_provider"
    t.datetime "ocr_processed_at"
    t.index ["category"], name: "index_expenses_on_category"
    t.index ["expense_date"], name: "index_expenses_on_expense_date"
    t.index ["ocr_status"], name: "index_expenses_on_ocr_status"
    t.index ["status"], name: "index_expenses_on_status"
    t.index ["user_id"], name: "index_expenses_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "role", default: "employee", null: false
    t.integer "manager_id"
    t.string "department"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["manager_id"], name: "index_users_on_manager_id"
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "approvals", "expenses"
  add_foreign_key "approvals", "users", column: "approver_id"
  add_foreign_key "expenses", "users"
end
