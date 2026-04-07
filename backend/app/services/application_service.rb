# frozen_string_literal: true

##
# Base class for all service objects in the application.
#
# Service objects encapsulate business logic that doesn't belong in models
# or controllers. They follow the Single Responsibility Principle and provide
# a clean interface for complex operations.
#
# @example Basic usage
#   class MyService < ApplicationService
#     def initialize(param)
#       @param = param
#     end
#
#     def call
#       # Perform operation
#       success(result_data)
#     end
#   end
#
#   result = MyService.call(param)
#   if result.success?
#     puts result.data
#   else
#     puts result.error
#   end
#
class ApplicationService
  ##
  # Result object returned by service operations.
  # Provides a consistent interface for success/failure responses.
  #
  # @attr_reader [Object] data The result data (on success)
  # @attr_reader [String] error The error message (on failure)
  # @attr_reader [Boolean] success Whether the operation succeeded
  #
  class Result
    attr_reader :data, :error

    ##
    # Creates a new Result instance
    #
    # @param success [Boolean] Whether the operation was successful
    # @param data [Object] The result data
    # @param error [String, nil] Error message if operation failed
    #
    def initialize(success:, data: nil, error: nil)
      @success = success
      @data = data
      @error = error
    end

    ##
    # @return [Boolean] true if the operation succeeded
    #
    def success?
      @success
    end

    ##
    # @return [Boolean] true if the operation failed
    #
    def failure?
      !@success
    end
  end

  ##
  # Class-level call method for convenient invocation.
  # Creates a new instance and calls it.
  #
  # @param args [Array] Arguments passed to initialize
  # @param kwargs [Hash] Keyword arguments passed to initialize
  # @return [Result] The result of the service operation
  #
  def self.call(...)
    new(...).call
  end

  ##
  # Instance-level call method. Must be implemented by subclasses.
  #
  # @abstract Subclass must implement this method
  # @return [Result] The result of the operation
  #
  def call
    raise NotImplementedError, "#{self.class} must implement #call"
  end

  private

  ##
  # Creates a successful result
  #
  # @param data [Object] The result data
  # @return [Result] A successful result object
  #
  def success(data = nil)
    Result.new(success: true, data: data)
  end

  ##
  # Creates a failure result
  #
  # @param error [String] The error message
  # @return [Result] A failed result object
  #
  def failure(error)
    Result.new(success: false, error: error)
  end
end
