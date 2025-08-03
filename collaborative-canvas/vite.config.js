import { defineConfig } from 'vite'

export default defineConfig({
  base: '/collaborative-canvas/', // Use absolute path for deployment
  build: {
    outDir: '../public/collaborative-canvas', // Build directly to public directory
    emptyOutDir: true, // Clear the output directory before building
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3002
  }
})
