import express, { type Request, Response, NextFunction } from "express";
import { serveStatic, log } from "./staticServer";
import { getPostgresClient } from "./db";
import { initializeSecretsFromKeyVault, listAvailableKeys } from './keyVault';
import { validateAllServices } from './serviceValidator';
import { migrate } from './migrate';
import { registerRoutes } from "./routes.js";

// Load environment variables from .env.local for local development
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createServer } from "http";

// Load environment variables FIRST before any service initialization
console.log('🔧 Loading environment from:', path.join(process.cwd(), '.env.local'));
console.log('📁 File exists:', fs.existsSync(path.join(process.cwd(), '.env.local')));

// Load .env.local if it exists (for both development and production)
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  console.log('✅ Environment variables loaded successfully');
} else {
  console.log('⚠️ No .env.local file found, using system environment variables');
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
  // Log available environment variables for debugging (without revealing values)
  const envVars = [
    'MAILGUN_API_KEY', 
    'MAILGUN_DOMAIN', 
    'MAILGUN_FROM_EMAIL',
    'GOOGLE_MAPS_API_KEY',
    'OPENROUTER_API_KEY',
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
  
  // Try to load secrets from Azure Key Vault (only in cloud environments)
  try {
    await initializeSecretsFromKeyVault();
    
    // List available keys for debugging (only in cloud environments)
    const availableKeys = await listAvailableKeys();
    if (availableKeys.length > 0) {
      console.log('Available keys in Azure Key Vault:', availableKeys);
    }
  } catch (error) {
    console.error('Error initializing Azure Key Vault:', error);
    console.log('Failed to load Azure Key Vault secrets. Some functionality may be limited.');
  }

  // Validate all service configurations AFTER environment variables are loaded
  try {
    await validateAllServices();
  } catch (error) {
    console.error('Error validating services:', error);
  }

  // Initialize Azure database with three-tier authentication strategy
  try {    
    // Setup database using three-tier strategy (Tier 1 → Tier 2 → Tier 3)
    await getPostgresClient();
    console.log('✅ Database connected successfully, running migrations...');
    // Only run migrations in development or if explicitly requested
    if (process.env.NODE_ENV !== 'production' || process.env.RUN_MIGRATIONS === 'true') {
      await migrate();
    } else {
      console.log('🚀 Production mode - skipping database migrations');
    }
    
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
  const server = createServer(app);

  // Setup frontend serving AFTER API routes but BEFORE server starts
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // In development, try to use Vite if available, otherwise fall back to static files
    try {
      // Dynamic import to avoid bundling issues
      const viteModule = await import('./vite.js');
      await viteModule.setupVite(app, server);
    } catch (error) {
      console.log('⚠️ Vite development server not available, using static files');
      serveStatic(app);
    }
  }

  // Start the server after all middleware is configured  
  const port = parseInt(process.env.PORT || "8080", 10);
  
  console.log(`🚀 Starting server on port ${port}...`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log(`🔧 PORT environment variable: ${process.env.PORT || 'Not set (using default 8080)'}`);
  console.log(`📦 Build Version: ${process.env.BUILD_VERSION || 'unknown'}`);
  console.log(`🕐 Build Time: ${process.env.BUILD_TIME || 'unknown'}`);
  console.log(`🔧 Postgres Fix: Applied`);
  console.log(`📦 NPM Version: 11.5.1 (upgraded)`);
  
  // Azure Web App specific logging
  if (process.env.WEBSITE_SITE_NAME) {
    console.log(`☁️ Running on Azure Web App: ${process.env.WEBSITE_SITE_NAME}`);
    console.log(`🔗 Instance ID: ${process.env.WEBSITE_INSTANCE_ID || 'Unknown'}`);
  }
  
  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
    console.log(`🌐 Access your application at: http://localhost:${port}`);
    
    // Log important startup information
    console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`📧 Email: ${process.env.MAILGUN_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🗺️ Maps: ${process.env.GOOGLE_MAPS_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🤖 OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured'}`);
    
      // Azure Web App health check endpoint
  if (process.env.WEBSITE_SITE_NAME) {
    console.log(`🏥 Health check available at: http://localhost:${port}/health`);
  }
  
  // Build info endpoint
  app.get('/api/build-info', (req, res) => {
    res.json({
      version: process.env.BUILD_VERSION || 'unknown',
      buildTime: process.env.BUILD_TIME || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      postgresFix: 'applied',
      npmVersion: '11.5.1',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  });
  });

  // Handle server errors
  server.on('error', (error: any) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please use a different port.`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
})();
