import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Lokal dev da /api/sheets → Apps Script ga yo'naltirish
      '/api/sheets': {
        target: 'https://script.google.com',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL('http://localhost' + path)
          const params = url.searchParams
          const scriptPath = process.env.VITE_APPS_SCRIPT_URL
            ? new URL(process.env.VITE_APPS_SCRIPT_URL).pathname
            : '/macros/s/SCRIPT_ID/exec'
          return scriptPath + '?' + params.toString()
        }
      }
    }
  }
})
