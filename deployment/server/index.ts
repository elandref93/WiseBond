// Only use Azure Key Vault for configuration
import { initializeSecretsFromKeyVault, listAvailableKeys } from './keyVault';

// We only need dotenv for non-secret configuration (e.g. SESSION_SECRET)
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

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
  
  // Run database migrations and test connection before starting server
  try {
    // Import and run the database migrations
    const { runMigrations } = await import('./migrate');
    const migrationsSuccessful = await runMigrations();
    
    if (!migrationsSuccessful) {
      console.error('WARNING: Database migrations were not completed successfully');
      console.log('Application will continue, but database operations may fail');
    }
    
    // Test database connection
    const { testDatabaseConnection } = await import('./db');
    await testDatabaseConnection();
  } catch (error) {
    console.error('Error setting up database:', error);
    console.log('Application will continue, but database operations may fail.');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the environment's PORT variable
  // Azure App Service (native Node.js) sets PORT automatically
  // For Replit development, we use port 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
