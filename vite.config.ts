import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    // Copy SEO files to dist folder
    {
      name: 'copy-seo-files',
      writeBundle() {
        const seoFiles = [
          'robots.txt',
          'sitemap.xml',
          'ads.txt',
          'app-ads.txt',
          'humans.txt',
          'google-verification.html'
        ];
        
        seoFiles.forEach(file => {
          const sourcePath = path.resolve(__dirname, 'client/public', file);
          const destPath = path.resolve(__dirname, 'dist/public', file);
          
          if (fs.existsSync(sourcePath)) {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            
            // Copy file
            fs.copyFileSync(sourcePath, destPath);
            console.log(`✅ Copied ${file} to dist/public/`);
          } else {
            console.warn(`⚠️ SEO file not found: ${file}`);
          }
        });
        
        // Copy .well-known directory
        const wellKnownSource = path.resolve(__dirname, 'client/public/.well-known');
        const wellKnownDest = path.resolve(__dirname, 'dist/public/.well-known');
        
        if (fs.existsSync(wellKnownSource)) {
          if (!fs.existsSync(wellKnownDest)) {
            fs.mkdirSync(wellKnownDest, { recursive: true });
          }
          
          const securityTxtSource = path.resolve(wellKnownSource, 'security.txt');
          const securityTxtDest = path.resolve(wellKnownDest, 'security.txt');
          
          if (fs.existsSync(securityTxtSource)) {
            fs.copyFileSync(securityTxtSource, securityTxtDest);
            console.log('✅ Copied .well-known/security.txt to dist/public/.well-known/');
          }
        }
      }
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, 'dist/public'),
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
    },
  },

  // Development server optimizations
  server: {
    hmr: {
      overlay: false // Since you're using runtime error overlay plugin
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-hook-form',
      '@tanstack/react-query'
    ]
  }
});