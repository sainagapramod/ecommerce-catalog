import React, { useEffect, useState } from "react";

/**
 * Cart.jsx
 *
 * - Reads/writes cart from localStorage (key: "cart")
 * - Listens for "cart-updated" events to refresh live
 * - Allows qty change, remove, clear
 * - Performs checkout by POSTing to /api/purchase (backend)
 *
 * Props:
 *  - onOrderPlaced(order)  optional callback invoked after successful purchase
 */

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch (e) {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export default function Cart({ onOrderPlaced }) {
  const [items, setItems] = useState(readCart());
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // refresh from storage on mount
    setItems(readCart());

    // listen for global updates (dispatched by addToCartItem)
    const handler = (e) => {
      setItems(readCart());
    };
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  useEffect(() => {
    // keep local state in sync with localStorage changes in other tabs
    const onStorage = (ev) => {
      if (ev.key === "cart") setItems(readCart());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function changeQty(id, delta) {
    const next = items.map((it) =>
      it.id === id ? { ...it, qty: Math.max(1, (it.qty || 1) + delta) } : it
    );
    saveCart(next);
    setItems(next);
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart: next } }));
    if (window.updateCartBadge) window.updateCartBadge();
  }

  function removeItem(id) {
    const next = items.filter((it) => it.id !== id);
    saveCart(next);
    setItems(next);
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart: next } }));
    if (window.updateCartBadge) window.updateCartBadge();
  }

  function clearCart() {
    saveCart([]);
    setItems([]);
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart: [] } }));
    if (window.updateCartBadge) window.updateCartBadge();
    setMsg("Cart cleared");
    setTimeout(() => setMsg(""), 2000);
  }

  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);

  async function checkout() {
    const stored = JSON.parse(localStorage.getItem("customer") || "null");
    if (!stored) {
      alert("Please sign in as a customer before checkout");
      return;
    }
    if (items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const payload = { customer: stored, items, total };
      const res = await fetch("http://localhost:4000/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      // success: clear cart, notify parent
      clearCart();
      window.dispatchEvent(new CustomEvent('order-placed', { detail: data.order }));
      setMsg("Order placed — ID: " + (data.order && data.order.id));
      if (typeof onOrderPlaced === "function") onOrderPlaced(data.order);
    } catch (err) {
      setMsg("Error: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 4000);
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: 10, background: "#fff", borderRadius: 10, marginBottom: 12 }}>
        <h4 style={{ marginTop: 0 }}>Cart</h4>
        <div style={{ color: "#666" }}>Your cart is empty</div>
        {msg && <div style={{ marginTop: 8, color: "green" }}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ padding: 10, background: "#fff", borderRadius: 10, marginBottom: 12 }}>
      <h4 style={{ marginTop: 0 }}>Cart</h4>

      {items.map((it) => (
        <div key={it.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ maxWidth: "70%" }}>
            <div style={{ fontWeight: 700 }}>{it.title}</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              ${Number(it.price || 0).toFixed(2)} • qty: {it.qty || 1}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => changeQty(it.id, -1)} style={{ padding: "4px 8px" }}>
                -
              </button>
              <button onClick={() => changeQty(it.id, 1)} style={{ padding: "4px 8px" }}>
                +
              </button>
            </div>
            <button onClick={() => removeItem(it.id)} style={{ padding: "6px 10px", background: "#f97373", color: "#fff", border: "none", borderRadius: 6 }}>
              Remove
            </button>
          </div>
        </div>
      ))}

      <div style={{ fontWeight: 700, marginTop: 6 }}>Total: ${total.toFixed(2)}</div>

      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button onClick={checkout} disabled={loading} style={{ padding: "8px 12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 6 }}>
          {loading ? "Placing..." : "Place order"}
        </button>
        <button onClick={clearCart} style={{ padding: "8px 12px" }}>
          Clear
        </button>
      </div>

      {msg && <div style={{ marginTop: 8, color: msg.startsWith("Error") ? "crimson" : "green" }}>{msg}</div>}
    </div>
  );
}
