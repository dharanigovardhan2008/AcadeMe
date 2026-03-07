import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Don't auto-inject SW registration — Firebase SW must be registered manually
      injectRegister: null,
      workbox: {
        // Exclude Firebase's SW from Workbox precache
        globIgnores: ['firebase-messaging-sw.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js/],
      },
      manifest: {
        name: 'AcadeMe',
        short_name: 'AcadeMe',
        theme_color: '#1a73e8',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    headers: {
      // Required so the browser accepts the SW at root scope
      'Service-Worker-Allowed': '/',
    },
  },
})
