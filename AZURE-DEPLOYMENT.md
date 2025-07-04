# Azure App Service Deployment Guide

This document provides instructions for deploying the WiseBond application to Azure App Service using container deployment.

## Prerequisites

- Azure subscription
- Azure CLI installed locally or Azure Cloud Shell access
- Git repository with your application code

## Deployment Files

The following files have been created to facilitate deployment:

1. **Dockerfile** - Defines how to build the container image
2. **startup.sh** - Script to start the application with proper environment settings
3. **.dockerignore** - Excludes unnecessary files from the container
4. **GitHub Actions workflow** - Automates the build and deployment process

## Deployment Options

### Option 1: Using GitHub Actions (Recommended)

The GitHub Actions workflow in `.github/workflows/main_wisebond.yml` will automatically build and deploy your application when you push to the main branch.

Ensure your GitHub repository has the following secrets configured:
- `AZUREAPPSERVICE_CLIENTID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Option 2: Manual Deployment

1. Build the Docker image locally:
   ```
   docker build -t wisebond .
   ```

2. Tag the image with your Azure Container Registry (ACR) details:
   ```
   docker tag wisebond <your-acr-name>.azurecr.io/wisebond
   ```

3. Push the image to ACR:
   ```
   az acr login --name <your-acr-name>
   docker push <your-acr-name>.azurecr.io/wisebond
   ```

4. Create or update your App Service to use the container image:
   ```
   az webapp create --resource-group <resource-group-name> --plan <app-service-plan-name> --name WiseBond --deployment-container-image-name <your-acr-name>.azurecr.io/wisebond
   ```

## Environment Variables

Ensure the following environment variables are configured in your Azure App Service:

### External API Keys

- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- `GOOGLE_MAPS_API_KEY`

### Database Configuration

- `DATABASE_URL` - Complete PostgreSQL connection string
- `PGHOST` - PostgreSQL server hostname
- `PGPORT` - PostgreSQL server port (typically 5432)
- `PGUSER` - PostgreSQL username
- `PGPASSWORD` - PostgreSQL password
- `PGDATABASE` - PostgreSQL database name

### Environment Configuration

- `NODE_ENV` - Set to `production` for production deployment

You can set these using the Azure Portal or the following Azure CLI command:
```
az webapp config appsettings set --resource-group <resource-group-name> --name WiseBond --settings NODE_ENV="production" MAILGUN_API_KEY="your-key" MAILGUN_DOMAIN="your-domain" MAILGUN_FROM_EMAIL="your-email" GOOGLE_MAPS_API_KEY="your-key" DATABASE_URL="your-connection-string" PGHOST="your-db-host" PGPORT="5432" PGUSER="your-db-user" PGPASSWORD="your-db-password" PGDATABASE="your-db-name"
```

## Development vs. Production Environments

The application is designed to work differently in development and production environments:

### Development Environment

In development mode (when `NODE_ENV` is not set to `production`):

1. The application uses in-memory storage regardless of database configuration
2. Database connection tests are skipped to avoid errors
3. Data will not persist between application restarts
4. Perfect for local development and testing without database configuration

### Production Environment

In production mode (when `NODE_ENV` is set to `production`):

1. The application connects to the configured PostgreSQL database
2. Database connection is tested during startup
3. All database operations use the real database
4. SSL certificates are used for secure database connections
5. Application will log critical errors if database connection fails

## Troubleshooting

### Container Startup Issues

If you encounter container startup issues:

1. Check the application logs in the Azure Portal
2. Ensure the `PORT` environment variable is being used (as configured in server/index.ts)
3. Verify all required environment variables are set
4. Check if the database connection is properly configured

### Database Connection Issues

For PostgreSQL connection problems:

1. Verify that the App Service and PostgreSQL server are in the same Virtual Network
2. Check that the Private Link configuration is correct in Azure PostgreSQL
3. Ensure the SSL certificates are correctly included in the deployment
4. Confirm all database environment variables are properly set
5. Check the `/app/certs` directory in the container to ensure certificates are present
6. Verify that `NODE_ENV` is set to `production` - otherwise the app will use in-memory storage
7. See the detailed `AZURE-DATABASE.md` document for more information

### Environment Configuration Issues

If you're experiencing issues with the application environment:

1. For production deployments, ensure `NODE_ENV` is set to `production`
2. For local development, you can leave `NODE_ENV` unset to use in-memory storage
3. Check server logs for messages about which storage implementation is being used
4. Verify the database environment variables if you're not seeing database operations work as expected

### Authentication Issues

If GitHub Actions deployment fails with authentication issues:

1. Check that the federated credential is properly set up in Azure AD
2. Verify the client ID, tenant ID, and subscription ID are correct
3. Ensure the service principal has the necessary permissions to deploy to App Service

## SSL Certificates

The application includes the following SSL certificates for secure database connectivity:

- `DigiCertGlobalRootG2.crt.pem`
- `DigiCertGlobalRootCA.crt`
- `Microsoft RSA Root Certificate Authority 2017.crt`

These certificates are required for establishing secure connections to Azure PostgreSQL with Private Link enabled.