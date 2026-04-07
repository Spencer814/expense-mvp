# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.email }
    role { :employee }

    trait :employee do
      role { :employee }
    end

    trait :manager do
      role { :manager }
    end

    trait :finance do
      role { :finance }
    end

    # Factory variant that creates a manager with team members
    factory :manager_with_team, traits: [:manager] do
      transient do
        team_members_count { 3 }
      end

      after(:create) do |manager, evaluator|
        create_list(:user, evaluator.team_members_count, :employee, manager: manager)
      end
    end
  end
end
