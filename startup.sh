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

# Verify SSL certificates are present
echo "Checking SSL certificates..."
if [ -f "/app/certs/DigiCertGlobalRootG2.crt.pem" ]; then
    echo "✅ DigiCertGlobalRootG2.crt.pem found"
else
    echo "❌ DigiCertGlobalRootG2.crt.pem not found"
fi

if [ -f "/app/certs/DigiCertGlobalRootCA.crt" ]; then
    echo "✅ DigiCertGlobalRootCA.crt found"
else
    echo "❌ DigiCertGlobalRootCA.crt not found"
fi

if [ -f "/app/certs/Microsoft RSA Root Certificate Authority 2017.crt" ]; then
    echo "✅ Microsoft RSA Root Certificate Authority 2017.crt found"
else
    echo "❌ Microsoft RSA Root Certificate Authority 2017.crt not found"
fi

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL is set"
else
    echo "❌ DATABASE_URL is not set"
fi

# Start the application
echo "Starting application..."
node dist/index.js