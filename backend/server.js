// server.js — Atelier Soleil backend entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./db');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const ordersRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');
const { UPLOADS_DIR } = require('./middleware/upload');

// --- Auto-sync admin credentials from .env on every startup ---
// This means editing ADMIN_USERNAME / ADMIN_PASSWORD in .env (or Render env vars)
// and restarting the server is enough to update the admin login.
(function syncAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('⚠️  ADMIN_PASSWORD not set in .env — admin login will not work.');
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (existing) {
    db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(hash, username);
    console.log(`✓ Admin "${username}" password synced from environment`);
  } else {
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log(`✓ Admin "${username}" created from environment`);
  }
  // Seed categories if none exist (first-ever boot)
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (catCount === 0) {
    const seed = [
      ['Robes', 'فساتين', 'robes'],
      ['Manteaux & Vestes', 'معاطف وسترات', 'manteaux'],
      ['Hauts & Blouses', 'بلوزات وأعلى', 'hauts'],
      ['Pantalons & Jupes', 'بناطيل وتنانير', 'bas'],
      ['Sacs', 'حقائب', 'sacs'],
      ['Accessoires', 'إكسسوارات', 'accessoires'],
    ];
    const stmt = db.prepare('INSERT INTO categories (name_fr, name_ar, slug) VALUES (?, ?, ?)');
    for (const [fr, ar, slug] of seed) stmt.run(fr, ar, slug);
    console.log(`✓ Seeded ${seed.length} starter categories`);
  }
})();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',') }));
app.use(express.json({ limit: '2mb' }));

// Serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'atelier-soleil-api' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/stats', statsRoutes);

// Optional: serve frontend build if both are deployed together
const frontendDist = path.resolve(__dirname, '../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler (multer + general)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Atelier Soleil API running on port ${PORT}`);
});
