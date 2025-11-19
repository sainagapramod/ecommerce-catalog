import React, { useEffect, useState } from "react";

/**
 * CustomerLogin.jsx
 * - Sign in / sign out customer (stores in localStorage)
 * - Shows "Placed orders" for signed-in customer by calling /api/orders?email=...
 * - Listens for 'order-placed' event to refresh list immediately after checkout
 *
 * Props:
 *  - onLogin(customer) optional callback
 */

export default function CustomerLogin({ onLogin }) {
  const [customer, setCustomer] = useState(() => {
    try { return JSON.parse(localStorage.getItem("customer") || "null"); }
    catch { return null; }
  });
  const [email, setEmail] = useState(customer ? customer.email : "");
  const [name, setName] = useState(customer ? customer.name : "");
  const [password, setPassword] = useState(customer ? customer.password : "");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (customer) fetchOrders(customer.email);
    const handler = () => {
      // when an order is placed (Cart will dispatch this event), refresh orders
      if (customer) fetchOrders(customer.email);
    };
    window.addEventListener("order-placed", handler);
    return () => window.removeEventListener("order-placed", handler);
  }, [customer]);

  async function fetchOrders(emailToFetch) {
    if (!emailToFetch) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`http://localhost:4000/api/orders?email=${encodeURIComponent(emailToFetch)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch orders");
      setOrders(data.results || []);
    } catch (err) {
      console.error("Fetch orders error", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("customer");
    setCustomer(null);
    setEmail("");
    setName("");
    setPassword("");
    if (typeof onLogin === "function") onLogin(null);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!email) { alert("Please enter your email"); return; }
    if (!password) { alert("Please enter a password"); return; }

    const c = { email, name: name || email.split("@")[0], password };
    localStorage.setItem("customer", JSON.stringify(c));
    setCustomer(c);
    if (typeof onLogin === "function") onLogin(c);
    fetchOrders(c.email);
    setStatus("Signed in");
    setTimeout(() => setStatus(""), 2000);
  }

  // Signed-in UI with placed orders
  if (customer) {
    return (
      <div style={{ padding: 10, background: "#fff", borderRadius: 10, marginBottom: 12 }}>
        <h4 style={{ marginTop: 0 }}>Customer</h4>

        <div style={{ fontWeight: 700 }}>{customer.name}</div>
        <div style={{ color: "#666", fontSize: 13 }}>{customer.email}</div>

        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={handleLogout} style={{ padding: "8px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6 }}>Sign Out</button>
        </div>

        <hr style={{ margin: "12px 0" }} />

        <h5 style={{ margin: "6px 0" }}>Placed orders</h5>

        {loadingOrders ? (
          <div style={{ color: "#666" }}>Loading orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ color: "#666" }}>No orders yet</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {orders.map((o) => (
              <div key={o.id} style={{ padding: 8, borderRadius: 8, background: "#f8fafc", border: "1px solid #e6eef6" }}>
                <div style={{ fontWeight: 700 }}>Order #{o.id}</div>
                <div style={{ color: "#666", fontSize: 12 }}>{new Date(o.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: 6 }}>
                  {o.items && o.items.map((it, i) => (
                    <div key={i} style={{ fontSize: 13 }}>
                      {it.title} — qty: {it.qty || 1} — ${(Number(it.price || 0) * (it.qty || 1)).toFixed(2)}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontWeight: 700 }}>Total: ${Number(o.total || 0).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: "#0f172a", marginTop: 6 }}>{o.status || "received"}</div>
              </div>
            ))}
          </div>
        )}

        {status && <div style={{ marginTop: 8, color: "green" }}>{status}</div>}
      </div>
    );
  }

  // Not signed-in: show login form
  return (
    <form onSubmit={handleLogin} style={{ padding: 10, background: "#fff", borderRadius: 10, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Customer Login</h4>

      <input
        type="text"
        placeholder="Full Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <input
        type="email"
        placeholder="Email Address"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        required
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <button type="submit" style={{ padding: "8px 12px", background: "#0f172a", border: "none", color: "#fff", borderRadius: 6 }}>
        Sign In
      </button>
    </form>
  );
}
