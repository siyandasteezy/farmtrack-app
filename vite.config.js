import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Pinned so it matches .claude/launch.json and the --targetPort that
  // `netlify dev` proxies to. Left to itself Vite takes 5173, or the next
  // free port if that is busy, and the function proxy then points at nothing
  // — or worse, at a stale server still holding the expected port.
  server: { port: 5174, strictPort: true },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-leaflet'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/recharts')) return 'recharts';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
        },
      },
    },
  },
})
