// Only use Azure Key Vault for configuration
import { initializeSecretsFromKeyVault, listAvailableKeys } from './keyVault';

// We only need dotenv for non-secret configuration (e.g. SESSION_SECRET)
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./staticServer";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Prioritize environment variables (Replit secrets) over Azure Key Vault
  // Log available environment variables for debugging (without revealing values)
  const envVars = [
    'MAILGUN_API_KEY', 
    'MAILGUN_DOMAIN', 
    'MAILGUN_FROM_EMAIL',
    'GOOGLE_MAPS_API_KEY',
    'DATABASE_URL'
  ];
  
  console.log('Available environment variables:');
  envVars.forEach(varName => {
    console.log(`- ${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
  });
  
  // Ensure Google Maps API Key is copied to VITE_ version for frontend access
  if (process.env.GOOGLE_MAPS_API_KEY && !process.env.VITE_GOOGLE_MAPS_API_KEY) {
    process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    console.log('Copied GOOGLE_MAPS_API_KEY to VITE_GOOGLE_MAPS_API_KEY for frontend access');
  }
  
  // Only try Azure Key Vault if environment variables are not available
  const missingEnvVars = envVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.log(`Missing environment variables: ${missingEnvVars.join(', ')}. Trying Azure Key Vault...`);
    
    try {
      // Try to load secrets from Azure Key Vault
      console.log('Attempting to load secrets from Azure Key Vault...');
      await initializeSecretsFromKeyVault();
      
      // List available keys for debugging
      const availableKeys = await listAvailableKeys();
      console.log('Available keys in Azure Key Vault:', availableKeys);
    } catch (error) {
      console.error('Error initializing Azure Key Vault:', error);
      console.log('Failed to load Azure Key Vault secrets. Some functionality may be limited.');
    }
  } else {
    console.log('All required environment variables are set. Skipping Azure Key Vault.');
  }
  
  // Test database connection with timeout, then run migrations if successful
  try {
    const { testDatabaseConnection } = await import('./db-simple');
    
    // Test database connection with a shorter timeout
    const connectionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 8000)
    );
    
    const connectionTest = testDatabaseConnection();
    const isConnected = await Promise.race([connectionTest, connectionTimeout])
      .then(() => true)
      .catch((error) => {
        console.log('Database connection failed:', error.message);
        console.log('Continuing with in-memory storage for development');
        return false;
      });
    
    if (isConnected) {
      console.log('Database connected successfully, running migrations...');
      const { runMigrations } = await import('./migrate');
      await runMigrations();
    }
  } catch (error) {
    console.log('Database setup skipped due to connection issues');
    console.log('Application will use in-memory storage');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  console.log("ENV:", process.env.NODE_ENV);
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app); // ✅ Runs in Azure
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(app, server); // Only in local dev
  }

  // Server is already started by registerRoutes function
  // No need to call listen again
})();
