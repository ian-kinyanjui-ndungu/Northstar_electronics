Build a full-stack e-commerce web application called Northstar — a modern online electronics store selling tech products (laptops, desktops, monitors, accessories). This is a working MVP for a support-deflection project, so it needs to look professional and demo cleanly end-to-end.

Tech stack (use exactly this):

Backend: Node.js + Express
Database: TiDB (MySQL-compatible — use standard SQL/Sequelize or Prisma syntax)
Frontend: HTML, CSS, JavaScript (vanilla or a lightweight framework if supported — no heavy frontend framework needed)
Authentication: JWT-based auth (or Clerk if the platform supports third-party auth integrations) with role-based access control (roles: customer and admin)

Pages & features to generate:

Homepage — modern, clean, professional design:
Hero section with a strong headline, subheadline, and a clear call-to-action ("Shop Now")
Featured/best-selling products grid with product cards (image, name, price, "Add to Cart" button)
Category navigation (Laptops, Desktops, Monitors, Accessories)
Simple trust-building footer (About, Contact, Return Policy link)
Fully responsive (mobile, tablet, desktop)
Product listing & product detail pages
Grid/list view with filters (category, price range)
Product detail page: images, description, price, stock status (In Stock / Out of Stock), "Add to Cart" button (disabled if out of stock)
Cart & Checkout
Cart page: line items, quantity adjust, remove item, subtotal
Checkout requires login — if not logged in, redirect to login/signup first
Checkout only completes if the item is confirmed in stock at time of purchase
Order confirmation page/screen after successful checkout
Authentication
Sign up / Log in pages (JWT-based session, or Clerk components if using Clerk)
Role-based access: customer role (default) and admin role
Admin-only route protection on all admin pages
Customer Dashboard (logged-in users)
"My Orders" list showing order status (Processing / Shipped / Out for Delivery / Delivered)
Order detail view per order
"Check Stock Availability" section — search/view stock status of any product
"Request a Return" button on eligible orders — opens a return request form
Return/Refund Flow
Return request form tied to a specific order
Enforce policy rule: only allow return requests within 14 days of purchase date (validate against order date)
Show the return policy rules clearly to the user before they submit
Return status tracking (Requested / Approved / Rejected / Refunded)
Admin Dashboard
Add / edit / remove products (name, price, stock quantity, category, images)
View all orders and update order status
View and manage return requests (approve/reject)
Only accessible to users with the admin role

Design direction:

Modern, clean, minimal e-commerce aesthetic — think confident whitespace, a clear primary accent color, consistent card-based layouts (similar spirit to major e-commerce sites, but with your own distinct branding, not a copy)
Consistent typography hierarchy, clear buttons/CTAs, subtle hover states
Mobile-first responsive layout

Data:

Seed the database with ~10-15 realistic sample tech products (name, price, stock quantity, category, image placeholder) so the demo has real content to show
Seed at least 2-3 sample orders in different statuses for demo purposes

Deliverable: a working, demoable app covering the full flow: browse → add to cart → login → checkout (stock-checked) → view order status in dashboard → request a return within policy.