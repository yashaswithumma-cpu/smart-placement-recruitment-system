import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend always talks to the Spring Boot backend directly through CORS.
// Base URL is configurable through VITE_API_BASE_URL (see .env.example).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
