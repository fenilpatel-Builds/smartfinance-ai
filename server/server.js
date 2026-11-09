import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if demo workspace & owner exists; if not, auto-seed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding initial demo data...');
      const { default: seedScript } = await import('./scripts/autoSeed.js');
      await seedScript();
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
