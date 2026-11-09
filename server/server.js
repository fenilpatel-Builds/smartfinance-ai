import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('[Server UncaughtException]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server UnhandledRejection]', reason);
});

const startServer = async () => {
  try {
    await connectDB();

    // Check if demo workspace & owner exists; only auto-seed in non-production environments
    const isProduction = process.env.NODE_ENV === 'production';
    const userCount = await User.countDocuments();
    
    if (!isProduction && userCount === 0) {
      console.log('[Server] Database is empty in development. Auto-seeding initial demo data...');
      const { default: seedScript } = await import('./scripts/autoSeed.js');
      await seedScript();
    } else if (isProduction && userCount === 0) {
      console.log('[Server] Production environment detected with empty database. Auto-seeding disabled for security.');
    }

    app.listen(PORT, () => {
      console.log(`[Server] SmartFinance AI backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize backend server:', err.message);
    process.exit(1);
  }
};

startServer();
