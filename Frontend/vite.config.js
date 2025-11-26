import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Định nghĩa biến global trỏ về window của trình duyệt
    global: 'window',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/ws-notifications': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true // quan trọng: proxy websocket
      }
    }
  }
})
