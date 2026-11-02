import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

// Génère toutes les icônes depuis public/logo.svg : `npm run icons`.
// Pas de marge ajoutée : logo.svg a déjà son fond plein et sa zone de sécurité.
const background = { background: '#0a0a0a' }

export default defineConfig({
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: background },
    apple: { ...preset.apple, padding: 0, resizeOptions: background },
  },
  images: ['public/logo.svg'],
})
