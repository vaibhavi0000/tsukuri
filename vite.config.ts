import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
import { apiRouter } from './src/api/routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      // 1. Mount express API router for /api routes
      const app = express();
      app.use((req, res, next) => {
        req.on('aborted', () => {});
        next();
      });
      app.use(express.json({ limit: '15mb' }));
      app.use('/api', apiRouter);
      app.use((err: any, req: any, res: any, next: any) => {
        if (
          err &&
          (err.name === 'AbortError' ||
            err.type === 'request.aborted' ||
            String(err.message || '').includes('aborted') ||
            String(err.message || '').includes('signal is aborted'))
        ) {
          return;
        }
        next(err);
      });
      server.middlewares.use(app);

      // 2. Return a post-middleware hook that runs after Vite's built-in middlewares.
      // This ensures ANY direct navigation to client-side paths (like /store, /shop, /storefront)
      // is caught and properly returns index.html transformed with Vite scripts instead of 404 or 403.
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
          }

          const rawUrl = req.url || '/';
          const pathname = rawUrl.split('?')[0];

          // Skip API calls, Vite internals, and static assets with extensions
          if (
            pathname.startsWith('/api') ||
            pathname.startsWith('/@') ||
            pathname.startsWith('/__') ||
            pathname.startsWith('/src') ||
            pathname.startsWith('/node_modules') ||
            /\.[a-zA-Z0-9]+$/.test(pathname)
          ) {
            return next();
          }

          try {
            const fs = await import('fs/promises');
            const templatePath = path.resolve(__dirname, 'index.html');
            const template = await fs.readFile(templatePath, 'utf-8');
            const html = await server.transformIndexHtml(rawUrl, template);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
          } catch (err) {
            next(err);
          }
        });
      };
    },
  };
}

export default defineConfig(() => {
  return {
    appType: 'spa' as const,
    plugins: [react(), tailwindcss(), expressApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
