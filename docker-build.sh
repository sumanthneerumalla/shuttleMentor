#!/usr/bin/env bash
# Script to build Docker image with environment variables from .env file

# Exit on error
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  set -a
  source .env
  set +a
else
  echo "Warning: .env file not found, using .env.example instead..."
  set -a
  source .env.example
  set +a
fi

# Build the Docker image with build args from environment variables
echo "Building Docker image with environment variables..."
docker build -t shuttlementor:latest \
  --build-arg DATABASE_URL="${DATABASE_URL}" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}" \
  --build-arg CLERK_SECRET_KEY="${CLERK_SECRET_KEY}" \
  .

echo "Docker image built successfully!"
