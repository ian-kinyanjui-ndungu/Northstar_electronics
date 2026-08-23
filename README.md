# Northstar Electronics

> A Support Deflection MVP that lets customers self-serve their most common support needs — built for Northstar Retail Co. as part of the PLP Africa Northstar Sprint.

---

## Live Demo

**<a href="https://northstarelectronics-production.up.railway.app/" target="_blank" rel="noopener noreferrer">https://northstarelectronics-production.up.railway.app/</a>**

Hosted on <a href="https://railway.app" target="_blank" rel="noopener noreferrer">Railway</a>. No installation required — the demo environment is fully seeded with products, orders, and test accounts (see [Getting Started](#getting-started-local-setup) for credentials).

---

## The Problem

Northstar Retail Co. is a mid-size e-commerce company whose customer support team was overwhelmed by a steady stream of repetitive, low-complexity tickets. Analysis identified three recurring categories:

| Category | Description |
|---|---|
| **Order Status** | "Where is my order?" / "Has my order shipped?" |
| **Stock Availability** | "Is this item back in stock?" |
| **Returns & Refunds** | "How do I return this?" / "Is my order eligible for a refund?" |

Because these questions follow predictable, rule-based patterns, they are strong candidates for self-service deflection — freeing the support team to focus on issues that genuinely require human attention.

This MVP proves that a well-designed self-serve platform can handle this load without a support agent ever getting involved.

---

## What We Solved

This MVP directly addresses **two of the three ticket categories** (order status and stock availability), with returns/refunds included as an additional implemented feature:

- **Order Status** — Logged-in customers can view a full order history with live status tracking (Processing → Shipped → Out for Delivery → Delivered) directly from their dashboard. No support ticket needed.

- **Stock Availability** — Every product page displays a real-time stock count sourced from the database. Customers can see at a glance whether an item is available, and checkout is actively blocked at both the frontend validation step and the backend transaction level if stock is insufficient — preventing both frustration and overselling.

- **Returns & Refunds** — Customers can submit a return request for any delivered order directly from their dashboard. The system enforces a **14-day return window** automatically: if the order was placed more than 14 days ago, the request is rejected with a clear explanation. An admin can then review, approve, reject, or mark the return as refunded.

This is implemented as a **full e-commerce platform**, not a narrow chatbot. The deflection happens naturally because the platform already gives customers exactly what they would have emailed support to ask about.

---

## How It Works (User Flow)

```
Browse Products → Add to Cart → Log In / Sign Up → Checkout → Order Confirmed → Dashboard
```

**Step by step:**

1. **Browse** — Customers land on the storefront and can browse all products by category (Laptops, Desktops, Monitors, Accessories), filter by price, or search by name. Each product page shows the item description, price, and live stock count.

2. **Add to Cart** — Items are added to a cart stored in the browser (localStorage). No login required at this stage.

3. **Log In or Sign Up** — Proceeding to checkout requires authentication. New customers register with name, email, and password; returning customers log in. Authentication uses **JWT** tokens (7-day expiry) via a custom-built auth layer with bcrypt password hashing.

4. **Checkout (stock-gated)** — At the checkout page, cart items are validated against live stock before the order is submitted. If any item is out of stock or the requested quantity exceeds available inventory, the checkout is blocked with a clear message identifying the specific product and available quantity. The same check is enforced again at the database transaction level on the backend, with a row lock, preventing race conditions.

5. **Order Confirmed** — On success, the order is created with status `Processing`, stock is decremented, and the customer is redirected to an order confirmation page showing their order details.

6. **Order Status Dashboard** — The customer's dashboard (`/dashboard`) lists all past orders with their current status and a visual tracking timeline. Order statuses are: `Processing` → `Shipped` → `Out for Delivery` → `Delivered` → `Cancelled`.

7. **Check Stock Availability** — Any visitor (logged in or not) can view real-time stock counts on any product page, addressing the stock availability ticket category directly.

8. **Request a Return** — From the dashboard, a customer can request a return on any order with status `Delivered`. The backend enforces the 14-day window: requests outside this window are rejected automatically with a message showing how many days ago the order was placed. Customers can also check the return status of submitted requests from the same view.

---

## Admin Features

Admins access a protected panel at `/admin` (requires a user account with `role: admin`). The following operations are protected by JWT-based role-based access control — any request without a valid admin token returns `403 Forbidden`.

| Feature | What it does |
|---|---|
| **View all orders** | Full list of every customer order with customer info, line items, and status |
| **Update order status** | Advance an order through the lifecycle: `Processing → Shipped → Out for Delivery → Delivered → Cancelled` |
| **View return requests** | See all return requests across all customers, including reason and order details |
| **Process return requests** | Approve, reject, or mark a return as `Refunded`; add internal admin notes |
| **Add / edit / delete products** | Create new platform products, update name/price/stock/category/image, or remove products |
| **Seller management** | Approve or reject third-party seller accounts; review and approve/reject seller-submitted products before they appear on the storefront |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express |
| **Database** | TiDB (MySQL-compatible, via Sequelize ORM) |
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Authentication** | Custom JWT implementation (`jsonwebtoken` + `bcryptjs`) |
| **Session handling** | `express-session` |
| **File uploads** | `multer` |
| **Hosting** | Railway |

> **Why TiDB?** TiDB is a MySQL-compatible distributed database. The project connects to it using `mysql2` and Sequelize, so all standard MySQL queries work as expected. SSL is required when connecting to TiDB Cloud; this is configurable via the `DB_SSL` environment variable.

---

## Project Structure

```
northstar-electronics/
├── server.js                  # Express app entry point — routes, middleware, startup
├── package.json
├── .env.example               # Environment variable template
│
├── src/
│   ├── database/
│   │   ├── connection.js      # Sequelize + TiDB connection
│   │   ├── migrate.js         # Safe column-level migrations (TiDB-compatible)
│   │   └── seed.js            # Demo data: users, products, orders, returns
│   │
│   ├── middleware/
│   │   └── auth.js            # JWT generation, `authenticate` and `requireAdmin` middleware
│   │
│   ├── models/                # Sequelize models (User, Product, Order, OrderItem, Return, Seller, …)
│   │
│   └── routes/                # Express route handlers
│       ├── auth.js            # POST /signup, POST /login, GET /me
│       ├── products.js        # Product listing, search, admin CRUD
│       ├── orders.js          # Order creation (checkout), order history, order detail
│       ├── returns.js         # Return request creation, user's return list
│       ├── cart.js            # Cart stock validation endpoint
│       ├── admin.js           # Admin: orders, returns, products
│       ├── sellers.js         # Seller registration, product management, admin approval
│       ├── wishlist.js        # Wishlist management
│       ├── reviews.js         # Product reviews
│       ├── notifications.js   # In-app notifications
│       └── cms.js             # CMS/banner content routes
│
└── public/                    # Static frontend (served directly by Express)
    ├── index.html             # Homepage / storefront
    ├── products.html          # Product catalogue
    ├── product-detail.html    # Single product page
    ├── cart.html              # Shopping cart
    ├── checkout.html          # Checkout (auth-gated, stock-gated)
    ├── order-confirmation.html
    ├── dashboard.html         # Customer dashboard: orders, returns
    ├── admin.html             # Admin panel
    ├── login.html / signup.html
    ├── wishlist.html
    ├── css/style.css          # Global stylesheet
    ├── js/app.js              # Shared frontend JavaScript
    ├── images/                # Product SVG assets and logo
    ├── seller/                # Seller portal pages
    └── support/               # Help, FAQ, return policy, terms, privacy, etc.
```

---

## Getting Started (Local Setup)

### Prerequisites

- <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">Node.js</a> v18 or later
- A TiDB instance (<a href="https://tidbcloud.com/" target="_blank" rel="noopener noreferrer">TiDB Cloud free tier</a> works) **or** a local MySQL-compatible database (MySQL 8 / MariaDB)

### 1. Clone the repository

```bash
https://github.com/ian-kinyanjui-ndungu/Northstar_electronics.git
cd Northstar_electronics
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your database credentials:

```env
PORT=3000
JWT_SECRET=your_strong_secret_here
SESSION_SECRET=your_session_secret_here

DB_HOST=your-tidb-or-mysql-host
DB_PORT=4000          # TiDB default; use 3306 for MySQL
DB_NAME=northstar
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SSL=false          # Set to true for TiDB Cloud
```

### 4. Run migrations (first time only, or after model changes)

```bash
npm run migrate
```

This safely adds any new columns to existing tables without destructive changes.

### 5. Seed demo data

```bash
npm run seed
```

This creates the database tables (using `force: true` — **it will drop and recreate all tables**), then populates them with:

- 14 products across four categories (Laptops, Desktops, Monitors, Accessories)
- 3 user accounts
- 4 sample orders in various statuses
- 1 return request

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@northstar.com` | `admin123` |
| Customer | `alex@example.com` | `customer123` |
| Customer | `sam@example.com` | `demo123` |

### 6. Start the server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)**.

---

## Team

This project was built as **Group 17's** submission for the **PLP Africa "1Million Dev" Software Engineering Evaluation Track — Northstar Sprint**.

| Name | Role |
|---|---|
| **Meshack Peter** | Project Lead |
| **Francis Kienji** | Research Coordinator |
| **Ian Kinyanjui** | Product / Flow Developer |
| **Hellen Atsunga** | Data / QA Analyst |

---

## Known Limitations

This is an MVP built to demonstrate the support deflection concept. The following are known simplifications:

- **No real payment gateway** — The checkout flow collects a shipping address and submits the order, but there is no payment processing integration. Orders are created immediately on submission.
- **Seeded / mock inventory** — Product stock is pre-populated via the seed script. There is no live inventory sync with an external warehouse or ERP system.
- **Cart is client-side only** — The cart is stored in the browser's `localStorage`. It does not persist across devices or browser sessions, and there is no server-side cart model.
- **Email notifications not implemented** — No transactional emails are sent on order creation, status update, or return status change.
- **Seller portal is partially implemented** — The seller registration, product submission, and admin approval flow is in place, but the wallet and analytics features visible in the seller portal UI are not fully wired to backend business logic.
- **No automated tests** — The codebase does not currently include a test suite. Validation was performed manually.
