#!/bin/bash

# Script to update specific outdated packages
# This focuses on the packages identified as either outdated or with version mismatches

echo "Updating outdated packages..."

# Update the specific problematic packages
echo "Installing lodash.pick@4.4.0..."
npm install --save lodash.pick@4.4.0

echo "Installing drizzle-kit@0.30.4..."
npm install --save-dev drizzle-kit@0.30.4

echo "Installing html-pdf-node@1.0.8..."
npm install --save html-pdf-node@1.0.8

echo "Installing vite@5.4.17..."
npm install --save-dev vite@5.4.17

# Sync the package-lock.json file
echo "Syncing package-lock.json..."
./scripts/sync-package-lock.sh

echo "Done updating packages!"