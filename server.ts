import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/api/routes.ts';

dotenv.config();

// Safely ignore client network aborts in Node runtime
process.on('unhandledRejection', (reason: any) => {
  if (
    reason &&
    (reason.name === 'AbortError' ||
      String(reason?.message || '').includes('aborted') ||
      String(reason?.message || '').includes('signal is aborted'))
  ) {
    return;
  }
  console.warn('Unhandled promise rejection:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', apiRouter);

// Error handler for request aborts
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

if (process.env.NODE_ENV === 'production') {
  // Serve static assets in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // Mount Vite middleware in development
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PrintHub server listening on port ${PORT}`);
});
