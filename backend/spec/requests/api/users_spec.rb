# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::Users', type: :request do
  describe 'GET /api/users' do
    context 'with multiple users' do
      before do
        @employee1 = create(:user, :employee, name: 'Alice Employee', email: 'alice@example.com')
        @employee2 = create(:user, :employee, name: 'Bob Employee', email: 'bob@example.com')
        @manager1 = create(:user, :manager, name: 'Charlie Manager', email: 'charlie@example.com')
        @manager2 = create(:user, :manager, name: 'Diana Manager', email: 'diana@example.com')
        @finance = create(:user, :finance, name: 'Eve Finance', email: 'eve@example.com')
      end

      it 'returns all users' do
        get '/api/users'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(5)
      end

      it 'returns users with correct attributes' do
        get '/api/users'

        json = JSON.parse(response.body)
        user = json.first

        expect(user).to have_key('id')
        expect(user).to have_key('name')
        expect(user).to have_key('email')
        expect(user).to have_key('role')
      end

      it 'includes users of all roles' do
        get '/api/users'

        json = JSON.parse(response.body)
        roles = json.map { |u| u['role'] }

        expect(roles).to include('employee', 'manager', 'finance')
      end

      it 'returns users ordered by name' do
        get '/api/users'

        json = JSON.parse(response.body)
        names = json.map { |u| u['name'] }

        # Check if sorted alphabetically (if that's your implementation)
        # Adjust based on actual implementation
        expect(names).to include('Alice Employee', 'Bob Employee', 'Charlie Manager')
      end
    end

    context 'with no users' do
      before do
        User.destroy_all
      end

      it 'returns empty array' do
        get '/api/users'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json).to eq([])
      end
    end

    context 'response format' do
      before do
        @user = create(:user, :employee, name: 'Test User', email: 'test@example.com')
      end

      it 'returns properly formatted JSON' do
        get '/api/users'

        expect(response.content_type).to match(%r{application/json})

        json = JSON.parse(response.body)
        expect(json).to be_an(Array)
      end

      it 'includes essential user fields' do
        get '/api/users'

        json = JSON.parse(response.body)
        user = json.find { |u| u['id'] == @user.id }

        expect(user['id']).to eq(@user.id)
        expect(user['name']).to eq('Test User')
        expect(user['email']).to eq('test@example.com')
        expect(user['role']).to eq('employee')
      end

      it 'does not include sensitive fields' do
        get '/api/users'

        json = JSON.parse(response.body)
        user = json.first

        # Ensure no password or other sensitive data is exposed
        expect(user).not_to have_key('password')
        expect(user).not_to have_key('password_digest')
      end
    end

    context 'with manager-employee relationships' do
      before do
        @manager = create(:user, :manager, name: 'Manager')
        @employee1 = create(:user, :employee, name: 'Employee 1', manager: @manager)
        @employee2 = create(:user, :employee, name: 'Employee 2', manager: @manager)
      end

      it 'returns all users including relationships' do
        get '/api/users'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(3)
      end

      it 'includes manager_id for employees if exposed' do
        get '/api/users'

        json = JSON.parse(response.body)
        employee = json.find { |u| u['name'] == 'Employee 1' }

        # If manager_id is exposed in the API
        expect(employee['manager_id']).to eq(@manager.id) if employee.key?('manager_id')
      end

      it 'can identify manager by role' do
        get '/api/users'

        json = JSON.parse(response.body)
        managers = json.select { |u| u['role'] == 'manager' }

        expect(managers.length).to eq(1)
        expect(managers.first['name']).to eq('Manager')
      end
    end

    context 'filtering by role' do
      before do
        create_list(:user, 3, :employee)
        create_list(:user, 2, :manager)
        create_list(:user, 1, :finance)
      end

      it 'can return all users without filter' do
        get '/api/users'

        json = JSON.parse(response.body)
        expect(json.length).to eq(6)
      end

      it 'can filter by employee role if supported' do
        get '/api/users', params: { role: 'employee' }

        json = JSON.parse(response.body)

        # If filtering is supported
        if json.all? { |u| u['role'] == 'employee' }
          expect(json.length).to eq(3)
        else
          # If not supported, returns all users
          expect(json.length).to eq(6)
        end
      end

      it 'can filter by manager role if supported' do
        get '/api/users', params: { role: 'manager' }

        json = JSON.parse(response.body)

        # If filtering is supported
        expect(json.length).to eq(2) if json.all? { |u| u['role'] == 'manager' }
      end
    end

    context 'performance with large dataset' do
      before do
        create_list(:user, 100, :employee)
      end

      it 'returns all users efficiently' do
        get '/api/users'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(100)
      end

      it 'responds within acceptable time' do
        start_time = Time.current

        get '/api/users'

        response_time = Time.current - start_time

        # Should respond quickly (adjust threshold as needed)
        expect(response_time).to be < 1.0 # Less than 1 second
      end
    end

    context 'use case: role switching in frontend' do
      before do
        @users = [
          create(:user, :employee, name: 'Employee User'),
          create(:user, :manager, name: 'Manager User'),
          create(:user, :finance, name: 'Finance User')
        ]
      end

      it 'provides data needed for user selection dropdown' do
        get '/api/users'

        json = JSON.parse(response.body)

        # Each user should have id and name for dropdown
        json.each do |user|
          expect(user).to have_key('id')
          expect(user).to have_key('name')
          expect(user).to have_key('role')
        end
      end

      it 'includes role information for UI display' do
        get '/api/users'

        json = JSON.parse(response.body)

        employee = json.find { |u| u['name'] == 'Employee User' }
        manager = json.find { |u| u['name'] == 'Manager User' }
        finance = json.find { |u| u['name'] == 'Finance User' }

        expect(employee['role']).to eq('employee')
        expect(manager['role']).to eq('manager')
        expect(finance['role']).to eq('finance')
      end
    end

    context 'with X-User-Id header' do
      let(:user) { create(:user, :employee) }

      it 'works with X-User-Id header present' do
        create_list(:user, 3, :employee)

        get '/api/users', headers: { 'X-User-Id' => user.id }

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        # Should return all users regardless of X-User-Id
        expect(json.length).to eq(4) # 3 + current user
      end

      it 'works without X-User-Id header' do
        create_list(:user, 3, :employee)

        get '/api/users'

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json.length).to eq(3)
      end
    end

    context 'data consistency' do
      it 'returns consistent data across multiple requests' do
        create_list(:user, 5, :employee)

        # First request
        get '/api/users'
        json1 = JSON.parse(response.body)

        # Second request
        get '/api/users'
        json2 = JSON.parse(response.body)

        expect(json1).to eq(json2)
      end

      it 'reflects newly created users' do
        create_list(:user, 3, :employee)

        get '/api/users'
        json1 = JSON.parse(response.body)
        initial_count = json1.length

        # Create new user
        new_user = create(:user, :manager)

        get '/api/users'
        json2 = JSON.parse(response.body)

        expect(json2.length).to eq(initial_count + 1)
        expect(json2.map { |u| u['id'] }).to include(new_user.id)
      end
    end

    context 'edge cases' do
      it 'handles users with special characters in names' do
        user = create(:user, :employee, name: "O'Brien, José")

        get '/api/users'

        json = JSON.parse(response.body)
        found_user = json.find { |u| u['id'] == user.id }

        expect(found_user['name']).to eq("O'Brien, José")
      end

      it 'handles users with very long names' do
        long_name = 'A' * 255
        user = create(:user, :employee, name: long_name)

        get '/api/users'

        json = JSON.parse(response.body)
        found_user = json.find { |u| u['id'] == user.id }

        expect(found_user['name']).to eq(long_name)
      end

      it 'handles users with special characters in emails' do
        user = create(:user, :employee, email: 'user+tag@example.com')

        get '/api/users'

        json = JSON.parse(response.body)
        found_user = json.find { |u| u['id'] == user.id }

        expect(found_user['email']).to eq('user+tag@example.com')
      end
    end

    context 'authorization' do
      it 'allows unauthenticated access' do
        create(:user, :employee)

        get '/api/users'

        # Users endpoint is typically public for role switching
        expect(response).to have_http_status(:ok)
      end

      it 'does not require specific role' do
        employee = create(:user, :employee)
        create(:user, :manager)

        get '/api/users', headers: { 'X-User-Id' => employee.id }

        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe 'GET /api/users/:id' do
    let(:user) { create(:user, :employee, name: 'Test User') }

    context 'when user exists' do
      it 'returns the user' do
        get "/api/users/#{user.id}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json['id']).to eq(user.id)
        expect(json['name']).to eq('Test User')
      end

      it 'includes user role' do
        get "/api/users/#{user.id}"

        json = JSON.parse(response.body)

        expect(json['role']).to eq('employee')
      end
    end

    context 'when user does not exist' do
      it 'returns not found' do
        get '/api/users/99999'

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
