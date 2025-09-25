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
  },
})