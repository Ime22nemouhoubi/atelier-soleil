// db.js — SQLite database connection
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './ateliersoleil.db';
const resolvedPath = path.resolve(dbPath);

// Ensure the parent directory exists before opening the database.
// Prevents crashes on first deploy when a volume mount point is empty.
const dbDir = path.dirname(resolvedPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`✓ Created database directory: ${dbDir}`);
}

const db = new Database(resolvedPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Base schema ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_fr TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_fr TEXT,
    description_ar TEXT,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    category_id INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    delivery_type TEXT NOT NULL DEFAULT 'stopdesk',
    delivery_fee REAL NOT NULL DEFAULT 0,
    subtotal REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    variant_id INTEGER,
    size TEXT,
    color_name TEXT,
    color_hex TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
  );

  -- One row per size × color combination for a product.
  -- Sizes come from a fixed frontend list (S/M/L/XL/XXL); colors are free text per product.
  CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    color_name TEXT NOT NULL,
    color_hex TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, size, color_name),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ---------- Safe migrations for existing databases ----------
// PRAGMA table_info returns existing columns; we add any that are missing.
function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✓ Added column ${table}.${column}`);
  }
}

addColumnIfMissing('orders', 'delivery_type', "TEXT NOT NULL DEFAULT 'stopdesk'");
addColumnIfMissing('orders', 'delivery_fee', 'REAL NOT NULL DEFAULT 0');
addColumnIfMissing('orders', 'subtotal', 'REAL NOT NULL DEFAULT 0');

// Variants — added later. Order items link to their variant for historical accuracy;
// the size/color/hex are also copied inline so past orders stay readable even if a
// variant row is later edited or deleted.
addColumnIfMissing('order_items', 'variant_id', 'INTEGER');
addColumnIfMissing('order_items', 'size', 'TEXT');
addColumnIfMissing('order_items', 'color_name', 'TEXT');
addColumnIfMissing('order_items', 'color_hex', 'TEXT');

// product_variants table is created by CREATE TABLE IF NOT EXISTS above,
// so no explicit ALTER needed for existing DBs.

module.exports = db;
