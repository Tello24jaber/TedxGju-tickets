// apps/api/src/app.ts
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

// Security middleware
app.use(helmet());

// CORS: allow one or more deployed app URLs plus localhost during development
const rawAllowed = process.env.APP_URLS || process.env.APP_URL || '';
const allowedOrigins = rawAllowed
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
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

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', redeemRoutes);

// Redirect endpoint for QR codes
app.get('/r/:token', (req, res) => {
  const token = req.params.token;
  const scannerUrl = `${process.env.APP_URL || allowedOrigins[0] || ''}/scan?token=${token}`;
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

export default app;
