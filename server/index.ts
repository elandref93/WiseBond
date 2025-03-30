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
  try {
    // Try to load secrets from Azure Key Vault
    console.log('Attempting to load secrets from Azure Key Vault...');
    await initializeSecretsFromKeyVault();
    
    // List available keys for debugging
    const availableKeys = await listAvailableKeys();
    console.log('Available keys in Azure Key Vault:', availableKeys);
  } catch (error) {
    console.error('Error initializing Azure Key Vault:', error);
    console.log('Continuing with environment variables from Replit secrets...');
    
    // Log available environment variables for debugging (without revealing values)
    const envVars = [
      'MAILGUN_API_KEY', 
      'MAILGUN_DOMAIN', 
      'MAILGUN_FROM_EMAIL',
      'GOOGLE_MAPS_API_KEY'
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
