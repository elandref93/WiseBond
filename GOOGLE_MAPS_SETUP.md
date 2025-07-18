# Google Maps API Setup Guide

## 🗺️ **Overview**
This guide helps you set up Google Maps API for address autocomplete functionality in both local development and production environments.

## 🔑 **Getting a Google Maps API Key**

### 1. **Create a Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing (required for API usage)

### 2. **Enable Required APIs**
Enable these APIs in your Google Cloud Console:
- **Maps JavaScript API**
- **Places API**
- **Geocoding API**

### 3. **Create API Key**
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key (starts with `AIza`)

## 🌍 **Environment Configuration**

### **Local Development (.env.local)**
```bash
# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyYourActualAPIKeyHere
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourActualAPIKeyHere
```

### **Production Environment**
Set these environment variables in your production hosting platform:

#### **Azure App Service**
```bash
GOOGLE_MAPS_API_KEY=AIzaSyYourActualAPIKeyHere
VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourActualAPIKeyHere
```

#### **Replit**
Add to Secrets:
- `GOOGLE_MAPS_API_KEY`: `AIzaSyYourActualAPIKeyHere`
- `VITE_GOOGLE_MAPS_API_KEY`: `AIzaSyYourActualAPIKeyHere`

## 🔒 **Security Configuration**

### **API Key Restrictions (Recommended)**
1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Set up restrictions:

#### **Application Restrictions**
- **HTTP referrers (web sites)**: Add your domains
  - `localhost:5000/*` (for local development)
  - `*.wisebond.co.za/*` (for production)
  - `*.replit.app/*` (if using Replit)
  - `*.azurewebsites.net/*` (if using Azure)

#### **API Restrictions**
- **Restrict key**: Select these APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API

## 🚀 **Testing the Setup**

### **Local Development**
1. Start the development server: `npm run dev`
2. Go to a page with address input (e.g., loan application)
3. Type in the address field - you should see autocomplete suggestions

### **Production**
1. Deploy with the environment variables set
2. Test address autocomplete on the live site
3. Check browser console for any errors

## 🔧 **Troubleshooting**

### **"Google Maps Unavailable" Error**
**Symptoms**: Address input shows "Address search is temporarily unavailable"

**Solutions**:
1. **Check API Key**: Ensure `VITE_GOOGLE_MAPS_API_KEY` is set correctly
2. **Verify API Enablement**: Make sure Maps JavaScript API and Places API are enabled
3. **Check Billing**: Ensure billing is enabled on your Google Cloud project
4. **Domain Restrictions**: Verify your domain is allowed in API key restrictions
5. **Quota Limits**: Check if you've exceeded API usage limits

### **"Fails to Fetch" Login Error**
**Symptoms**: Login form shows "fails to fetch" error

**Solutions**:
1. **Check Server**: Ensure the development server is running (`npm run dev`)
2. **Environment Variables**: Verify `.env.local` file exists with correct API keys
3. **CORS Issues**: Check browser console for CORS errors
4. **Network**: Ensure you can access `localhost:5000`

### **Common Error Messages**

#### **"Google Maps API key not found"**
- Set `VITE_GOOGLE_MAPS_API_KEY` in your environment
- Restart the development server after adding the key

#### **"This API project is not authorized"**
- Enable the required APIs in Google Cloud Console
- Check billing status

#### **"Request denied due to invalid API key"**
- Verify the API key is correct
- Check API key restrictions
- Ensure the key starts with `AIza`

## 📊 **Monitoring Usage**

### **Google Cloud Console**
1. Go to **APIs & Services** > **Dashboard**
2. Monitor API usage and quotas
3. Set up alerts for quota limits

### **Cost Optimization**
- Google Maps API has a generous free tier
- Monitor usage to avoid unexpected charges
- Consider implementing usage limits

## 🔄 **Fallback Behavior**

If Google Maps API fails to load, the application will:
1. Show a user-friendly error message
2. Fall back to manual address input
3. Allow users to enter addresses manually
4. Continue with normal functionality

## 📝 **Best Practices**

1. **Never commit API keys** to version control
2. **Use environment variables** for all API keys
3. **Set up proper restrictions** on API keys
4. **Monitor usage** regularly
5. **Have fallback functionality** for when API is unavailable
6. **Test thoroughly** in both development and production

## 🆘 **Getting Help**

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple Google Maps implementation
4. Contact Google Cloud support if API issues persist 