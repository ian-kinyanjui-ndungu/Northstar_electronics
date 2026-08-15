# Test Cases — Northstar Electronics MVP

**Document:** HELLEN-01  
**Author:** Hellen Atsunga (QA / Data Analyst)  
**Sprint:** PLP Africa Northstar Sprint — Group 17  
**Date:** 2025-07-09  
**Scope:** Support-deflection test cases derived from the two primary ticket categories — **Order Status** and **Stock Availability** — plus the returns/refund flow included as an additional deflection feature.

---

## How to Read This Document

Each test case maps directly to a real support-ticket question that Northstar Retail Co.'s team was receiving. The test verifies that a customer can answer their own question through the platform — without contacting support.

All test data references the seeded demo database (`npm run seed`).  
Customer login: `alex@example.com` / `customer123`  
Admin login: `admin@northstar.com` / `admin123`

---

## Category 1 — Order Status

> **Ticket trigger:** "Where is my order?" / "Has my order shipped?"

---

### TC-OS-01 — Customer views all their orders on the dashboard

| Field | Value |
|---|---|
| **Test ID** | TC-OS-01 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Navigate to `/login`.
2. Log in as `alex@example.com` / `customer123`.
3. Navigate to `/dashboard`.
4. Observe the **My Orders** tab (loaded by default).

**Expected Result**  
Three orders belonging to Alex are listed. Each card shows: order number, date placed, item count, total amount, and a status badge. Orders are sorted newest-first.

---

### TC-OS-02 — Order status badges display the correct lifecycle states

| Field | Value |
|---|---|
| **Test ID** | TC-OS-02 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to `/dashboard`.
3. Observe the status badges across all three of Alex's seeded orders.

**Expected Result**  
- Order placed 30 days ago → badge shows **Delivered** (green)  
- Order placed 10 days ago → badge shows **Shipped** (blue)  
- Order placed yesterday → badge shows **Processing** (amber)

---

### TC-OS-03 — Customer expands an order to see the tracking timeline

| Field | Value |
|---|---|
| **Test ID** | TC-OS-03 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to `/dashboard`.
3. Click **View Details** on the order with status **Shipped**.
4. Observe the order progress timeline.

**Expected Result**  
The timeline renders four steps: Order Placed, Shipped, Out for Delivery, Delivered. The **Order Placed** step is marked done (green). **Shipped** is marked as the current step (blue highlight). The remaining two steps are inactive (grey).

---

### TC-OS-04 — Dashboard does not expose another customer's orders

| Field | Value |
|---|---|
| **Test ID** | TC-OS-04 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to `/dashboard`.
3. Count the orders visible. Note that `sam@example.com` has a separate seeded order (Order 4 — Out for Delivery).

**Expected Result**  
Exactly three orders are displayed — only Alex's own orders. Sam's order (Order 4) is not visible.

---

### TC-OS-05 — Unauthenticated access to `/dashboard` is blocked

| Field | Value |
|---|---|
| **Test ID** | TC-OS-05 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Ensure no user is logged in (clear localStorage or open a private window).
2. Navigate directly to `/dashboard`.
3. Observe the page behaviour.

**Expected Result**  
The dashboard content area is hidden (`display:none` on `#dashboardWrap`). The page redirects to `/login` immediately via the `requireAuth()` call in the dashboard's `DOMContentLoaded` handler.

---

### TC-OS-06 — Admin can update an order's status

| Field | Value |
|---|---|
| **Test ID** | TC-OS-06 |
| **Category** | Order Status |
| **Priority** | Medium |

**Steps**
1. Log in as `admin@northstar.com` / `admin123`.
2. Navigate to `/admin`.
3. Locate Alex's **Processing** order (placed yesterday).
4. Change its status to **Shipped** using the status update control.
5. Log out and log back in as `alex@example.com`.
6. Navigate to `/dashboard` and view that order.

**Expected Result**  
The order now shows **Shipped** status. The timeline correctly advances: Order Placed is done, Shipped is current.

---

### TC-OS-07 — `GET /api/orders` without a token returns 401

| Field | Value |
|---|---|
| **Test ID** | TC-OS-07 |
| **Category** | Order Status |
| **Priority** | High |

**Steps**
1. Make a direct HTTP request: `GET /api/orders` with no `Authorization` header.

**Expected Result**  
HTTP 401 response with body `{ "error": "Authentication required" }`. No order data is leaked.

---

## Category 2 — Stock Availability

> **Ticket trigger:** "Is this item back in stock?" / "Do you have [product] available?"

---

### TC-SA-01 — Product detail page shows accurate in-stock status

| Field | Value |
|---|---|
| **Test ID** | TC-SA-01 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Navigate (unauthenticated) to `/products`.
2. Click on **ProBook X15 Laptop** (seeded stock: 18).
3. Observe the stock badge on the product detail page.

**Expected Result**  
Stock badge reads "● In Stock" with no low-stock warning (stock ≥ 5). The **Add to Cart** button is visible and enabled.

---

### TC-SA-02 — Product detail page shows out-of-stock status

| Field | Value |
|---|---|
| **Test ID** | TC-SA-02 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Navigate (unauthenticated) to `/products`.
2. Locate and click on **NoiseClear Pro Headset** (seeded stock: 0).
3. Observe the product detail page.

**Expected Result**  
Stock badge reads "● Out of Stock". The **Add to Cart** button is absent. An informational message is shown: "This product is currently out of stock. Check back soon or browse similar products below." The quantity control is also hidden.

---

### TC-SA-03 — Dashboard stock-check tool returns live results

| Field | Value |
|---|---|
| **Test ID** | TC-SA-03 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to `/dashboard`.
3. Click the **Check Stock** tab in the sidebar.
4. Type "laptop" into the search field.
5. Observe results after the 350 ms debounce.

**Expected Result**  
Results show all seeded laptop products (ProBook X15, UltraSlim 14 Pro, GameForce 17 RTX). Each row displays product name, category, stock badge (with quantity), and price. All show "● In Stock (N left)" with their correct seeded quantities.

---

### TC-SA-04 — Dashboard stock-check correctly shows an out-of-stock product

| Field | Value |
|---|---|
| **Test ID** | TC-SA-04 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to the **Check Stock** tab on `/dashboard`.
3. Search for "NoiseClear".

**Expected Result**  
The result row for NoiseClear Pro Headset shows the "● Out of Stock" badge (red). Stock quantity is not shown (0 in stock).

---

### TC-SA-05 — Checkout blocks submission when cart contains an out-of-stock item

| Field | Value |
|---|---|
| **Test ID** | TC-SA-05 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Using browser DevTools or a direct `localStorage` write, inject a cart item with `productId` matching NoiseClear Pro Headset and `quantity: 1`.
2. Log in as `alex@example.com`.
3. Navigate to `/checkout`.
4. Fill in all shipping fields.
5. Click **Place Order**.

**Expected Result**  
The `POST /api/cart/validate` call returns `{ valid: false, issues: [{ name: "NoiseClear Pro Headset", error: "Out of stock" }] }`. The `#stockAlert` banner is shown with the message. The order is **not** created.

---

### TC-SA-06 — Backend enforces stock check independently (API-level)

| Field | Value |
|---|---|
| **Test ID** | TC-SA-06 |
| **Category** | Stock Availability |
| **Priority** | High |

**Steps**
1. Log in and obtain a JWT token for `alex@example.com`.
2. Post directly to `POST /api/orders` with a valid shipping address and `items: [{ productId: <NoiseClear id>, quantity: 1 }]`.

**Expected Result**  
HTTP 409 response: `{ "error": "Insufficient stock for \"NoiseClear Pro Headset\". Available: 0", "productId": <id> }`. The order is not persisted. The stock column is unchanged.

---

### TC-SA-07 — Stock count decrements correctly after a successful order

| Field | Value |
|---|---|
| **Test ID** | TC-SA-07 |
| **Category** | Stock Availability |
| **Priority** | Medium |

**Steps**
1. Note the current stock of **PrecisionGlide Mouse** via `GET /api/products/<id>` (seeded: 60).
2. Log in as `alex@example.com` and complete a checkout for 2 units of that product.
3. Re-fetch `GET /api/products/<id>`.

**Expected Result**  
Stock value decreases from 60 to 58. The decrement is performed within a database transaction using a row-level lock (`SELECT ... FOR UPDATE`), visible in `src/routes/orders.js`.

---

## Category 3 — Returns & Refunds (Additional Feature)

> **Ticket trigger:** "How do I return this?" / "Is my order eligible for a return?"

---

### TC-RR-01 — Return window enforced: request within 14 days is accepted

| Field | Value |
|---|---|
| **Test ID** | TC-RR-01 |
| **Category** | Returns & Refunds |
| **Priority** | High |

**Steps**
1. Using the admin panel, create a new order for `alex@example.com` and manually set its status to `Delivered` with a `createdAt` date within the last 14 days.  
   *(Or: use Order 2 — Shipped, 10 days ago — after advancing its status to Delivered via admin.)*
2. Log in as `alex@example.com`.
3. Navigate to `/dashboard` → Returns tab.
4. Click **+ Apply for a Return**, select the eligible order, enter a reason of at least 10 characters.
5. Submit.

**Expected Result**  
HTTP 201 response. Return created with status `Requested`. Dashboard shows the new return entry. The order card on the Orders tab now shows "Return Requested" badge.

---

### TC-RR-02 — Return window enforced: request after 14 days is rejected

| Field | Value |
|---|---|
| **Test ID** | TC-RR-02 |
| **Category** | Returns & Refunds |
| **Priority** | High |

**Steps**
1. Identify Order 1 (Delivered, seeded 30 days ago) belonging to `alex@example.com`.
2. Post directly to `POST /api/returns` with a valid JWT for alex and `orderId` = Order 1's id, `reason` = "I no longer want this item."

**Expected Result**  
HTTP 400 response: `{ "error": "Return window expired. Returns must be requested within 14 days of purchase. This order was placed 30 days ago." }`. No return record is created.

---

### TC-RR-03 — Frontend hides expired orders from the return dropdown

| Field | Value |
|---|---|
| **Test ID** | TC-RR-03 |
| **Category** | Returns & Refunds |
| **Priority** | Medium |

**Steps**
1. Log in as `alex@example.com`.
2. Navigate to `/dashboard` → Returns tab → **+ Apply for a Return**.
3. Open the order dropdown.

**Expected Result**  
Order 1 (Delivered, 30 days ago) does **not** appear in the dropdown — the `populateReturnOrderDropdown()` function filters to `status === 'Delivered' && days <= 14 && !returnRequest`. If no eligible orders exist, the dropdown shows: "No eligible orders (must be Delivered within 14 days)".
