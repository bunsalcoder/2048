import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        // Don't bundle JS files, just copy them
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  // Environment variables are automatically loaded from .env file
  // Vite will expose VITE_* variables to import.meta.env
}) 