import serverless from 'serverless-http';
import app from '../../src/app.js';

// Netlify Functions handler wrapping the Express app
// No basePath needed - Express routes already start with /api
export const handler = serverless(app);
