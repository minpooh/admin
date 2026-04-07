import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/@tiptap/')) return 'tiptap'
          if (id.includes('/react-datepicker/') || id.includes('/date-fns/')) return 'datepicker'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-vendor'
          }
        },
      },
    },
  },
})
