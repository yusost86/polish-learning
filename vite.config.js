import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    base: '/polish-learning/',
    plugins: [
        react()
    ],
    server: {
        host: '0.0.0.0',
        https: true
    },
    preview: {
        host: '0.0.0.0',
        https: true
    }
});
