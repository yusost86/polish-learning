import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    base: '/polish-learning/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null,
            manifest: false, // manifest.json is hand-authored in /public and linked from index.html
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            },
        }),
    ],
    server: {
        host: '0.0.0.0',
        https: true,
    },
    preview: {
        host: '0.0.0.0',
        https: true,
    },
});
