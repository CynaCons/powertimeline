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
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'mui-emotion': ['@emotion/react', '@emotion/styled'],
          // Application chunks
          'layout-engine': [
            './src/layout/LayoutEngine.ts',
            './src/layout/DeterministicLayoutComponent.tsx',
            './src/layout/clustering.ts',
            './src/layout/SlotGrid.ts',
            './src/layout/CapacityModel.ts'
          ],
          'timeline-components': [
            './src/components/Timeline.tsx',
            './src/components/TimelineMinimap.tsx',
            './src/timeline/Axis.tsx',
            './src/timeline/hooks/useAxisTicks.ts'
          ]
        }
      }
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 400
  }
}))
