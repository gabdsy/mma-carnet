import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Une nouvelle version se télécharge en arrière-plan et s'applique au prochain lancement.
      registerType: 'autoUpdate',
      // Les icônes sont déjà couvertes par globPatterns : évite de les mettre deux fois en cache.
      includeManifestIcons: false,
      manifest: {
        name: 'Carnet MMA',
        short_name: 'Carnet MMA',
        description: "Leçons, drills, séances et bilans d'entraînement MMA.",
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Seuls les fichiers de l'appli sont mis en cache, jamais les données Supabase.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
