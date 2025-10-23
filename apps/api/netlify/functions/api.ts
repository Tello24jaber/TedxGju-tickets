import serverless from 'serverless-http';
import app from '../../src/app.ts';

// Netlify Functions handler wrapping the Express app
// No basePath needed - Express routes already start with /api
export const handler = serverless(app);
