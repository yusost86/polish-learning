import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        // gh-pages needs /polish-learning/; local dev uses / for simpler URLs
        base: command === 'serve' ? '/' : '/polish-learning/',
        define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
        },
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: null,
                manifest: false,
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                },
            }),
        ],
        server: {
            host: '0.0.0.0',
            open: true,
        },
        preview: {
            host: '0.0.0.0',
            https: true,
        },
    });
});
