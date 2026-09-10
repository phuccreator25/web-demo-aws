import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Set public DNS servers (Google 8.8.8.8 & Cloudflare 1.1.1.1) to ensure MongoDB SRV record lookup succeeds on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[DNS Warning] Could not set custom DNS servers:', e.message);
}

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DATABASE_NAME || 'awsdemo',
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // If SRV lookup fails, try fallback error reporting
  }
};
