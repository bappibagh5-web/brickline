const express = require('express');
const cors = require('cors');
const applicationRoutes = require('./routes/applicationRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const conditionRoutes = require('./routes/conditionRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const placesRoutes = require('./routes/placesRoutes');

const app = express();

app.use(express.json());

const defaultAllowedOrigins = [
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://app.bricklinefunding.com'
];

const envAllowedOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(applicationRoutes);
app.use(calculatorRoutes);
app.use(conditionRoutes);
app.use(fieldRoutes);
app.use(placesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error.';
  res.status(status).json({ error: message });
});

module.exports = { app };
