import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartfinance';

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      console.log(`[DB] Connecting to persistent MongoDB at ${uri} (Attempt ${attempt}/${MAX_RETRIES})...`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 25,
        minPoolSize: 5,
      });

      console.log(`[DB] Successfully connected to persistent MongoDB at: ${uri}`);
      
      // Setup connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('[DB Event] MongoDB runtime error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[DB Event] MongoDB connection disconnected. Driver will auto-reconnect.');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('[DB Event] MongoDB reconnected successfully.');
      });

      return;
    } catch (err) {
      console.warn(`[DB] Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[DB] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // If reached here, all retries failed
  if (isProduction) {
    console.error('[DB FATAL] Could not connect to production MongoDB after maximum retries.');
    console.error('[DB FATAL] Never falling back to in-memory storage in production to prevent data loss.');
    throw new Error('Could not establish connection to persistent production MongoDB.');
  }

  if (isTest || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
    console.warn('[DB] Persistent MongoDB not reachable. Falling back to isolated test in-memory storage...');
    try {
      memoryServer = await MongoMemoryServer.create();
      const fallbackUri = memoryServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`[DB] Successfully connected to in-memory fallback MongoDB at: ${fallbackUri}`);
      return;
    } catch (memErr) {
      console.error('[DB FATAL] Failed to launch in-memory MongoDB fallback:', memErr.message);
      throw memErr;
    }
  }

  throw new Error(`Unable to connect to MongoDB at ${uri}. Ensure local mongod or MongoDB Atlas is reachable.`);
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[DB] Database connection gracefully closed.');
  } catch (err) {
    console.error('[DB] Error closing database connection:', err.message);
  }
};
