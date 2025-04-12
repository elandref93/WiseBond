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

- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `MAILGUN_FROM_EMAIL`
- `GOOGLE_MAPS_API_KEY`
- Any other secrets required by your application

You can set these using the Azure Portal or the following Azure CLI command:
```
az webapp config appsettings set --resource-group <resource-group-name> --name WiseBond --settings MAILGUN_API_KEY="your-key" MAILGUN_DOMAIN="your-domain" MAILGUN_FROM_EMAIL="your-email" GOOGLE_MAPS_API_KEY="your-key"
```

## Troubleshooting

### Container Startup Issues

If you encounter container startup issues:

1. Check the application logs in the Azure Portal
2. Ensure the `PORT` environment variable is being used (as configured in server/index.ts)
3. Verify all required environment variables are set
4. Check if the database connection is properly configured

### Authentication Issues

If GitHub Actions deployment fails with authentication issues:

1. Check that the federated credential is properly set up in Azure AD
2. Verify the client ID, tenant ID, and subscription ID are correct
3. Ensure the service principal has the necessary permissions to deploy to App Service