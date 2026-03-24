const express = require('express');
const cors = require('cors');
const applicationRoutes = require('./routes/applicationRoutes');
const conditionRoutes = require('./routes/conditionRoutes');
const fieldRoutes = require('./routes/fieldRoutes');

const app = express();

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(applicationRoutes);
app.use(conditionRoutes);
app.use(fieldRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error.';
  res.status(status).json({ error: message });
});

module.exports = { app };
