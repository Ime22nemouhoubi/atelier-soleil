// initDb.js — seed initial admin and categories
const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

// Create default admin if none exists
const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(adminUsername);
if (!existing) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(adminUsername, hash);
  console.log(`✓ Admin created: username="${adminUsername}"`);
  console.log(`  IMPORTANT: change ADMIN_PASSWORD in your .env then re-run init-db to update.`);
} else {
  // update password to match env (helpful when rotating)
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(hash, adminUsername);
  console.log(`✓ Admin "${adminUsername}" password updated from .env`);
}

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (catCount === 0) {
  const seed = [
    { name_fr: 'Robes', name_ar: 'فساتين', slug: 'robes' },
    { name_fr: 'Manteaux & Vestes', name_ar: 'معاطف وسترات', slug: 'manteaux' },
    { name_fr: 'Hauts & Blouses', name_ar: 'بلوزات وأعلى', slug: 'hauts' },
    { name_fr: 'Pantalons & Jupes', name_ar: 'بناطيل وتنانير', slug: 'bas' },
    { name_fr: 'Sacs', name_ar: 'حقائب', slug: 'sacs' },
    { name_fr: 'Accessoires', name_ar: 'إكسسوارات', slug: 'accessoires' },
  ];
  const stmt = db.prepare('INSERT INTO categories (name_fr, name_ar, slug) VALUES (?, ?, ?)');
  for (const c of seed) stmt.run(c.name_fr, c.name_ar, c.slug);
  console.log(`✓ Seeded ${seed.length} categories`);
}

console.log('Database ready.');
process.exit(0);
