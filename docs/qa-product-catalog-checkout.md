# QA Pass Report — Product Catalog & Checkout Flow

**Document:** HELLEN-02  
**Author:** Hellen Atsunga (QA / Data Analyst)  
**Sprint:** PLP Africa Northstar Sprint — Group 17  
**Date:** 2025-07-09  
**Environment:** Seeded demo database (`npm run seed`), Railway deployment + local verification against source code  
**Tester notes:** All `Pass` verdicts are grounded in the actual source code (routes, models, frontend scripts). All `Fail` verdicts cite the specific file and line where the defect was found.

---

## Summary

| Check | Result |
|---|---|
| Product listing renders correctly | ✅ Pass |
| Category and price filters work | ✅ Pass |
| Product detail page shows name, price, description | ✅ Pass |
| Product detail page shows accurate stock status | ✅ Pass |
| Low-stock warning shown when stock < 5 | ✅ Pass |
| Add to Cart works correctly | ✅ Pass |
| Cart item quantity update works | ✅ Pass |
| Cart item removal works | ✅ Pass |
| Cart count badge updates in navbar | ✅ Pass |
| Checkout redirects unauthenticated users to login | ✅ Pass |
| Checkout pre-fills user's name from session | ✅ Pass |
| Checkout blocks if cart contains out-of-stock item | ✅ Pass |
| Checkout backend enforces stock with row-level lock | ✅ Pass |
| Successful checkout decrements stock | ✅ Pass |
| Successful checkout creates order with status Processing | ✅ Pass |
| Cart is cleared after successful checkout | ✅ Pass |
| `GET /api/products/:id` skips approval-status filter | ⚠️ Bug — BUG-01 |
| Seller Portal link visible to all logged-in users | ⚠️ Bug — BUG-02 |

**Total: 16 Pass · 2 Bug**

---

## Detailed Results

---

### Check 1 — Product listing renders correctly

**Endpoint / Component:** `GET /api/products` → `public/products.html`

**Method:** Source code review + API response inspection  
**Result:** ✅ **Pass**

`GET /api/products` queries only rows where `approvalStatus = 'Approved'`. All 14 seeded products have `approvalStatus` defaulting to `'Approved'`. The response contains `{ count: 14, rows: [...] }`. Products are ordered: `featured DESC, createdAt DESC`, so the 8 featured products appear first.

---

### Check 2 — Category and price filters work

**Endpoint / Component:** `GET /api/products?category=Laptops`, `GET /api/products?minPrice=100&maxPrice=500`

**Method:** Source code review (`src/routes/products.js` lines 14–22)  
**Result:** ✅ **Pass**

`category` filter maps directly to `where.category = category` using Sequelize exact match. `minPrice` / `maxPrice` use `Op.gte` / `Op.lte` on the `price` column. `search` uses `Op.like` with `%term%` wildcard. All three query parameters are correctly handled.

---

### Check 3 — Product detail page shows name, price, description

**Endpoint / Component:** `GET /api/products/:id` → `public/product-detail.html`

**Method:** Source code review (`public/product-detail.html` lines 110–172)  
**Result:** ✅ **Pass**

`loadProduct()` fetches `/api/products/${productId}`, then injects `p.name`, `formatCurrency(p.price)`, and `p.description` into the DOM. Falls back to "No description available." if `description` is null.

---

### Check 4 — Product detail page shows accurate stock status

**Endpoint / Component:** `GET /api/products/:id` → `public/product-detail.html` lines 117–139

**Method:** Source code review  
**Result:** ✅ **Pass**

`const inStock = p.stock > 0`. When `true`, the badge shows "● In Stock". When `false`, the badge shows "● Out of Stock". The `Add to Cart` button and quantity control are only rendered inside the `${inStock ? ...}` branch, so they are absent for out-of-stock products.

---

### Check 5 — Low-stock warning shows when stock < 5

**Endpoint / Component:** `public/product-detail.html` line 139

**Method:** Source code review  
**Result:** ✅ **Pass**

`${inStock ? \`● In Stock${p.stock < 5 ? \` — Only ${p.stock} left!\` : ''}\` : '● Out of Stock'}` — correctly appends a low-stock warning for products with 1–4 units. Seeded products with low stock: TowerMax Elite 9 (3), Northstar WorkStation Pro (5 — boundary, no warning), ProColor 24" OLED (7).

---

### Check 6 — Add to Cart works correctly

**Endpoint / Component:** `Cart.add()` in `public/js/app.js` lines 23–27

**Method:** Source code review  
**Result:** ✅ **Pass**

`Cart.add(product, qty)` reads the current cart from `localStorage`, finds an existing entry by `productId`, and either increments `quantity` or pushes a new item. `Cart.save()` writes back to `localStorage` and updates the navbar badge. No server call is made at this point — this is intentional (cart is client-side).

---

### Check 7 — Cart item quantity update works

**Endpoint / Component:** `Cart.updateQty()` in `public/js/app.js` line 33; `public/cart.html` `adjustQty()` / `setQty()`

**Method:** Source code review  
**Result:** ✅ **Pass**

Both the `−` / `+` buttons (`adjustQty`) and direct input changes (`setQty`) update `localStorage` and re-render the cart. Setting quantity to 0 triggers `Cart.remove()`.

---

### Check 8 — Cart item removal works

**Endpoint / Component:** `Cart.remove()` in `public/js/app.js` line 29; `public/cart.html` `removeItem()`

**Method:** Source code review  
**Result:** ✅ **Pass**

`Cart.remove(productId)` filters the stored array and saves. `removeItem()` additionally shows a toast notification "Item removed from cart". Cart badge and summary recalculate immediately.

---

### Check 9 — Cart count badge updates in navbar

**Endpoint / Component:** `Cart.updateBadge()` in `public/js/app.js` lines 39–43

**Method:** Source code review  
**Result:** ✅ **Pass**

Every `Cart.save()` call triggers `Cart.updateBadge()`. The badge queries all `.cart-badge` elements and sets `textContent` to `Cart.count()`, hiding the badge (`display:none`) when count is 0.

---

### Check 10 — Checkout redirects unauthenticated users to login

**Endpoint / Component:** `public/checkout.html` lines 90–95; `public/cart.html` `goToCheckout()` lines 146–151

**Method:** Source code review  
**Result:** ✅ **Pass**

Two layers of enforcement:
1. `cart.html` `goToCheckout()` checks `Auth.isLoggedIn()` before navigating. If false, redirects to `/login?redirect=/checkout`.
2. `checkout.html` itself calls `requireAuth()` in `DOMContentLoaded`, which redirects to `/login?redirect=/checkout` if no token is present. The main content (`#authGate`) starts as `display:none` and is only shown if auth passes.

---

### Check 11 — Checkout pre-fills user's name from session

**Endpoint / Component:** `public/checkout.html` lines 181–187

**Method:** Source code review  
**Result:** ✅ **Pass**

After the auth check, `Auth.getUser()` is called and `user.name` is written to `#shipName`. This is a convenience UX enhancement only — the shipping address is still validated for completeness before submission.

---

### Check 12 — Checkout blocks if cart contains an out-of-stock item

**Endpoint / Component:** `public/checkout.html` `placeOrder()` lines 148–161; `POST /api/cart/validate`

**Method:** Source code review  
**Result:** ✅ **Pass**

Before calling `POST /api/orders`, `placeOrder()` calls `POST /api/cart/validate`. If `validation.valid === false`, the `#stockAlert` div is populated with the specific product name and error (`"Out of stock"` or `"Only N in stock"`), and the function returns early. The Place Order button is re-enabled.

---

### Check 13 — Checkout backend enforces stock with row-level lock

**Endpoint / Component:** `src/routes/orders.js` lines 41–96

**Method:** Source code review  
**Result:** ✅ **Pass**

`POST /api/orders` opens a Sequelize transaction (`sequelize.transaction()`). Each product is fetched with `lock: t.LOCK.UPDATE` (row-level lock). If `product.stock < item.quantity`, the transaction is rolled back and HTTP 409 is returned with the exact product name and available quantity. This prevents race conditions from concurrent checkouts.

---

### Check 14 — Successful checkout decrements stock

**Endpoint / Component:** `src/routes/orders.js` line 70

**Method:** Source code review  
**Result:** ✅ **Pass**

`await product.update({ stock: product.stock - item.quantity }, { transaction: t })` is called for each item within the same transaction, before the order record is created. If the final `t.commit()` fails, the decrement is also rolled back.

---

### Check 15 — Successful checkout creates order with status Processing

**Endpoint / Component:** `src/routes/orders.js` lines 75–80; `src/models/Order.js`

**Method:** Source code review  
**Result:** ✅ **Pass**

`Order.create({ ..., status: 'Processing', ... })` — `'Processing'` is the hardcoded initial status. The model ENUM is `('Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled')`.

---

### Check 16 — Cart is cleared after successful checkout

**Endpoint / Component:** `public/checkout.html` line 171

**Method:** Source code review  
**Result:** ✅ **Pass**

On successful `POST /api/orders`, `Cart.clear()` removes `ns_cart` from `localStorage` and resets the navbar badge to 0. The user is then redirected to `/order-confirmation?orderId=${order.id}`.

---

## Bugs Found

---

### BUG-01 — `GET /api/products/:id` returns products regardless of approvalStatus

| Field | Value |
|---|---|
| **Bug ID** | BUG-01 |
| **Severity** | Medium |
| **Affected File** | `src/routes/products.js` lines 38–46 |
| **Suggested Owner** | Ian Kinyanjui (Product / Flow Developer) |

**Description**  
The public product listing endpoint (`GET /api/products`) correctly filters by `approvalStatus: 'Approved'`. However, the single-product endpoint (`GET /api/products/:id`) uses `Product.findByPk(req.params.id)` with no `approvalStatus` filter. This means a customer who knows a product's ID can retrieve a `Pending` or `Rejected` seller product directly, even though it won't appear in any listing.

**Reproduction**  
1. As an admin, create a seller product (or manually set `approvalStatus = 'Pending'` on any product).
2. Note the product's `id`.
3. `GET /api/products/<id>` — returns the product with HTTP 200 regardless of approval status.

**Suggested Fix**  
Add an `approvalStatus: 'Approved'` condition to the `findByPk` equivalent:
```js
const product = await Product.findOne({
  where: { id: req.params.id, approvalStatus: 'Approved' }
});
```

---

### BUG-02 — "Seller Portal" link shown to all logged-in users regardless of role

| Field | Value |
|---|---|
| **Bug ID** | BUG-02 |
| **Severity** | Low |
| **Affected File** | `public/js/app.js` line 225 |
| **Suggested Owner** | Ian Kinyanjui (Product / Flow Developer) |

**Description**  
The user dropdown in the navbar renders a "Seller Portal" link with the condition `user.role === 'seller' || true`. The `|| true` makes the condition always evaluate to `true`, so every logged-in user — including regular customers and admins — sees the "Seller Portal" link. This is a development leftover.

**Reproduction**  
1. Log in as `alex@example.com` (role: `customer`).
2. Open the user dropdown in the navbar.
3. "Seller Portal" link is visible.

**Suggested Fix**  
Remove `|| true`:
```js
${user.role === 'seller' ? '<a href="/seller/dashboard">Seller Portal</a>' : ''}
```
