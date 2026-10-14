import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inside Docker the backend is reachable as http://backend:4000 (see .env.dev.example)
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    // Bind mounts on Windows don't pass file events into containers
    watch: process.env.CHOKIDAR_USEPOLLING === 'true'
      ? { usePolling: true, interval: 300 }
      : undefined,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
