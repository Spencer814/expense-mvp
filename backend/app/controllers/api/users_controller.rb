# frozen_string_literal: true

module Api
  class UsersController < BaseController
    # GET /api/users
    # Returns all users for role switching in frontend
    def index
      users = User.select(:id, :name, :email, :role).order(:name)
      render_success(users)
    end
  end
end
