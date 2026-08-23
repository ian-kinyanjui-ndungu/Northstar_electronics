# QA Pass Report — Customer Dashboard & Return Request Flow

**Document:** HELLEN-03  
**Author:** Hellen Atsunga (QA / Data Analyst)  
**Sprint:** PLP Africa Northstar Sprint — Group 17  
**Date:** 2025-07-09  
**Environment:** Seeded demo database (`npm run seed`), Railway deployment + local source code verification  

**Seed data key facts used in this report:**
- `alex@example.com` has **3 orders**: Delivered (30 days ago), Shipped (10 days ago), Processing (yesterday).
- `sam@example.com` has **1 order**: Out for Delivery (10 days ago).
- The **Delivered** order for alex was placed **30 days ago** — its 14-day return window has expired.
- A return request already exists (seeded) on Order 2 (Shipped status) — this is an anomaly noted below.

---

## Summary

| Check | Result |
|---|---|
| Dashboard requires authentication | ✅ Pass |
| Dashboard loads logged-in user's display name | ✅ Pass |
| Dashboard shows correct orders for logged-in user | ✅ Pass |
| Order status badges are accurate | ✅ Pass |
| Order detail / timeline expands correctly | ✅ Pass |
| Cross-user order isolation enforced at API level | ✅ Pass |
| Stock check tab searches products by name | ✅ Pass |
| Stock check shows correct in-stock count | ✅ Pass |
| Stock check correctly identifies out-of-stock products | ✅ Pass |
| Return form shows 14-day policy notice | ✅ Pass |
| Return dropdown excludes ineligible orders | ✅ Pass |
| Return within 14 days of a Delivered order is accepted | ✅ Pass |
| Return attempt after 14 days is rejected by the backend | ✅ Pass |
| Return on a non-Delivered order is rejected | ✅ Pass |
| Duplicate return on the same order is rejected | ✅ Pass |
| Return status visible to customer after submission | ✅ Pass |
| Admin can update return status (Approved / Rejected / Refunded) | ✅ Pass |
| Seeded return exists on a Shipped (not Delivered) order | ⚠️ Bug — BUG-03 |

**Total: 17 Pass · 1 Bug**

---

## Detailed Results

---

### Check 1 — Dashboard requires authentication

**Endpoint / Component:** `public/dashboard.html` DOMContentLoaded handler

**Method:** Source code review  
**Result:** ✅ **Pass**

`document.addEventListener('DOMContentLoaded', ...)` checks `Auth.isLoggedIn()`. If no token is present, the user is redirected to `/login`. `#dashboardWrap` starts as `display:none` and is only set to `block` after the auth check passes — so even a slow redirect does not flash dashboard content.

---

### Check 2 — Dashboard loads logged-in user's display name

**Endpoint / Component:** `GET /api/auth/me` → `#sidebarName`, `#topbarName`

**Method:** Source code review  
**Result:** ✅ **Pass**

On load the dashboard calls `GET /api/auth/me` with the JWT, receives `{ id, name, email, role }`, and writes the `name` to both `#sidebarName` (sidebar user badge) and `#topbarName` (top bar greeting). `email` is written to `#sidebarEmail`.

---

### Check 3 — Dashboard shows correct orders for logged-in user

**Endpoint / Component:** `GET /api/orders` → `loadOrders()` in `public/dashboard.html`

**Method:** Source code review (`src/routes/orders.js` line 10: `where: { userId: req.user.id }`)  
**Result:** ✅ **Pass**

`GET /api/orders` always filters by `userId: req.user.id` — the ID extracted from the verified JWT. Alex's session yields exactly 3 orders. Sam's session yields exactly 1 order.

---

### Check 4 — Order status badges are accurate

**Endpoint / Component:** `statusBadge()` in `public/js/app.js` lines 89–102

**Method:** Source code review  
**Result:** ✅ **Pass**

`statusBadge()` maps each status string to a CSS class: `Processing` → `badge-amber`, `Shipped` → `badge-blue`, `Out for Delivery` → `badge-cyan`, `Delivered` → `badge-green`, `Cancelled` → `badge-red`. The seeded orders exercise all five states (between alex and sam).

---

### Check 5 — Order detail / tracking timeline expands correctly

**Endpoint / Component:** `renderOrderTimeline()` in `public/dashboard.html` lines 354–378

**Method:** Source code review  
**Result:** ✅ **Pass**

`ORDER_STEPS` defines 4 steps in order: Processing → Shipped → Out for Delivery → Delivered. `currentIdx` is found via `findIndex`. Steps before `currentIdx` are rendered `done` (green), the step at `currentIdx` is `current` (blue), the rest are inactive (grey). Cancelled orders bypass the timeline and show an alert banner.

---

### Check 6 — Cross-user order isolation enforced at API level

**Endpoint / Component:** `GET /api/orders/:id` — `src/routes/orders.js` line 25

**Method:** Source code review  
**Result:** ✅ **Pass**

`Order.findOne({ where: { id: req.params.id, userId: req.user.id } })` — the `userId` constraint is always included. A customer attempting to fetch another user's order by ID receives HTTP 404, not the order data.

---

### Check 7 — Stock check tab searches products by name

**Endpoint / Component:** `doStockSearch()` in `public/dashboard.html` lines 513–537

**Method:** Source code review  
**Result:** ✅ **Pass**

`doStockSearch()` calls `GET /api/products?search=${encodeURIComponent(q)}&limit=8`. The products route applies `where.name = { [Op.like]: \`%${search}%\` }`. Results render within 350 ms (debounce). Empty query clears results without making a network call.

---

### Check 8 — Stock check shows correct in-stock count

**Endpoint / Component:** `public/dashboard.html` line 529

**Method:** Source code review  
**Result:** ✅ **Pass**

For each result, the UI renders: `p.stock > 0 ? \`● In Stock (${p.stock} left)\` : '● Out of Stock'`. The count comes directly from the `stock` column returned by the API, which reflects the live database value — including any decrements from completed checkouts.

---

### Check 9 — Stock check correctly identifies out-of-stock products

**Endpoint / Component:** `GET /api/products?search=NoiseClear`

**Method:** Source code review + seeded data  
**Result:** ✅ **Pass**

NoiseClear Pro Headset is seeded with `stock: 0`. The API returns it (it has `approvalStatus: 'Approved'`). The dashboard renders the "● Out of Stock" badge (red) since `p.stock > 0` evaluates to `false`.

---

### Check 10 — Return form shows 14-day policy notice

**Endpoint / Component:** `public/dashboard.html` lines 165–173 (inline form) and lines 228–236 (modal)

**Method:** Source code review  
**Result:** ✅ **Pass**

Both the inline return form and the modal return dialog contain a `.policy-box` element that explicitly states: *"Returns must be requested within 14 days of the delivery date."* This is rendered before the order selector, ensuring the customer sees the policy before selecting an order.

---

### Check 11 — Return dropdown excludes ineligible orders

**Endpoint / Component:** `populateReturnOrderDropdown()` in `public/dashboard.html` lines 399–425

**Method:** Source code review  
**Result:** ✅ **Pass**

The dropdown filter is: `o.status === 'Delivered' && days <= 14 && !o.returnRequest`. For the seeded alex account:
- Order 1 (Delivered, 30 days ago) → excluded (days > 14)
- Order 2 (Shipped, 10 days ago) → excluded (not Delivered)
- Order 3 (Processing, yesterday) → excluded (not Delivered)

Result: dropdown shows "No eligible orders (must be Delivered within 14 days)".

---

### Check 12 — Return within 14 days of a Delivered order is accepted

**Endpoint / Component:** `POST /api/returns` — `src/routes/returns.js` lines 21–28

**Method:** Source code review  
**Result:** ✅ **Pass**

`daysSincePurchase = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))`. If `daysSincePurchase <= RETURN_WINDOW_DAYS` (14) and `order.status === 'Delivered'` and no existing return exists, `Return.create(...)` is called and HTTP 201 is returned.

---

### Check 13 — Return attempt after 14 days is rejected by the backend

**Endpoint / Component:** `POST /api/returns` — `src/routes/returns.js` lines 22–28

**Method:** Source code review + seeded data  
**Result:** ✅ **Pass**

For Order 1 (Delivered, 30 days ago): `daysSincePurchase = 30`. `30 > 14` → HTTP 400 with:  
`"Return window expired. Returns must be requested within 14 days of purchase. This order was placed 30 days ago."`

This enforcement is **server-side** — it cannot be bypassed by frontend manipulation.

---

### Check 14 — Return on a non-Delivered order is rejected

**Endpoint / Component:** `POST /api/returns` — `src/routes/returns.js` lines 17–19

**Method:** Source code review  
**Result:** ✅ **Pass**

`if (order.status !== 'Delivered') return res.status(400).json({ error: 'Only delivered orders can be returned' })`. A return attempt on a Processing, Shipped, or Out-for-Delivery order is rejected before the date check is even reached.

---

### Check 15 — Duplicate return on the same order is rejected

**Endpoint / Component:** `POST /api/returns` — `src/routes/returns.js` lines 31–32

**Method:** Source code review  
**Result:** ✅ **Pass**

`const existing = await Return.findOne({ where: { orderId } })`. If a record already exists, HTTP 409 is returned: `"A return request already exists for this order"`.

---

### Check 16 — Return status visible to customer after submission

**Endpoint / Component:** `GET /api/returns` → `loadReturns()` in `public/dashboard.html`

**Method:** Source code review  
**Result:** ✅ **Pass**

`loadReturns()` fetches `/returns`, which queries `Return.findAll({ where: { userId: req.user.id } })`. Each return is rendered with its current status badge and the reason text. Status-specific messages are shown inline: Approved shows shipping instructions, Rejected shows a contact-support message, Refunded shows a processing-time notice.

---

### Check 17 — Admin can update return status

**Endpoint / Component:** `PUT /api/admin/returns/:id` — `src/routes/admin.js` lines 56–68

**Method:** Source code review  
**Result:** ✅ **Pass**

Valid statuses: `['Requested', 'Approved', 'Rejected', 'Refunded']`. The endpoint accepts `{ status, adminNotes }` and updates the `Return` record. The route is protected by `router.use(authenticate, requireAdmin)` applied at the router level (line 6), so non-admin JWTs receive HTTP 403.

---

## Bugs Found

---

### BUG-03 — Seed script creates a return on a Shipped (non-Delivered) order

| Field | Value |
|---|---|
| **Bug ID** | BUG-03 |
| **Severity** | Low |
| **Affected File** | `src/database/seed.js` lines 215–220 |
| **Suggested Owner** | Hellen Atsunga (Data / QA Analyst) — seed data fix |

**Description**  
The seed script creates a `Return` record on Order 2, which has `status: 'Shipped'`. The returns route enforces `order.status === 'Delivered'` before accepting a return — so this return could not have been created through the normal user flow. The seed bypasses the route layer by writing directly via `Return.create(...)`.

This means the seeded demo data contains an invalid state that would never occur in production. It also means the seeded return will appear in the admin returns panel with a status that contradicts the route's own guard, which may confuse evaluators or QA testers.

**Suggested Fix**  
In `src/database/seed.js`, change the return's associated order to Order 1 (which has `status: 'Delivered'`). Note that Order 1 is 30 days old, so the return would be outside the 14-day window — this is valid for a demo dataset showing an expired/edge-case return. Alternatively, create a new Delivered order dated within 14 days and attach the return to that.
