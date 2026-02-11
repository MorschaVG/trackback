import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/discogs": {
        target: "https://api.discogs.com",
        changeOrigin: true,
        secure: true,
        // Discogs requires a User-Agent; browsers cannot set it directly.
        headers: {
          "User-Agent": "TrackbackDev/1.0 (+http://localhost)",
        },
        rewrite: (path) => path.replace(/^\/discogs/, ""),
      },
    },
  },
})
