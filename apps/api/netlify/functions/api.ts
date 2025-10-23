import serverless from 'serverless-http';
import app from '../../src/app.ts';

// Netlify Functions handler wrapping the Express app
// basePath ensures Express sees paths without the 
// '/.netlify/functions/api' prefix after redirects
export const handler = serverless(app, {
	basePath: '/.netlify/functions/api',
});
