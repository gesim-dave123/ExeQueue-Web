import tailwindcss from '@tailwindcss/vite'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],

  //Uncomment this server part, if you want to test locally on multiple devices
  // server: {
  //   host: '0.0.0.0', // Listen on all network interfaces
  //   port: 5173, // Optional: specify a port
  // }
})
