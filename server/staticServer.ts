import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Look for built files in dist/public (where Vite builds them)
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");

  console.log(`📁 Checking for build directory: ${distPath}`);
  console.log(`📄 Checking for index.html: ${indexPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(`❌ Build directory not found: ${distPath}`);
    console.error('💡 Make sure to run: npm run build');
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ index.html not found: ${indexPath}`);
    console.error('💡 Make sure the build completed successfully');
    throw new Error(
      `Could not find index.html: ${indexPath}, make sure the build completed successfully`,
    );
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  console.log(`✅ index.html found at: ${indexPath}`);

  // Serve static files
  app.use(express.static(distPath));

  // Serve robots.txt, sitemap.xml, and other SEO files
  app.get('/robots.txt', (req, res) => {
    res.sendFile(path.resolve(distPath, "robots.txt"));
  });

  app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.resolve(distPath, "sitemap.xml"));
  });

  app.get('/ads.txt', (req, res) => {
    res.sendFile(path.resolve(distPath, "ads.txt"));
  });

  app.get('/humans.txt', (req, res) => {
    res.sendFile(path.resolve(distPath, "humans.txt"));
  });

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (req, res) => {
    console.log(`🔄 SPA fallback for: ${req.originalUrl}`);
    res.sendFile(indexPath);
  });
} 