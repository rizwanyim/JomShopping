import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Kita naikkan limit warning ni ke 1600kb (1.6MB) supaya dia diam
    chunkSizeWarningLimit: 1600,
  },
})
