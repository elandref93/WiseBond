#!/bin/bash
# This script is used for starting the application in Azure App Service

# Set NODE_ENV if not already set
export NODE_ENV=${NODE_ENV:-production}

# Log startup information
echo "Starting application with NODE_ENV=$NODE_ENV"
echo "Using PORT=$PORT"

# Execute the application
node dist/index.js