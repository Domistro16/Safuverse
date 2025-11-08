// vite.config.ts
import react from "file:///Users/mac/ens-contracts/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { defineConfig } from "file:///Users/mac/ens-contracts/frontend/node_modules/vite/dist/node/index.js";
import tailwindcss from "file:///Users/mac/ens-contracts/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/Users/mac/ens-contracts/frontend";
var vite_config_default = defineConfig({
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
    extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          wagmi: ["wagmi"],
          rainbowMe: ["@rainbow-me/rainbowkit"],
          apollo: ["@apollo/client"]
        }
      }
    }
  },
  define: {
    global: "globalThis"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWFjL2Vucy1jb250cmFjdHMvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9tYWMvZW5zLWNvbnRyYWN0cy9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbWFjL2Vucy1jb250cmFjdHMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJ1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAvKiAgIGRlZmluZTogeyBnbG9iYWw6ICdnbG9iYWxUaGlzJywgJ3Byb2Nlc3MuZW52Jzoge30gfSxcbiAgcmVzb2x2ZTogeyBhbGlhczogeyBidWZmZXI6ICdidWZmZXIvJyB9IH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsnYnVmZmVyJ10sXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIHBsdWdpbnM6IFtOb2RlR2xvYmFsc1BvbHlmaWxsUGx1Z2luKHsgYnVmZmVyOiB0cnVlIH0pXSxcbiAgICB9LFxuICB9LCAqL1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKSwgLF0sXG4gIHJlc29sdmU6IHtcbiAgICBleHRlbnNpb25zOiBbJy5qc3gnLCAnLmpzJywgJy50c3gnLCAnLnRzJywgJy5qc29uJ10sXG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB3YWdtaTogWyd3YWdtaSddLFxuICAgICAgICAgIHJhaW5ib3dNZTogWydAcmFpbmJvdy1tZS9yYWluYm93a2l0J10sXG4gICAgICAgICAgYXBvbGxvOiBbJ0BhcG9sbG8vY2xpZW50J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGRlZmluZToge1xuICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVIsT0FBTyxXQUFXO0FBQ3ZTLFNBQVMsb0JBQTZCO0FBQ3RDLE9BQU8saUJBQWlCO0FBRXhCLE9BQU8sVUFBVTtBQUpqQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLEdBQUcsQ0FBQztBQUFBLEVBQ25DLFNBQVM7QUFBQSxJQUNQLFlBQVksQ0FBQyxRQUFRLE9BQU8sUUFBUSxPQUFPLE9BQU87QUFBQSxJQUNsRCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixPQUFPLENBQUMsT0FBTztBQUFBLFVBQ2YsV0FBVyxDQUFDLHdCQUF3QjtBQUFBLFVBQ3BDLFFBQVEsQ0FBQyxnQkFBZ0I7QUFBQSxRQUMzQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
