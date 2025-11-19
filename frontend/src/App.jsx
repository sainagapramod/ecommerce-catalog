import React, { useEffect, useState } from "react";
import Admin from "./Admin";
import CustomerLogin from "./CustomerLogin";
import Cart from "./Cart";

// =======================
// CART HELPERS
// =======================
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
function addToCartItem(item) {
  const cart = readCart();
  const existing = cart.find((c) => String(c.id) === String(item.id));
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id: item.id, title: item.title, price: item.price, qty: 1 });
  }
  saveCart(cart);

  // update global badge immediately
  if (window.updateCartBadge) window.updateCartBadge();

  return cart;
}
function cartCount() {
  return readCart().reduce((s, i) => s + (i.qty || 1), 0);
}

// =======================
// MAIN APP COMPONENT
// =======================
export default function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [categories, setCategories] = useState([]);

  // fetch categories
  async function fetchCategories() {
    const res = await fetch("http://localhost:4000/api/categories");
    const data = await res.json();
    setCategories(data);
  }

  // fetch products
  async function loadProducts() {
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (category) params.append("category", category);
    if (sort) params.append("sort", sort);

    const res = await fetch(
      "http://localhost:4000/api/products?" + params.toString()
    );
    const data = await res.json();
    setProducts(data.results);
  }

  // on mount
  useEffect(() => {
    fetchCategories();
    loadProducts();
    if (window.updateCartBadge) window.updateCartBadge();
  }, []);

  // update when filters change
  useEffect(() => {
    loadProducts();
  }, [query, category, sort]);

  // =======================
  // SSE LISTENER
  // =======================
  useEffect(() => {
    const es = new EventSource("http://localhost:4000/api/stream");

    es.addEventListener("product-added", (e) => {
      console.log("SSE product-added:", JSON.parse(e.data));
      loadProducts();
    });

    es.addEventListener("product-updated", (e) => {
      console.log("SSE product-updated:", JSON.parse(e.data));
      loadProducts();
    });

    es.addEventListener("product-deleted", (e) => {
      console.log("SSE product-deleted:", JSON.parse(e.data));
      loadProducts();
    });

    return () => {
      es.close();
    };
  }, []);

  // =======================
  // GLOBAL BADGE UPDATE
  // =======================
  window.updateCartBadge = () => {
    const el = document.getElementById("cart-badge");
    if (el) el.textContent = cartCount();
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Product Catalog</h1>
          <p className="subtitle">Search • Filter • Sort • Add to Cart • Purchase</p>
        </div>

        {/* CART BADGE */}
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => {
            const cartEl = document.querySelector("#cart-panel");
            if (cartEl)
              cartEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H5.4"
              stroke="#0f172a"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20" r="1" fill="#0f172a" />
            <circle cx="18" cy="20" r="1" fill="#0f172a" />
          </svg>

          <span
            id="cart-badge"
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: "#ef4444",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              padding: "0 5px",
            }}
          >
            {cartCount()}
          </span>
        </div>
      </header>

      {/* LAYOUT */}
      <main className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <Admin onAdded={loadProducts} />

          <CustomerLogin onLogin={loadProducts} />

          <div id="cart-panel">
            <Cart onOrderPlaced={loadProducts} />
          </div>

          {/* FILTERS */}
          <div className="control">
            <label>Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>

          <div className="control">
            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">None</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <section className="grid">
          {products.map((p) => (
            <article key={p.id} className="card">
              <img src={p.image} alt={p.title} className="card-image" />
              <h3 className="card-title">{p.title}</h3>
              <div className="card-category">{p.category}</div>
              <div className="card-price">${(p.price || 0).toFixed(2)}</div>
              <p className="card-desc">{p.description}</p>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {/* ADD TO CART BUTTON */}
                <button
                  onClick={() => {
                    addToCartItem(p);
                    alert("Added to cart");
                  }}
                  style={{
                    padding: "8px 10px",
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                  }}
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
