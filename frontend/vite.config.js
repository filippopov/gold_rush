import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses for Docker
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://nginx',
        changeOrigin: true,
      }
    }
  }
})
