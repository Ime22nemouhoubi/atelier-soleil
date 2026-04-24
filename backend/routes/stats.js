// routes/stats.js — sales stats for admin dashboard
const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status='pending'").get().c;
  const deliveredOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status='delivered'").get().c;
  const totalRevenue = db
    .prepare("SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE status='delivered'")
    .get().s;
  const totalProducts = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;

  // Last 7 days revenue (delivered)
  const dailyRevenue = db
    .prepare(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
       FROM orders
       WHERE created_at >= DATE('now', '-7 days')
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    )
    .all();

  // Top 5 products by quantity sold
  const topProducts = db
    .prepare(
      `SELECT product_name, SUM(quantity) AS qty, SUM(unit_price * quantity) AS revenue
       FROM order_items
       GROUP BY product_name
       ORDER BY qty DESC
       LIMIT 5`
    )
    .all();

  res.json({
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalRevenue,
    totalProducts,
    dailyRevenue,
    topProducts,
  });
});

module.exports = router;
