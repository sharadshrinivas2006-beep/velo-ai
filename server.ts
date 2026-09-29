import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMarketingContent, generateAnalyticsInsights, auditSafeguards } from './server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Endpoints
  app.post('/api/gemini/marketing-agent', async (req, res) => {
    try {
      const result = await generateMarketingContent(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Marketing agent route error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  app.post('/api/gemini/analytics-advisor', async (req, res) => {
    try {
      const result = await generateAnalyticsInsights(req.body.metrics, req.body.query);
      res.json(result);
    } catch (error: any) {
      console.error('Analytics advisor route error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  app.post('/api/safeguard-audit', (req, res) => {
    try {
      const result = auditSafeguards(req.body.text || '');
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // Mount Vite middleware in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VeloFin FinTech Studio running on port ${PORT}`);
  });
}

startServer();
