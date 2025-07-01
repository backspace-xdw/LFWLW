import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 50000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:50001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:50001',
        ws: true,
      },
      '/socket.io': {
        target: 'http://localhost:50001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
})