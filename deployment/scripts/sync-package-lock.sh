#!/bin/bash

# Script to synchronize package-lock.json with package.json
# Useful when dependency updates are made to package.json

echo "Starting package-lock.json synchronization..."

# Backup the existing package-lock.json file
if [ -f package-lock.json ]; then
  echo "Backing up existing package-lock.json..."
  cp package-lock.json package-lock.json.bak
fi

# Remove the existing package-lock.json
echo "Removing existing package-lock.json..."
rm -f package-lock.json

# Run npm install to generate a fresh package-lock.json based on package.json
echo "Generating fresh package-lock.json..."
npm install --package-lock-only --no-audit

# Check if operation was successful
if [ $? -eq 0 ]; then
  echo "Successfully updated package-lock.json"
  echo "Removing backup file..."
  rm -f package-lock.json.bak
else
  echo "Error updating package-lock.json"
  echo "Restoring backup file..."
  if [ -f package-lock.json.bak ]; then
    mv package-lock.json.bak package-lock.json
  fi
fi

echo "Done!"