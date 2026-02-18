import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        sourcemap: false,
        minify: 'esbuild',
    },
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    plugins: [
        // CORS primeiro: garante header em todas as respostas (@vite/env, @crx/*, src/*)
        {
            name: 'cors-all',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const origin = req.headers.origin
                    if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost'))) {
                        res.setHeader('Access-Control-Allow-Origin', origin)
                    } else if (!origin) {
                        res.setHeader('Access-Control-Allow-Origin', '*')
                    }
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                    res.setHeader('Access-Control-Allow-Headers', '*')
                    if (req.method === 'OPTIONS') {
                        res.statusCode = 204
                        res.end()
                        return
                    }
                    next()
                })
            },
        },
        react(),
        crx({ manifest }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3005,
        strictPort: true,
        hmr: {
            port: 3005,
        },
        cors: {
            origin: [/chrome-extension:\/\//, /http:\/\/localhost(:\d+)?/],
            credentials: true,
        },
    },

})
