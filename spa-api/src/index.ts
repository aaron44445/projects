import express from 'express';
import cors from 'cors';
import { config, validateEnv } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

// Validate environment variables
validateEnv();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🧖 Spa Management API                                ║
║                                                        ║
║   Server running on http://localhost:${config.port}            ║
║   Environment: ${config.env}                           ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
