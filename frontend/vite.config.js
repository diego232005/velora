import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    // Túneles públicos — sin esto Vite bloquea el Host header
    allowedHosts: ['.tunnelmole.net', '.ngrok-free.app', '.ngrok.io', 'localhost'],
    // HMR en localhost (no forzar wss al túnel: Tunnelmole suele romper el websocket)
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
    },
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
