// apps/api/src/env.ts
// Load environment variables FIRST before anything else
import dotenv from 'dotenv';

// In serverless environments (Netlify Functions), env vars are injected by the platform
// Only load .env file in local development
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  dotenv.config();
}

// Validate critical environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  console.error('Make sure .env file exists in the root directory with these variables set.');
  process.exit(1);
}

export {}; // Make this a module
