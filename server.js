require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const apiRoutes = require('./src/routes/api');
const authRoutes = require('./src/routes/auth');

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Public API — products & settings (no auth needed)
const publicRoutes = require('./src/routes/public');
app.use('/api/public', publicRoutes);

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only in local environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
    ☕ ====================================
    ☕  Al-Khumaisi Bean House - Katalog
    ☕ ====================================
    🌐 Website:   http://localhost:${PORT}
    👨‍💼 Admin:     http://localhost:${PORT}/admin.html
    ☕ ====================================
    `);
  });
}

module.exports = app;
