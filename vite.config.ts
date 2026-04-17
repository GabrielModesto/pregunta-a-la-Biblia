import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Lumen: Guía Bíblica Católica',
          short_name: 'Lumen',
          description: 'Consulta la Biblia Católica y recibe guía espiritual con IA.',
          theme_color: '#5a6a42',
          background_color: '#f9f6f1',
          display: 'standalone',
          icons: [
            {
              src: 'https://picsum.photos/192/192?random=bible',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/512/512?random=bible',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'https://picsum.photos/512/512?random=bible',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
