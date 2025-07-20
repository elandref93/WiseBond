import express, { type Request, Response, NextFunction } from "express";
import { serveStatic, log } from "./staticServer";
import { getPostgresClient } from "./db";

// Load environment variables from .env.local for local development
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve('.env.local');
console.log('🔧 Loading environment from:', envPath);
console.log('📁 File exists:', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
} else {
  console.log('✅ Environment variables loaded successfully');
}

const app = express();

// Redirect wisebond.co.za to www.wisebond.co.za
app.use((req, res, next) => {
  if (req.hostname === 'wisebond.co.za') {
    return res.redirect(301, 'https://www.wisebond.co.za' + req.originalUrl);
  }
  next();
});

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
      const { initializeSecretsFromKeyVault, listAvailableKeys } = await import('./keyVault');
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

  // Initialize Azure database with three-tier authentication strategy
  try {    

    // Setup database using three-tier strategy (Tier 1 → Tier 2 → Tier 3)
    await getPostgresClient();
    console.log('✅ Database connected successfully, running migrations...');
    const { runMigrations } = await import('./migrate');
    await runMigrations();
    
  } catch (error: any) {
    console.error('❌ CRITICAL: Database setup failed:', error.message);
    console.error('All three authentication tiers failed.');
    console.error('Application cannot continue without database connection.');
    process.exit(1);
  }
  
  // Set development environment if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }
  
  console.log("ENV:", process.env.NODE_ENV);
  
  // Import registerRoutes function
  const { registerRoutes } = await import("./routes.js");
  
  // Register API routes without starting server
  await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Create HTTP server
  const { createServer } = await import("http");
  const server = createServer(app);

  // Setup frontend serving AFTER API routes but BEFORE server starts
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }

  // Start the server after all middleware is configured  
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on https://0.0.0.0:${port}`);
  });

  // Server is already started by registerRoutes function
  // No need to call listen again
})();
