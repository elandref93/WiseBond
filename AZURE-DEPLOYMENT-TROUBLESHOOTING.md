# Azure Web App Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### 1. Port Configuration Issues ✅ FIXED

**Problem**: Azure Web Apps expect your app to listen on the port defined in the `PORT` environment variable, not a hardcoded port.

**Solution**: The application has been updated to properly use `process.env.PORT`:

```typescript
// ✅ CORRECT - server/index.ts
const port = parseInt(process.env.PORT || "8080", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${port}`);
});
```

**What was fixed**:
- Removed conflicting port definition in `server/routes.ts`
- Ensured consistent port handling across the application
- Added Azure-specific logging and health checks

### 2. Cross-Env Dependency Issue ✅ FIXED

**Problem**: Azure Web App deployment fails with `sh: 1: cross-env: not found` because `cross-env` was installed as a devDependency, but Azure doesn't install devDependencies in production.

**Solution**: Moved `cross-env` from `devDependencies` to `dependencies` in `package.json`:

```json
// ✅ CORRECT - package.json
"dependencies": {
  "cross-env": "^7.0.3",
  // ... other production dependencies
}
```

**What was fixed**:
- Moved `cross-env` to `dependencies` so it's available in production
- Removed duplicate entry from `devDependencies`
- Ensured the `start` script works on Azure Web App

### 3. Environment Variable Configuration

**Required Environment Variables for Azure**:

```bash
# Core Configuration
NODE_ENV=production
PORT=8080  # Azure will set this automatically

# Database (if using PostgreSQL)
DATABASE_URL=your_postgres_connection_string

# Email Service
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=wisebond.co.za
MAILGUN_FROM_EMAIL=postmaster@wisebond.co.za

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key

# Session Management
SESSION_SECRET=your_session_secret
```

### 4. Build and Deployment Process

**Local Testing**:
```bash
# Test production build locally
npm run build:prod
npm run deploy:local
```

**Azure Deployment**:
```bash
# The GitHub Actions workflow handles this automatically
# Manual deployment if needed:
npm run build:prod
# Deploy the dist/ folder to Azure
```

### 5. Health Check Endpoint

The application now includes a comprehensive health check endpoint at `/health` that provides:

- Application status
- Environment information
- Service configuration status
- Azure-specific information (when running on Azure)

**Test the health endpoint**:
```bash
curl https://your-app-name.azurewebsites.net/health
```

### 6. Common Error Messages and Solutions

#### "Application Error" or "500 Internal Server Error"

**Check**:
1. Application logs in Azure Portal
2. Environment variables are properly configured
3. Database connection (if using external database)

**Solution**:
```bash
# Check logs in Azure Portal:
# App Service > Logs > Log stream
```

#### "502 Bad Gateway" or "503 Service Unavailable"

**Check**:
1. Application is listening on the correct port
2. Health check endpoint is responding
3. Application startup is successful

**Solution**:
- Verify the application starts successfully locally
- Check that all required environment variables are set
- Ensure the build process completes without errors

#### "Application Failed to Start"

**Check**:
1. Node.js version compatibility (requires Node.js 22+)
2. Build process errors
3. Missing dependencies

**Solution**:
```bash
# Verify Node.js version
node --version  # Should be 22.x.x

# Test build locally
npm run build:prod
```

### 7. Azure Web App Configuration

**Required Settings in Azure Portal**:

1. **General Settings**:
   - Stack: Node.js
   - Major Version: 22.x
   - Minor Version: Latest

2. **Configuration > Application Settings**:
   - Add all required environment variables
   - Ensure `NODE_ENV=production`

3. **Configuration > General Settings**:
   - Startup Command: `node dist/index.js`

### 8. Monitoring and Debugging

**Azure Portal Monitoring**:
1. **Logs > Log stream** - Real-time application logs
2. **Logs > Application logs** - Detailed error logs
3. **Metrics** - Performance and resource usage

**Health Check Monitoring**:
```bash
# Monitor application health
curl -f https://your-app-name.azurewebsites.net/health
```

### 9. Performance Optimization

**For Production**:
1. Enable compression in `web.config`
2. Use CDN for static assets
3. Configure proper caching headers
4. Monitor memory usage and scale if needed

### 10. Security Considerations

**Required Security Headers** (already configured in `web.config`):
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy

**Environment Variables**:
- Never commit API keys to version control
- Use Azure Key Vault for sensitive configuration
- Rotate API keys regularly

### 11. Troubleshooting Checklist

Before deploying to Azure:

- [ ] Application runs locally with `npm run build:prod && npm run deploy:local`
- [ ] All environment variables are configured
- [ ] Health endpoint responds correctly
- [ ] Database connection works (if applicable)
- [ ] Email service is configured
- [ ] Google Maps API key is valid
- [ ] OpenRouter API key is valid
- [ ] Node.js version is 22.x
- [ ] Build process completes without errors

### 12. Emergency Rollback

If deployment fails:

1. **Revert to previous deployment**:
   - Use Azure Portal to revert to previous slot
   - Or redeploy previous working version

2. **Check logs immediately**:
   - Review application logs
   - Check build logs
   - Verify environment variables

3. **Test locally first**:
   - Always test changes locally before deploying
   - Use `npm run deploy:local` to simulate production

## Support

If you continue to experience issues:

1. Check the application logs in Azure Portal
2. Verify all environment variables are set correctly
3. Test the application locally with production settings
4. Review the health endpoint response for configuration issues

The application is now properly configured for Azure Web App deployment with correct port handling and comprehensive monitoring capabilities. 