import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import analyzer from 'rollup-plugin-analyzer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Add bundle analyzer in analyze mode
    mode === 'analyze' && analyzer({
      summaryOnly: true,
      limit: 20,
      hideDeps: true
    })
  ].filter(Boolean),
  build: {
    // Simplified chunking to avoid circular dependency issues
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
}))
