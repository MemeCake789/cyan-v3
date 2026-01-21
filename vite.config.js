import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), viteSingleFile()],
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

// import { defineConfig } from 'vite'
// import { svelte } from '@sveltejs/vite-plugin-svelte'
// import { viteSingleFile } from "vite-plugin-singlefile"

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [svelte(), viteSingleFile({ 
//     removeViteModuleLoader: true,
//     inlineModulePreload: true,
//   })],
//   build: {
//     rollupOptions: {
//       output: {
//         entryFileNames: 'cyanide.js',
//         assetFileNames: 'cyanide.[ext]',
//       },
//     },
//     outDir: 'dist',
//   },
//   server: {
//     proxy: {
//       '/api': {
//         target: 'https://cyan-data.vercel.app',
//         changeOrigin: true,
//         buffer: false,
//         timeout: 1000 * 60 * 60 * 12, // 12 hours
//       },
//     },
//   },
// })

