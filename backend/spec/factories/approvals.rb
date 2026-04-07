# frozen_string_literal: true

FactoryBot.define do
  factory :approval do
    association :expense, factory: :expense, strategy: :create
    association :approver, factory: %i[user manager], strategy: :create
    approved { true }
    comments { Faker::Lorem.sentence }

    trait :approved do
      approved { true }
      comments { 'Approved - looks good' }
    end

    trait :rejected do
      approved { false }
      comments { 'Rejected - needs more information' }
    end

    trait :with_detailed_comments do
      comments { Faker::Lorem.paragraph(sentence_count: 3) }
    end

    trait :without_comments do
      comments { nil }
    end
  end
end
