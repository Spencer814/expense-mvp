# frozen_string_literal: true

Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Health check for Railway
  get 'api/health', to: proc { [200, {}, ['OK']] }

  namespace :api do
    # Users - for role switching in frontend
    resources :users, only: [:index]

    # Expenses - full CRUD with state transitions
    resources :expenses do
      member do
        post :submit          # draft -> submitted
        post :approve         # submitted -> approved
        post :reject          # submitted -> rejected
        post :pay             # approved -> paid
        post :parse_receipt   # mock OCR
      end
    end

    # Dashboard - aggregated metrics for finance
    get 'dashboard', to: 'dashboard#index'
  end

  # Defines the root path route ("/")
  # root "articles#index"
end
