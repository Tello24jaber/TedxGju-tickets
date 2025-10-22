// Vercel Serverless Function entrypoint wrapping the Express app
import serverless from 'serverless-http';
import app from '../src/app.js';

export default serverless(app);
