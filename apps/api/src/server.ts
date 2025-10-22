// apps/api/src/server.ts
// CRITICAL: Load environment variables FIRST
import './env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import adminRoutes from './routes/admin.js';
import ticketRoutes from './routes/tickets.js';
import redeemRoutes from './routes/redeem.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS: allow the deployed APP_URL and local Vite dev origins
const allowedOrigins = [
  process.env.APP_URL
].filter(Boolean) as string[];

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin requests or non-browser clients with no Origin header
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (isLocalhost || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight for all routes
app.options('*', cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (isLocalhost || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  }
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', redeemRoutes);

// Redirect endpoint for QR codes
app.get('/r/:token', (req, res) => {
  const token = req.params.token;
  const scannerUrl = `${process.env.APP_URL}/scan?token=${token}`;
  res.redirect(scannerUrl);
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`TEDxGJU API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;