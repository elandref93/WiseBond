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
    
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
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
          
          // Charts and data visualization
          'charts': ['chart.js', 'recharts'],
          
          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'zod-validation-error'],
          
          // Utilities and helpers
          'utils': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'tailwindcss-animate',
            'lodash.pick'
          ],
          
          // Routing and state management
          'app-core': ['wouter', '@tanstack/react-query'],
          
          // Icons and UI extras
          'ui-extras': ['lucide-react', 'react-icons', 'framer-motion', 'vaul'],
          
          // Large vendor libraries
          'vendor-large': ['axios', 'input-otp', 'cmdk']
        }
      }
    },
    
    // Additional optimizations
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 1000,
    
    // Enable source maps for production debugging (optional)
    sourcemap: process.env.NODE_ENV !== 'production'
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
    ],
    exclude: [
      '@replit/vite-plugin-cartographer'
    ]
  }
});
