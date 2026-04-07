# frozen_string_literal: true

module Api
  class BaseController < ApplicationController
    before_action :set_current_user

    private

    # Simulates current user based on X-User-Id header
    # Falls back to User.first if header not present
    def set_current_user
      user_id = request.headers['X-User-Id']
      @current_user = if user_id.present?
                        User.find_by(id: user_id)
                      else
                        User.first
                      end

      return if @current_user

      render json: { error: 'User not found' }, status: :unauthorized
      nil
    end

    attr_reader :current_user

    # Helper method to render errors consistently
    def render_error(message, status = :unprocessable_entity)
      render json: { error: message }, status: status
    end

    # Helper method to render success responses consistently
    def render_success(data, status = :ok)
      render json: data, status: status
    end
  end
end
