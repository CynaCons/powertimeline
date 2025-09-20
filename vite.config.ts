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
    // Manual chunks for better bundle distribution
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@emotion')) {
              return 'mui-emotion';
            }
            if (id.includes('@mui/material')) {
              // Split Material-UI into smaller chunks
              if (id.includes('Tooltip') || id.includes('Popover') || id.includes('Modal')) {
                return 'mui-overlays';
              }
              if (id.includes('Button') || id.includes('IconButton') || id.includes('Fab')) {
                return 'mui-buttons';
              }
              if (id.includes('Input') || id.includes('TextField') || id.includes('Select')) {
                return 'mui-inputs';
              }
              return 'mui-core';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            return 'vendor-misc';
          }

          // Application chunks
          if (id.includes('/layout/')) {
            return 'layout-engine';
          }
          if (id.includes('/timeline/') || id.includes('TimelineMinimap')) {
            return 'timeline-components';
          }
          if (id.includes('/panels/') || id.includes('/overlays/')) {
            return 'ui-panels';
          }
          if (id.includes('/components/')) {
            return 'ui-components';
          }
        }
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 400
  }
}))
