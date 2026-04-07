# syntax=docker/dockerfile:1
FROM ruby:3.2.0-slim

# Install dependencies
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    libpq-dev \
    libyaml-dev \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install bundler
RUN gem install bundler -v 2.5.0 --no-document

# Copy Gemfile and install dependencies
COPY Gemfile ./
RUN bundle lock --add-platform x86_64-linux
RUN bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Precompile bootsnap
RUN bundle exec bootsnap precompile --gemfile app/ lib/

# Make entrypoint executable
RUN chmod +x bin/docker-entrypoint

# Expose port
EXPOSE 3000

# Run migrations and start server - v3 force rebuild
CMD ["./bin/docker-entrypoint", "bundle", "exec", "puma", "-C", "config/puma.rb"]
