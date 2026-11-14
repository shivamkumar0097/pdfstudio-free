import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) return 'pdfjs'
          if (id.includes('node_modules/pdf-lib')) return 'pdf-lib'
          if (id.includes('node_modules/jszip')) return 'jszip'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
