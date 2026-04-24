// routes/orders.js
const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { computeDeliveryFee, DELIVERY_PRICES, FREE_DELIVERY_THRESHOLD } = require('../deliveryPricing');

const router = express.Router();

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const VALID_DELIVERY_TYPES = ['home', 'stopdesk'];

// PUBLIC — expose pricing table to frontend
router.get('/delivery-pricing', (req, res) => {
  res.json({
    prices: DELIVERY_PRICES,
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  });
});

// PUBLIC — submit a new order
router.post('/', (req, res) => {
  const { customer_name, customer_phone, wilaya, address, notes, items, delivery_type } = req.body || {};
  if (!customer_name || !customer_phone || !wilaya || !address) {
    return res.status(400).json({ error: 'Customer name, phone, wilaya and address are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  const deliveryType = VALID_DELIVERY_TYPES.includes(delivery_type) ? delivery_type : 'stopdesk';

  // Recompute subtotal server-side from current product prices
  const productStmt = db.prepare('SELECT id, name_fr, price, stock, is_active FROM products WHERE id = ?');
  const validated = [];
  let subtotal = 0;
  for (const it of items) {
    const p = productStmt.get(Number(it.product_id));
    if (!p || !p.is_active) {
      return res.status(400).json({ error: `Product ${it.product_id} unavailable` });
    }
    const qty = Math.max(1, Number(it.quantity || 1));
    validated.push({ product_id: p.id, name: p.name_fr, price: p.price, quantity: qty });
    subtotal += p.price * qty;
  }

  // Server-side delivery fee (prevents client tampering)
  const { fee: deliveryFee, available } = computeDeliveryFee(wilaya, deliveryType, subtotal);
  if (!available) {
    return res.status(400).json({ error: `Livraison ${deliveryType === 'home' ? 'à domicile' : 'stop desk'} indisponible pour ${wilaya}` });
  }
  const total = subtotal + deliveryFee;

  const insertOrder = db.prepare(
    `INSERT INTO orders (customer_name, customer_phone, wilaya, address, notes,
                         delivery_type, delivery_fee, subtotal, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    const result = insertOrder.run(
      customer_name.trim(),
      customer_phone.trim(),
      wilaya.trim(),
      address.trim(),
      (notes || '').trim(),
      deliveryType,
      deliveryFee,
      subtotal,
      total
    );
    const orderId = result.lastInsertRowid;
    for (const v of validated) insertItem.run(orderId, v.product_id, v.name, v.price, v.quantity);
    return orderId;
  });

  const orderId = tx();
  res.status(201).json({ id: orderId, subtotal, delivery_fee: deliveryFee, total });
});

// ADMIN — list orders with items
router.get('/', authRequired, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM orders';
  const params = [];
  if (status && VALID_STATUSES.includes(status)) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const orders = db.prepare(sql).all(...params);
  const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const enriched = orders.map((o) => ({ ...o, items: itemStmt.all(o.id) }));
  res.json(enriched);
});

router.get('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  res.json(order);
});

router.patch('/:id/status', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` });
  }
  const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.delete('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare('DELETE FROM orders WHERE id=?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
