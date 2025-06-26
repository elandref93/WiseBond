import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
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
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
<<<<<<< HEAD

=======
    
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
    // Optimize bundle splitting to fix 566KB chunk warning
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
<<<<<<< HEAD

=======
          
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
          // Radix UI components (your largest dependency group)
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
<<<<<<< HEAD

          // Charts and data visualization (split for better loading)
          'chart-js': ['chart.js'],
          'recharts': ['recharts'],

          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'zod-validation-error'],

=======
          
          // Charts and data visualization (split for better loading)
          'chart-js': ['chart.js'],
          'recharts': ['recharts'],
          
          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'zod-validation-error'],
          
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
          // Utilities and helpers
          'utils': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'tailwindcss-animate',
            'lodash.pick'
          ],
<<<<<<< HEAD

=======
          
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
          // Large vendor libraries
          'vendor-large': ['axios', 'framer-motion', '@tanstack/react-query']
        }
      }
    },
<<<<<<< HEAD

    // Performance optimizations (using esbuild - faster than terser)
    target: 'es2020',
    minify: true,

=======
    
    // Performance optimizations (using esbuild - faster than terser)
    target: 'es2020',
    minify: true,
    
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
    // Remove console logs in production
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
<<<<<<< HEAD

    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
  },

=======
    
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
  },
  
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
  // Development server optimizations
  server: {
    hmr: {
      overlay: false // Since you're using runtime error overlay plugin
    }
  },
<<<<<<< HEAD

=======
  
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-hook-form',
      '@tanstack/react-query'
    ]
  }
<<<<<<< HEAD
});
=======
});
>>>>>>> fb576460ac4c191b22eee23c2b797d997cecfb99
