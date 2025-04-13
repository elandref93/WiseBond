#!/bin/sh

# Set environment variables if needed
export NODE_ENV=production

# Ensure the certs directory exists
mkdir -p /app/certs

# Log startup information
echo "Starting WiseBond application..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Environment: $NODE_ENV"
echo "Port: $PORT"

# Start the application
node dist/index.js