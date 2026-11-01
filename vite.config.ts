import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
  server: {
    // Dual-stack listen so Chrome localhost (::1) works, not only 127.0.0.1
    host: true,
    port: 5180,
    strictPort: true,
  },
})
