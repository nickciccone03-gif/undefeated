import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/undefeated/
  base: '/undefeated/',
  // Honor a harness-assigned port (autoPort) when present.
  server: { port: Number(process.env.PORT) || 5173 },
})
