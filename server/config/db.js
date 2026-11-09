import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartfinance';
  
  try {
    // Attempt connecting to the configured MongoDB instance (Atlas or local) with a short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Connected to MongoDB at: ${uri}`);
  } catch (err) {
    console.warn(`[DB] Could not connect to MongoDB at ${uri} (${err.message}).`);
    console.log('[DB] Launching embedded MongoDB in-memory fallback for local development...');
    
    try {
      memoryServer = await MongoMemoryServer.create();
      const fallbackUri = memoryServer.getUri();
      await mongoose.connect(fallbackUri);
      console.log(`[DB] Successfully connected to in-memory MongoDB at: ${fallbackUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to launch in-memory MongoDB:', memErr.message);
      throw memErr;
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

