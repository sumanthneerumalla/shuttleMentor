#!/usr/bin/env bash
# Script to run Prisma migrations and build Docker image

# Exit on error
set -e

echo "===== Starting database and running migrations ====="

# Start the database if it's not already running
./start-database.sh

# Generate a new Prisma migration
echo "Generating Prisma migration..."
npx prisma migrate dev --name add_displayusername_to_coaches

# Build the Docker image
echo "===== Building Docker image ====="
./docker-build.sh

echo "===== Process completed successfully ====="
