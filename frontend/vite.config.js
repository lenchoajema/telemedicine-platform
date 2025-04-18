import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  esbuild: {
    jsx: 'automatic'
  },
  // Add build configuration for Netlify
  build: {
    outDir: 'dist',
    // Generate a _redirects file for SPA routing
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  }
})