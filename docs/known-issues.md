# Known Issues — Northstar Electronics MVP

**Document:** HELLEN-04  
**Author:** Hellen Atsunga (QA / Data Analyst)  
**Sprint:** PLP Africa Northstar Sprint — Group 17  
**Date:** 2025-07-09  
**Sources:** HELLEN-02 (QA: catalog & checkout), HELLEN-03 (QA: dashboard & returns), direct source code review

---

## Issue Register

| ID | Issue | Severity | Affected Area | Suggested Owner | Status |
|---|---|---|---|---|---|
| BUG-01 | `GET /api/products/:id` returns `Pending` and `Rejected` products — approval-status filter not applied on single-product endpoint | Medium | Backend — `src/routes/products.js:38` | Ian Kinyanjui | Open |
| BUG-02 | "Seller Portal" link shown to all logged-in users due to `|| true` in nav condition | Low | Frontend — `public/js/app.js:225` | Ian Kinyanjui | Open |
| BUG-03 | Seed data creates a return on a `Shipped` (non-Delivered) order — invalid state that cannot occur through the normal user flow | Low | Seed data — `src/database/seed.js:215` | Hellen Atsunga | Open |

---

## MVP Scope Limitations

The following are known, intentional simplifications for the MVP. They are not bugs — they are documented boundaries of what was built.

| ID | Limitation | Severity | Affected Area | Notes |
|---|---|---|---|---|
| LIM-01 | No real payment gateway — checkout accepts any card input and creates the order immediately without processing payment | High | Checkout | Intentional for MVP. `checkout.html` displays a "Demo mode" alert to make this clear to testers. |
| LIM-02 | Cart is client-side only (localStorage) — does not persist across devices or browser sessions | Medium | Cart | No server-side cart model exists. Cart data is lost on logout (`Cart.clear()` is called). |
| LIM-03 | No transactional email notifications — no emails sent on order creation, status change, or return status update | Medium | Order Status / Returns | No email service is integrated. Notification model exists in DB but email delivery is not implemented. |
| LIM-04 | Seller portal analytics and wallet features are UI-only — not fully wired to backend business logic | Medium | Seller Portal | Seller registration, product submission, and admin approval flow work. Analytics charts and wallet balance auto-calculation do not. |
| LIM-05 | Product inventory is seeded / static — no live sync with a warehouse or ERP system | Low | Inventory | Stock is decremented by successful orders but is not sourced from or synced to any external system. |
| LIM-06 | No automated test suite — all QA was performed manually against the source code and seeded data | Low | QA Process | No unit tests, integration tests, or end-to-end tests exist in the repository. |
| LIM-07 | Return window is measured from `order.createdAt` (order placed date), not a separate confirmed delivery date | Low | Returns | The platform does not track an actual delivery timestamp. For MVP purposes, `createdAt` is used as a proxy. |

---

## Notes for Evaluators

- **BUG-01** is the only medium-severity open bug. It does not affect the primary support-deflection flows (order status, stock availability, returns) but could expose unapproved marketplace products via direct URL if seller products are ever submitted.
- **BUG-02** and **BUG-03** are low-severity. BUG-02 is a one-line fix; BUG-03 is a seed data correction.
- All three of the primary QA pass reports (HELLEN-01 test cases, HELLEN-02 catalog/checkout, HELLEN-03 dashboard/returns) passed their core functionality checks. The two primary support-deflection ticket categories — Order Status and Stock Availability — are fully functional and correctly implemented.
