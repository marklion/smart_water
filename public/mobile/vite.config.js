import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import uni from '@uni-helper/plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  root: './public/mobile',
  plugins: [
    uni(),
  ],
  build: {
    outDir: '../server/mobile',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
