import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  /*   define: { global: 'globalThis', 'process.env': {} },
  resolve: { alias: { buffer: 'buffer/' } },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })],
    },
  }, */
  plugins: [react(), tailwindcss(), ,],
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          wagmi: ['wagmi'],
          rainbowMe: ['@rainbow-me/rainbowkit'],
          apollo: ['@apollo/client'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})
