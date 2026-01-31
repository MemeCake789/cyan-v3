
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
  build: {
    rollupOptions: {
      input: {
        app: './index.html'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://cyan-data.vercel.app',
        changeOrigin: true,
        buffer: false,
        timeout: 1000 * 60 * 60 * 12, // 12 hours
      },
    },
  },
})

