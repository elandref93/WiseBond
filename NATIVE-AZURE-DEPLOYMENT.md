# Native Node.js Deployment to Azure App Service

This guide covers deploying the WiseBond application directly to Azure App Service using native Node.js support (without Docker containers).

## Why Native Node.js Deployment?

- **Better Performance**: No container overhead, direct Node.js execution
- **Simpler Configuration**: Azure handles Node.js runtime automatically
- **Cost Effective**: More efficient resource usage than containers
- **Easier Scaling**: Native integration with Azure App Service auto-scaling
- **Simplified Debugging**: Direct access to logs and application files

## Prerequisites

- Azure subscription
- Azure CLI installed or Azure Cloud Shell access
- Git repository with your application code

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

The GitHub Actions workflow in `.github/workflows/main_wisebond.yml` is configured for native Node.js deployment:

```yaml
name: Deploy to Azure App Service (Native Node.js)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: WiseBond
  NODE_VERSION: '20.x'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run check
    
    - name: Build application
      run: npm run build
    
    - name: Remove dev dependencies and create deployment package
      run: |
        npm prune --production
        rm -rf .git node_modules/.cache coverage .nyc_output
        find . -name "*.test.js" -delete
        find . -name "*.spec.js" -delete
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v3
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        slot-name: 'production'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
```

**Required GitHub Secrets:**
- `AZURE_WEBAPP_PUBLISH_PROFILE` - Download from Azure Portal > App Service > Get publish profile

### Method 2: Azure CLI Deployment

```bash
# Create App Service Plan (Linux)
az appservice plan create \
  --name WiseBond-plan \
  --resource-group your-resource-group \
  --sku B1 \
  --is-linux

# Create Web App with Node.js 20
az webapp create \
  --resource-group your-resource-group \
  --plan WiseBond-plan \
  --name WiseBond \
  --runtime "NODE:20-lts"

# Configure startup command
az webapp config set \
  --resource-group your-resource-group \
  --name WiseBond \
  --startup-file "npm start"

# Deploy from local Git
az webapp deployment source config-local-git \
  --name WiseBond \
  --resource-group your-resource-group
```

### Method 3: ZIP Deployment

```bash
# Build locally
npm ci
npm run build

# Create deployment package
zip -r deploy.zip . -x "node_modules/*" ".git/*" "*.md"

# Deploy via Azure CLI
az webapp deployment source config-zip \
  --resource-group your-resource-group \
  --name WiseBond \
  --src deploy.zip
```

## Application Configuration

### Required Environment Variables

Set these in Azure App Service Configuration:

#### Database
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST` - Database hostname
- `PGPORT` - Database port (5432)
- `PGUSER` - Database username
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

#### External Services
- `MAILGUN_API_KEY` - Email service API key
- `MAILGUN_DOMAIN` - Email service domain
- `MAILGUN_FROM_EMAIL` - Default sender email
- `GOOGLE_MAPS_API_KEY` - Maps integration

#### Application
- `NODE_ENV=production`
- `WEBSITE_NODE_DEFAULT_VERSION=22.x`

### Azure CLI Configuration Example

```bash
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name WiseBond \
  --settings \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="22.x" \
    DATABASE_URL="your-connection-string" \
    MAILGUN_API_KEY="your-mailgun-key" \
    MAILGUN_DOMAIN="your-domain" \
    MAILGUN_FROM_EMAIL="noreply@your-domain.com" \
    GOOGLE_MAPS_API_KEY="your-maps-key"
```

## Application Startup

Azure App Service will automatically:
1. Detect Node.js application
2. Run `npm install` (production dependencies only)
3. Execute `npm start` command
4. Serve on assigned port (process.env.PORT)

Your current `package.json` is properly configured:
- `"start": "NODE_ENV=production node dist/index.js"`
- Build process creates optimized production bundle

## SSL and Security

Azure App Service provides:
- **Automatic HTTPS**: Free SSL certificate for *.azurewebsites.net
- **Custom Domain SSL**: Add your domain with Let's Encrypt or custom certificates
- **Security Headers**: Automatic security hardening
- **DDoS Protection**: Built-in protection

## Database Connection

For Azure PostgreSQL:
- **No SSL certificates needed**: Native Azure service integration
- **Private Link**: Secure private network connection
- **Managed Identity**: Optional Azure AD authentication

## Performance Optimization

### App Service Settings
```bash
# Enable compression
az webapp config set \
  --resource-group your-resource-group \
  --name WiseBond \
  --generic-configurations '{"compression": {"enabled": true}}'

# Configure scaling
az monitor autoscale create \
  --resource-group your-resource-group \
  --resource WiseBond \
  --resource-type Microsoft.Web/sites \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Monitoring and Logs

Access application logs:
```bash
# Enable logging
az webapp log config \
  --resource-group your-resource-group \
  --name WiseBond \
  --application-logging true \
  --level information

# Stream logs
az webapp log tail \
  --resource-group your-resource-group \
  --name WiseBond
```

## Migration from Docker

To switch from Docker to native deployment:

1. **Remove Docker files** (optional):
   - Dockerfile
   - .dockerignore
   - startup.sh

2. **Update GitHub Actions** to use Node.js deployment instead of container deployment

3. **Verify package.json scripts** are correct (already configured)

4. **Test build process**:
   ```bash
   npm ci
   npm run build
   npm start
   ```

## Troubleshooting

### Common Issues

**Build Failures:**
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Verify Node.js version compatibility
- Check build script outputs

**Runtime Errors:**
- Verify environment variables are set
- Check application logs in Azure Portal
- Ensure database connectivity

**Performance Issues:**
- Enable compression
- Configure appropriate App Service Plan size
- Implement caching strategies

## Advantages Over Docker

1. **Faster Cold Starts**: No container initialization
2. **Better Memory Usage**: Direct Node.js execution
3. **Simpler Deployment**: Standard Git/ZIP deployment
4. **Native Azure Integration**: Built-in monitoring and scaling
5. **Cost Optimization**: More efficient resource utilization

This native deployment approach is recommended for most Node.js applications on Azure App Service.