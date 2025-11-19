# E-Commerce Product Catalog

A full-stack interactive product catalog built with React (Vite) and Node.js + Express.  
Includes real-time updates, customer login, cart/checkout, and an admin panel.

---

## Features

### Product Catalog
- Real-time product listing
- Search, filter, and sort
- Product images, descriptions, and categories

### Shopping Cart
- Add/remove items
- Update quantity
- Cart stored in localStorage

### Customer Login
- Simple demo login (local only)
- Saves customer info for orders
- View past placed orders

### Checkout
- Calculates total price
- Saves order to backend (orders.json)
- Shows “Order placed successfully” message

### Admin Panel
- Login using password: admin
- Add new products
- Products instantly update via SSE

### Live Updates (SSE)
When a new product is added:
- Backend broadcasts an SSE event
- Frontend updates immediately without refreshing

---

## Project Structure

ecommerce-catalog/
- backend/
  - server.js
  - products.json (local-only, ignored in Git)
  - orders.json (local-only, ignored in Git)
  - products.sample.json
  - package.json
- frontend/
  - src/
    - App.jsx
    - Admin.jsx
    - Cart.jsx
    - CustomerLogin.jsx
    - styles.css
  - index.html
  - package.json
- README.md
- .gitignore

---

## Tech Stack

Frontend:
- React (Vite)
- JavaScript (ES6+)
- CSS (Flexbox/Grid)
- LocalStorage

Backend:
- Node.js
- Express.js
- JSON file storage
- Server-Sent Events (SSE)

---

## How to Run the Project Locally

### 1. Start the Backend
cd backend  
npm install

If products.json doesn’t exist:
copy products.sample.json products.json

Set admin password (Windows):
set ADMIN_PASSWORD=adminpass

Start server:
node server.js

Backend runs at:
http://localhost:4000

---

### 2. Start the Frontend
cd frontend  
npm install  
npm run dev

Frontend runs at:
http://localhost:5173

---

## Admin Login
Password: adminpass

---

## How to Test

Product Catalog:
- Open frontend
- Products appear
- Try search/filter

Cart:
- Add an item
- Go to Cart page
- Update quantity

Customer Login:
- Enter name, email, password
- Proceed to checkout

Checkout:
- See total
- Confirm purchase
- “Order placed successfully” appears

Admin Panel:
- Login with admin password
- Add a product
- Product appears instantly (SSE)

---

## Future Improvements
- Move from JSON files to real database
- JWT authentication
- Image upload system
- More advanced admin UI
- Better design and styling
- Unit tests

---

## Author
SAI NAGA PRAMOD PARIMISETTI  
GitHub: https://github.com/sainagapramod
