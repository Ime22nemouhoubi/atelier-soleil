// routes/categories.js
const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// PUBLIC — list categories
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name_fr').all();
  res.json(rows);
});

// ADMIN — create
router.post('/', authRequired, (req, res) => {
  const { name_fr, name_ar, slug } = req.body || {};
  if (!name_fr || !name_ar || !slug) {
    return res.status(400).json({ error: 'name_fr, name_ar and slug required' });
  }
  try {
    const result = db
      .prepare('INSERT INTO categories (name_fr, name_ar, slug) VALUES (?, ?, ?)')
      .run(name_fr, name_ar, slug);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ADMIN — update
router.put('/:id', authRequired, (req, res) => {
  const { name_fr, name_ar, slug } = req.body || {};
  const id = Number(req.params.id);
  const result = db
    .prepare('UPDATE categories SET name_fr=?, name_ar=?, slug=? WHERE id=?')
    .run(name_fr, name_ar, slug, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// ADMIN — delete
router.delete('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM categories WHERE id=?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
