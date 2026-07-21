# Atelier Soleil ✦

**L'élégance au quotidien** — Bilingual (French + Arabic) e‑commerce site for an Algerian women's ready-to-wear fashion brand. Cash on delivery, no online payment.

Stack: **React + Vite + Tailwind** (frontend) · **Node.js + Express + SQLite** (backend) · deployable on Railway, Render, or any Docker/VPS.

---

## Features

### Customer site
- 🌐 Bilingual French / Arabic with one-click toggle (auto RTL for Arabic)
- 🛍️ Product catalog with category filter and search
- 🛒 Persistent cart (localStorage)
- 📋 Cart + checkout form (name, phone, wilaya, address, notes)
- ✅ Order confirmation with reference number
- 💳 Cash on delivery (no online payment)
- 📱 Fully responsive

### Admin panel (`/admin/login`)
- 📊 **Dashboard** — total orders, pending, delivered, revenue, top 5 articles, last 7 days chart
- 🛍️ **Articles** — add / edit / delete, with image upload
- 🏷️ **Categories** — full CRUD
- 📦 **Orders** — list, view detail, change status
- 🔐 JWT-based authentication, auto-syncs password from env vars on startup

---

## Local setup

### Prerequisites
- Node.js 18+ installed (<https://nodejs.org>)

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env: set JWT_SECRET (random long string) and ADMIN_PASSWORD
npm install
npm run dev              # http://localhost:4000
```

### 2. Frontend (in a second terminal)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Customer site: <http://localhost:5173>
Admin: <http://localhost:5173/admin/login>

---

## Deploying to Railway (recommended)

The included `nixpacks.toml` handles the build automatically.

### Step-by-step
1. **Push the code to GitHub** (public or private repo — Railway handles both).
2. Sign up at <https://railway.com> with your GitHub account.
3. **New Project → Deploy from GitHub repo → select `atelier-soleil`.**
4. In the service settings:
   - Leave **Root Directory** blank (nixpacks.toml handles paths)
   - Set **Builder** to **Nixpacks** (not Railpack)
5. Add a **Volume**: Settings → Volumes → New Volume. Mount path: `/app/data`, size `1 GB`.
6. Add these **Environment Variables**:
   - `NODE_VERSION` = `20`
   - `PORT` = `4000`
   - `JWT_SECRET` = long random string (run `openssl rand -hex 32`)
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = a strong password
   - `CORS_ORIGIN` = `*`
   - `DB_PATH` = `/app/data/ateliersoleil.db`
   - `UPLOADS_DIR` = `/app/data/uploads`
7. Railway auto-deploys. When done, **Settings → Networking → Generate Domain** to get your live URL.

First build takes ~8 min (compiling `better-sqlite3`). Subsequent deploys are ~2 min.

---

## Deploying to Render (alternative)

Use the included `render.yaml`:
1. Push repo to GitHub.
2. On <https://render.com> → **New + → Blueprint** → select your repo.
3. Render reads `render.yaml` automatically. Set `ADMIN_PASSWORD` when prompted.
4. Click **Apply**. Wait 5-7 min.

---

## Day-to-day operations

### Add a new article
1. Go to `/admin/products`
2. Click **+ Ajouter un article**
3. Fill French + Arabic name, price, category, upload image
4. Save — it appears on the shop instantly

### Process an order
1. Go to `/admin/orders` — new orders show status **En attente**
2. Click **Détails** to see customer info
3. Call the customer to confirm
4. Change status: **Confirmée** → **Expédiée** → **Livrée**
5. Revenue stats only count **delivered** orders

### Change admin password
Edit `ADMIN_PASSWORD` in your host's environment variables and redeploy. The server auto-syncs the new password on startup.

---

## Project structure

```
atelier-soleil/
├── backend/              Node.js + Express API
│   ├── server.js         Entry point, syncs admin from env on startup
│   ├── db.js             SQLite schema
│   ├── routes/           auth · products · categories · orders · stats
│   ├── middleware/       auth (JWT) · upload (multer)
│   └── uploads/          Product images
├── frontend/             React + Vite + Tailwind
│   ├── public/           favicon.svg, hero.jpg (user-provided)
│   ├── src/
│   │   ├── pages/        Home, Shop, Product, Cart, Checkout, Admin*
│   │   ├── components/   Navbar, Footer, ProductCard
│   │   ├── context/      Language, Cart, Auth
│   │   ├── locales/      translations.js (FR+AR), wilayas.js
│   │   └── api/client.js Axios calls (relative URL in prod)
│   └── tailwind.config.js
├── nixpacks.toml         Railway build config
├── render.yaml           Render blueprint (optional)
└── .gitignore
```

---

## Before deploying

1. **Drop your hero image** at `frontend/public/hero.jpg`. The code references this exact filename.
2. **Verify `.env` is NOT tracked by git:** run `git status | grep .env` — should only show `.env.example`.
3. **Use a strong `ADMIN_PASSWORD`** on production (16+ chars).

---

## License

MIT — use freely for the Atelier Soleil brand. Built with ♥
