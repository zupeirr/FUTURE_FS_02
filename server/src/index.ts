import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/db';

// Import models to ensure associations are loaded
import './models/User';
import './models/Lead';
import './models/Note';

dotenv.config();

import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/leads', leadsRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Database sync and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models (in production, use migrations)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();

