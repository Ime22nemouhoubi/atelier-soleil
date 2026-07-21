// routes/products.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { upload, UPLOADS_DIR } = require('../middleware/upload');

const router = express.Router();
const MAX_IMAGES = 5;

// Fixed size whitelist — MUST stay in sync with frontend/src/locales/sizes.js
const ALLOWED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const HEX_RE = /^#([0-9a-fA-F]{3}){1,2}$/;

// ---------- helpers ----------
function buildImageUrl(req, filename) {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

function getProductImages(productId) {
  return db
    .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY position ASC, id ASC')
    .all(productId);
}

function getProductVariants(productId) {
  return db
    .prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY size, color_name')
    .all(productId);
}

function serializeProduct(req, p) {
  const images = getProductImages(p.id);
  const galleryUrls = images.map((img) => buildImageUrl(req, img.image_url));
  // Legacy single image as fallback if no gallery entries exist
  const legacy = p.image_url ? buildImageUrl(req, p.image_url) : null;
  const allImages = galleryUrls.length > 0 ? galleryUrls : legacy ? [legacy] : [];
  const variants = getProductVariants(p.id);
  // Aggregate totals for admin listing convenience
  const totalVariantStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  return {
    ...p,
    image_url: allImages[0] || null, // primary image (back-compat)
    images: allImages,
    variants,
    total_variant_stock: totalVariantStock,
  };
}

function deleteLocalFile(filename) {
  if (!filename || filename.startsWith('http')) return;
  const full = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(full)) {
    try { fs.unlinkSync(full); } catch {}
  }
}

/**
 * Parse and validate a variants JSON payload from an admin form.
 * Input shape: [{ size, color_name, color_hex?, stock }, ...]
 * Returns cleaned array or throws Error with a user-friendly message.
 */
function parseVariants(raw) {
  if (raw === undefined || raw === null || raw === '') return null; // means "no update"
  let parsed;
  try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw new Error('variants must be valid JSON'); }
  if (!Array.isArray(parsed)) throw new Error('variants must be an array');

  const cleaned = [];
  const seen = new Set();
  for (const v of parsed) {
    if (!v || typeof v !== 'object') throw new Error('each variant must be an object');
    const size = String(v.size || '').trim().toUpperCase();
    const color_name = String(v.color_name || '').trim();
    const color_hex = v.color_hex ? String(v.color_hex).trim() : null;
    const stock = Math.max(0, Math.floor(Number(v.stock) || 0));
    if (!ALLOWED_SIZES.includes(size)) throw new Error(`invalid size "${v.size}" (allowed: ${ALLOWED_SIZES.join(', ')})`);
    if (!color_name) throw new Error('each variant needs a color_name');
    if (color_hex && !HEX_RE.test(color_hex)) throw new Error(`invalid hex "${color_hex}" (use #RGB or #RRGGBB)`);
    const key = `${size}|||${color_name.toLowerCase()}`;
    if (seen.has(key)) throw new Error(`duplicate variant: ${size} / ${color_name}`);
    seen.add(key);
    cleaned.push({ size, color_name, color_hex, stock });
  }
  return cleaned;
}

/**
 * Overwrite all variants for a product with `variants` list.
 * If variants is null → skip. If empty array → delete all variants.
 */
function replaceVariants(productId, variants) {
  if (variants === null) return; // no change requested
  db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
  if (variants.length === 0) return;
  const stmt = db.prepare(
    'INSERT INTO product_variants (product_id, size, color_name, color_hex, stock) VALUES (?, ?, ?, ?, ?)'
  );
  for (const v of variants) stmt.run(productId, v.size, v.color_name, v.color_hex, v.stock);
}

// ---------- PUBLIC ----------
router.get('/', (req, res) => {
  const { category, q, includeInactive } = req.query;
  let sql = `SELECT p.*, c.name_fr AS category_name_fr, c.name_ar AS category_name_ar, c.slug AS category_slug
             FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE 1=1`;
  const params = [];
  if (!includeInactive) sql += ' AND p.is_active = 1';
  if (category) { sql += ' AND c.slug = ?'; params.push(category); }
  if (q) {
    sql += ' AND (p.name_fr LIKE ? OR p.name_ar LIKE ? OR p.description_fr LIKE ? OR p.description_ar LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY p.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map((r) => serializeProduct(req, r)));
});

router.get('/:id', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name_fr AS category_name_fr, c.name_ar AS category_name_ar, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(serializeProduct(req, row));
});

// ---------- ADMIN ----------
// Accept up to 5 images under the field name "images"
router.post('/', authRequired, upload.array('images', MAX_IMAGES), (req, res) => {
  const { name_fr, name_ar, description_fr, description_ar, price, stock, category_id, is_active, variants: variantsRaw } = req.body;
  if (!name_fr || !name_ar || price === undefined) {
    return res.status(400).json({ error: 'name_fr, name_ar and price are required' });
  }
  let variants;
  try { variants = parseVariants(variantsRaw); }
  catch (err) { return res.status(400).json({ error: `variants: ${err.message}` }); }

  const files = req.files || [];
  const primaryFilename = files[0] ? files[0].filename : null;

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO products (name_fr, name_ar, description_fr, description_ar, price, stock, image_url, category_id, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name_fr,
        name_ar,
        description_fr || '',
        description_ar || '',
        Number(price),
        Number(stock || 0),
        primaryFilename,
        category_id ? Number(category_id) : null,
        is_active === undefined ? 1 : Number(is_active)
      );
    const productId = result.lastInsertRowid;
    const stmt = db.prepare('INSERT INTO product_images (product_id, image_url, position) VALUES (?, ?, ?)');
    files.forEach((f, i) => stmt.run(productId, f.filename, i));
    replaceVariants(productId, variants);
    return productId;
  });

  const id = tx();
  res.status(201).json({ id });
});

router.put('/:id', authRequired, upload.array('images', MAX_IMAGES), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name_fr, name_ar, description_fr, description_ar, price, stock, category_id, is_active, replace_images, variants: variantsRaw } = req.body;
  let variants;
  try { variants = parseVariants(variantsRaw); }
  catch (err) { return res.status(400).json({ error: `variants: ${err.message}` }); }

  const files = req.files || [];
  const shouldReplace = replace_images === '1' || replace_images === 'true';

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE products SET name_fr=?, name_ar=?, description_fr=?, description_ar=?, price=?, stock=?, category_id=?, is_active=? WHERE id=?`
    ).run(
      name_fr ?? existing.name_fr,
      name_ar ?? existing.name_ar,
      description_fr ?? existing.description_fr,
      description_ar ?? existing.description_ar,
      price !== undefined ? Number(price) : existing.price,
      stock !== undefined ? Number(stock) : existing.stock,
      category_id !== undefined ? (category_id ? Number(category_id) : null) : existing.category_id,
      is_active !== undefined ? Number(is_active) : existing.is_active,
      id
    );

    if (shouldReplace && files.length > 0) {
      // Wipe previous images (files + rows) and replace with new uploads
      const prev = getProductImages(id);
      for (const p of prev) deleteLocalFile(p.image_url);
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      if (existing.image_url) deleteLocalFile(existing.image_url);

      const stmt = db.prepare('INSERT INTO product_images (product_id, image_url, position) VALUES (?, ?, ?)');
      files.forEach((f, i) => stmt.run(id, f.filename, i));
      db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(files[0].filename, id);
    } else if (!shouldReplace && files.length > 0) {
      // Append new images to existing gallery (respect MAX_IMAGES)
      const current = getProductImages(id).length;
      const availableSlots = Math.max(0, MAX_IMAGES - current);
      const toAdd = files.slice(0, availableSlots);
      const nextPos = current;
      const stmt = db.prepare('INSERT INTO product_images (product_id, image_url, position) VALUES (?, ?, ?)');
      toAdd.forEach((f, i) => stmt.run(id, f.filename, nextPos + i));
      // If no primary yet, set first upload as primary
      if (!existing.image_url && toAdd[0]) {
        db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(toAdd[0].filename, id);
      }
    }

    // Variants: if the client sent a variants field (even []), we overwrite.
    // If field absent (undefined → null from parseVariants), leave existing untouched.
    replaceVariants(id, variants);
  });

  tx();
  res.json({ ok: true });
});

// Delete a single image from a product's gallery
router.delete('/:id/images/:imageId', authRequired, (req, res) => {
  const productId = Number(req.params.id);
  const imageId = Number(req.params.imageId);
  const img = db.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?').get(imageId, productId);
  if (!img) return res.status(404).json({ error: 'Image not found' });
  deleteLocalFile(img.image_url);
  db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);
  // If we deleted the primary, promote the next one
  const product = db.prepare('SELECT image_url FROM products WHERE id = ?').get(productId);
  if (product && product.image_url === img.image_url) {
    const next = db.prepare('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY position ASC LIMIT 1').get(productId);
    db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(next ? next.image_url : null, productId);
  }
  res.json({ ok: true });
});

router.delete('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const images = getProductImages(id);
  for (const img of images) deleteLocalFile(img.image_url);
  if (existing.image_url) deleteLocalFile(existing.image_url);
  db.prepare('DELETE FROM products WHERE id=?').run(id); // CASCADE cleans images
  res.json({ ok: true });
});

module.exports = router;
