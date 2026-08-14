# Northstar Electronics

A full-stack e-commerce application for a modern electronics store. Built as a working MVP covering the complete customer flow: browse → cart → checkout → order tracking → returns.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| Database | TiDB (MySQL-compatible) via Sequelize ORM |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Auth | JWT (JSON Web Tokens) with RBAC |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your TiDB credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
JWT_SECRET=your_secret_here
SESSION_SECRET=your_session_secret_here

# TiDB Cloud or local TiDB
DB_HOST=your-tidb-host
DB_PORT=4000
DB_NAME=northstar
DB_USER=your-user
DB_PASSWORD=your-password
DB_SSL=true   # set to true for TiDB Cloud
```

**For local TiDB (no SSL):** Set `DB_SSL=false` and use port `4000`.  
**For TiDB Cloud:** Set `DB_SSL=true` and use your Cloud connection string values.

### 3. Create the database

```sql
CREATE DATABASE northstar;
```

### 4. Seed the database

```bash
npm run seed
```

This creates all tables and inserts:
- 14 realistic tech products across 4 categories
- 3 demo user accounts
- 4 sample orders in different statuses
- 1 sample return request

### 5. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Open: **http://localhost:3000**

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@northstar.com` | `admin123` |
| Customer | `alex@example.com` | `customer123` |
| Customer | `sam@example.com` | `demo123` |

---

## Application Pages

| URL | Description |
|---|---|
| `/` | Homepage — hero, featured products, categories |
| `/products` | Product listing with filters (category, price, stock) |
| `/product/:id` | Product detail — description, stock status, add to cart |
| `/cart` | Shopping cart — line items, quantity, subtotal |
| `/checkout` | Checkout — shipping address, stock validation, place order |
| `/order-confirmation` | Post-checkout confirmation with order summary |
| `/login` | Sign in page |
| `/signup` | Create account page |
| `/dashboard` | Customer dashboard — orders, returns, stock check |
| `/admin` | Admin panel — products, orders, returns management |

---

## API Endpoints

### Auth
```
POST /api/auth/signup      Register new user
POST /api/auth/login       Sign in, receive JWT
GET  /api/auth/me          Get current user (requires auth)
```

### Products
```
GET    /api/products               List products (filters: category, minPrice, maxPrice, search, featured)
GET    /api/products/:id           Get single product
POST   /api/products               Create product (admin only)
PUT    /api/products/:id           Update product (admin only)
DELETE /api/products/:id           Delete product (admin only)
```

### Orders
```
GET  /api/orders           List current user's orders (auth required)
GET  /api/orders/:id       Get order detail (auth required)
POST /api/orders           Create order / checkout (auth required, stock validated)
```

### Returns
```
GET  /api/returns          List current user's returns (auth required)
POST /api/returns          Submit return request (auth required, 14-day window enforced)
```

### Cart
```
POST /api/cart/validate    Validate cart items against current stock
```

### Admin (admin role required)
```
GET  /api/admin/products              List all products
GET  /api/admin/orders                List all orders with customer info
PUT  /api/admin/orders/:id/status     Update order status
GET  /api/admin/returns               List all return requests
PUT  /api/admin/returns/:id           Update return request status
```

---

## Demo Flow

1. **Browse** → Visit `/products`, filter by category or price
2. **Add to cart** → Click "Add to Cart" on any in-stock product
3. **Login** → Cart persists; checkout redirects to `/login` if not authenticated
4. **Checkout** → Fill shipping, place order (stock validated server-side with transaction lock)
5. **Confirmation** → Order confirmation page with order details
6. **Track** → `/dashboard` shows order status (Processing → Shipped → Out for Delivery → Delivered)
7. **Return** → On Delivered orders within 14 days, "Request Return" button appears
8. **Admin** → `/admin` to manage products, update order statuses, approve/reject returns

---

## Business Rules

- **Return window:** 14 days from order date — enforced server-side
- **Checkout stock check:** Uses a database transaction with row-level lock (`SELECT ... FOR UPDATE`) to prevent overselling
- **Role-based access:** All `/api/admin/*` routes require `admin` role in JWT payload
- **Cart storage:** Client-side only (localStorage) — no server session needed for browsing

---

## Project Structure

```
northstar/
├── server.js                    # Express entry point
├── .env.example                 # Environment template
├── src/
│   ├── database/
│   │   ├── connection.js        # Sequelize + TiDB connection
│   │   └── seed.js              # Database seeding script
│   ├── models/
│   │   ├── index.js             # Model associations
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   └── Return.js
│   ├── middleware/
│   │   └── auth.js              # JWT + RBAC middleware
│   └── routes/
│       ├── auth.js
│       ├── products.js
│       ├── orders.js
│       ├── returns.js
│       ├── cart.js
│       └── admin.js
└── public/
    ├── index.html               # Homepage
    ├── products.html            # Product listing
    ├── product-detail.html      # Product detail
    ├── cart.html                # Shopping cart
    ├── checkout.html            # Checkout
    ├── order-confirmation.html  # Post-checkout
    ├── login.html               # Sign in
    ├── signup.html              # Create account
    ├── dashboard.html           # Customer dashboard
    ├── admin.html               # Admin panel
    ├── 404.html
    ├── css/
    │   └── style.css            # Full design system
    ├── js/
    │   └── app.js               # Shared utilities (Auth, Cart, Toast, API)
    └── images/products/         # SVG product placeholder images
```
