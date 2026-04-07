# frozen_string_literal: true

FactoryBot.define do
  factory :expense do
    association :user, factory: :user, strategy: :create
    title { Faker::Commerce.product_name }
    vendor_name { Faker::Company.name }
    description { Faker::Lorem.sentence }
    amount_cents { rand(1000..100_000) } # $10 to $1000
    currency { 'USD' }
    expense_date { Faker::Date.between(from: 30.days.ago, to: Date.today) }
    category { Expense::CATEGORIES.sample }
    status { 'draft' }

    trait :draft do
      status { 'draft' }
    end

    trait :submitted do
      status { 'submitted' }
      submitted_at { Time.current }
    end

    trait :approved do
      status { 'approved' }
      submitted_at { 2.days.ago }
      approved_at { 1.day.ago }

      after(:create) do |expense|
        create(:approval, expense: expense, approver: create(:user, :manager))
      end
    end

    trait :rejected do
      status { 'rejected' }
      submitted_at { 2.days.ago }

      after(:create) do |expense|
        create(:approval, expense: expense, approver: create(:user, :manager), decision: 'rejected')
      end
    end

    trait :paid do
      status { 'paid' }
      submitted_at { 3.days.ago }
      approved_at { 2.days.ago }
      paid_at { 1.day.ago }

      after(:create) do |expense|
        create(:approval, expense: expense, approver: create(:user, :manager))
      end
    end

    # Additional traits for testing specific scenarios
    trait :with_receipt do
      receipt_url { Faker::Internet.url }
    end

    trait :high_value do
      amount_cents { 500_000 } # $5,000
    end

    trait :low_value do
      amount_cents { 500 } # $5
    end

    trait :recent do
      expense_date { Date.today }
    end

    trait :old do
      expense_date { 90.days.ago }
    end
  end
end
