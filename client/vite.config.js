import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'bring-mentor-beer-liability.trycloudflare.com',
      '.trycloudflare.com', // allow all subdomains
      'localhost'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true,
        secure: false,
        // The rest down here is logging
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Server Log:', req.method, req.url, '→', options.target + req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('UWU AN ERROR HAS OCCURED:', err);
          });
        }
      }
    }
  },
})