// server.js - Simple CRUD + SSE + admin login + purchase (keeps data in JSON files)
// WARNING: This is a demo auth only (simple token in memory). Not for production.
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

const DATA_PATH = path.join(__dirname, 'products.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return fallback; }
}
function saveJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

let products = loadJSON(DATA_PATH, []);
let orders = loadJSON(ORDERS_PATH, []);

// SSE
const clients = [];
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control':'no-cache', Connection:'keep-alive' });
  res.flushHeaders();
  const id = Date.now() + Math.random();
  clients.push({ id, res });
  req.on('close', () => {
    const i = clients.findIndex(c => c.id === id);
    if (i >= 0) clients.splice(i,1);
  });
});
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => {
    try { c.res.write(payload); } catch(e){ /* ignore */ }
  });
}

// --- Admin auth (basic) ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'adminpass';
const adminTokens = new Map(); // token -> expiry timestamp

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}
function issueAdminToken() {
  const token = genToken();
  const expires = Date.now() + 1000 * 60 * 60; // 1 hour
  adminTokens.set(token, expires);
  return { token, expires };
}
function validateAdminToken(token) {
  if (!token) return false;
  const exp = adminTokens.get(token);
  if (!exp) return false;
  if (Date.now() > exp) { adminTokens.delete(token); return false; }
  return true;
}
function adminAuthMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = h.substring(7);
  if (!validateAdminToken(token)) return res.status(401).json({ error: 'Invalid or expired token' });
  next();
}

// --- Helpers ---
function persistProducts() { saveJSON(DATA_PATH, products); }
function persistOrders() { saveJSON(ORDERS_PATH, orders); }

function findIndex(id) { return products.findIndex(p => String(p.id) === String(id)); }

function queryProducts({ q, category, sort, page = 1, limit = 20 }) {
  let res = products.slice();
  if (q) {
    const term = q.toLowerCase();
    res = res.filter(p => (p.title && p.title.toLowerCase().includes(term)) ||
                         (p.description && p.description.toLowerCase().includes(term)));
  }
  if (category) res = res.filter(p => p.category === category);
  if (sort === 'price_asc') res.sort((a,b)=>a.price-b.price);
  if (sort === 'price_desc') res.sort((a,b)=>b.price-a.price);
  if (sort === 'newest') res.sort((a,b)=> new Date(b.addedAt) - new Date(a.addedAt));
  const total = res.length;
  const start = (page - 1) * limit;
  return { total, results: res.slice(start, start + limit) };
}

// --- Public endpoints ---
// GET products list
app.get('/api/products', (req, res) => {
  const { q, category, sort, page, limit } = req.query;
  const out = queryProducts({ q, category, sort, page: Number(page)||1, limit: Number(limit)||20 });
  res.json(out);
});

// GET categories
app.get('/api/categories', (req,res) => {
  const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  res.json(cats);
});

// GET product by id
app.get('/api/products/:id', (req,res) => {
  const idx = findIndex(req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  res.json(products[idx]);
});

// POST purchase (checkout) - any logged-in customer can call (frontend handles customer auth)
app.post('/api/purchase', (req, res) => {
  const { customer, items, total } = req.body || {};
  if (!customer || !customer.email || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order payload' });
  }
  const order = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    customer,
    items,
    total: Number(total || items.reduce((s,i)=> s + (i.price||0)*(i.qty||1), 0)),
    status: 'received'
  };
  // GET /api/orders?email=customer@example.com
// Returns orders for a given customer email (simple public lookup)
app.get('/api/orders', (req, res) => {
  const email = (req.query.email || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'email query required' });
  const userOrders = orders.filter(o => o.customer && String(o.customer.email || '').toLowerCase() === email);
  res.json({ total: userOrders.length, results: userOrders });
});

  orders.unshift(order);
  persistOrders();
  broadcast('order-placed', order);
  res.status(201).json({ success: true, order });
});

// --- Admin login ---
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid password' });
  const token = issueAdminToken();
  res.json({ token: token.token, expires: token.expires });
});

// --- Admin protected product routes (create/update/delete) ---
app.post('/api/products', adminAuthMiddleware, (req, res) => {
  const body = req.body || {};
  if (!body.title) return res.status(400).json({ error: 'title required' });
  const product = {
    id: String(Date.now()),
    title: body.title,
    description: body.description || '',
    category: body.category || 'Uncategorized',
    price: body.price !== undefined ? Number(body.price) : 0,
    image: body.image || 'http://localhost:4000/static/placeholder.png',
    addedAt: new Date().toISOString()
  };
  products.unshift(product);
  persistProducts();
  broadcast('product-added', product);
  res.status(201).json(product);
});

app.put('/api/products/:id', adminAuthMiddleware, (req,res) => {
  const id = req.params.id;
  const idx = findIndex(id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const body = req.body || {};
  const updated = {
    ...products[idx],
    title: body.title !== undefined ? body.title : products[idx].title,
    description: body.description !== undefined ? body.description : products[idx].description,
    category: body.category !== undefined ? body.category : products[idx].category,
    price: body.price !== undefined ? Number(body.price) : products[idx].price,
    image: body.image !== undefined ? body.image : products[idx].image
  };
  products[idx] = updated;
  persistProducts();
  broadcast('product-updated', updated);
  res.json(updated);
});

app.delete('/api/products/:id', adminAuthMiddleware, (req,res) => {
  const id = req.params.id;
  const idx = findIndex(id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const removed = products.splice(idx,1)[0];
  persistProducts();
  broadcast('product-deleted', removed);
  res.json({ success: true });
});

// Admin: list orders (protected)
app.get('/api/admin/orders', adminAuthMiddleware, (req,res) => {
  res.json({ total: orders.length, results: orders });
});

// health
app.get('/api/health', (req,res) => res.json({ ok:true }));

// start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
