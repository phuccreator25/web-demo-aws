import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDefaultCategories } from './controllers/categoryController.js';
import categoryRoutes from './routes/categoryRoutes.js';
import imageRoutes from './routes/imageRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
  seedDefaultCategories();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Health Check for AWS Target Group Health Check
app.get('/', (req, res) => {
  res.status(200).send('OK - Express Server is Running');
});

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    bucket: process.env.AWS_BUCKET_NAME,
    region: process.env.AWS_REGION,
  });
});

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/images', imageRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [Server Running] Express Server is listening on http://localhost:${PORT}`);
});
