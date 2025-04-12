#!/bin/bash

# Prepare Deployment Script (Bash version)
# This script runs the JavaScript deployment preparation script
# and can be run directly from the command line

echo "Starting deployment preparation..."
node scripts/prepare-deployment.js

# Additional steps can be added here as needed
# For example, you could add steps to install production dependencies in the deployment folder:
# echo "Installing production dependencies..."
# cd deployment
# npm install --production

echo "Deployment preparation completed!"