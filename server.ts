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

app.use(express.json({ limit: '15mb' }));
app.use('/api', apiRouter);

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`PrintHub production server listening on port ${PORT}`);
});
