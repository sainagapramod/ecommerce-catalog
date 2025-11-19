const fs = require('fs');
const path = require('path');

const ORDERS = path.join(__dirname, 'orders.json');
const OUT = path.join(__dirname, 'orders.sanitized.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS, 'utf8'));
  } catch (e) {
    console.error('Failed to read orders.json:', e.message);
    process.exit(1);
  }
}

function sanitize(orders) {
  return orders.map(o => {
    const copy = { ...o };
    if (copy.customer) {
      const c = { ...copy.customer };
      if (c.password) delete c.password;
      copy.customer = c;
    }
    return copy;
  });
}

const orders = load();
const cleaned = sanitize(orders);
fs.writeFileSync(OUT, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Wrote sanitized orders to', OUT)