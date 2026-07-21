import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// XMenú CR — SPA React + Vite, desplegada en Vercel.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { outDir: 'dist' },
})
