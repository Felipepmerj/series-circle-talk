import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react-image-crop']
  },
  optimizeDeps: {
    include: ['react-image-crop']
  },
  build: {
    rollupOptions: {
      external: ['react-image-crop'],
      output: {
        globals: {
          'react-image-crop': 'ReactCrop'
        }
      }
    }
  }
}));
