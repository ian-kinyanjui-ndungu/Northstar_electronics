// ============================================================
//  Northstar — Shared Utilities
// ============================================================

// Auth helpers
const Auth = {
  getToken: () => localStorage.getItem('ns_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('ns_user')); } catch { return null; } },
  isLoggedIn: () => !!localStorage.getItem('ns_token'),
  isAdmin: () => { const u = Auth.getUser(); return u && u.role === 'admin'; },
  set: (token, user) => { localStorage.setItem('ns_token', token); localStorage.setItem('ns_user', JSON.stringify(user)); },
  clear: () => { localStorage.removeItem('ns_token'); localStorage.removeItem('ns_user'); },
  headers: () => {
    const t = Auth.getToken();
    return t ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` } : { 'Content-Type': 'application/json' };
  },
};

// Cart helpers (localStorage)
const Cart = {
  get: () => { try { return JSON.parse(localStorage.getItem('ns_cart')) || []; } catch { return []; } },
  save: (items) => { localStorage.setItem('ns_cart', JSON.stringify(items)); Cart.updateBadge(); },
  add: (product, qty = 1) => {
    const items = Cart.get();
    const existing = items.find(i => i.productId === product.id);
    if (existing) { existing.quantity += qty; } else { items.push({ productId: product.id, name: product.name, price: parseFloat(product.price), image: product.image, quantity: qty }); }
    Cart.save(items);
  },
  remove: (productId) => { Cart.save(Cart.get().filter(i => i.productId !== productId)); },
  updateQty: (productId, qty) => {
    if (qty < 1) return Cart.remove(productId);
    const items = Cart.get();
    const item = items.find(i => i.productId === productId);
    if (item) { item.quantity = qty; Cart.save(items); }
  },
  clear: () => { localStorage.removeItem('ns_cart'); Cart.updateBadge(); },
  count: () => Cart.get().reduce((s, i) => s + i.quantity, 0),
  subtotal: () => Cart.get().reduce((s, i) => s + i.price * i.quantity, 0),
  updateBadge: () => {
    const badges = document.querySelectorAll('.cart-badge');
    const count = Cart.count();
    badges.forEach(b => { b.textContent = count; b.style.display = count > 0 ? 'inline-flex' : 'none'; });
  },
};

// API helper
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: Auth.headers(),
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

// Toast notifications
const Toast = {
  container: null,
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    this.init();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    t.innerHTML = `<strong>${icons[type] || 'ℹ'}</strong> ${message}`;
    this.container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
  },
};

// Format currency
function formatCurrency(n) {
  return '$' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Status badge
function statusBadge(status) {
  const map = {
    'Processing': 'badge-amber',
    'Shipped': 'badge-blue',
    'Out for Delivery': 'badge-cyan',
    'Delivered': 'badge-green',
    'Cancelled': 'badge-red',
    'Requested': 'badge-amber',
    'Approved': 'badge-blue',
    'Rejected': 'badge-red',
    'Refunded': 'badge-green',
  };
  return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
}

// Product image fallback SVG
function productImageSVG(category = '') {
  const colors = { Laptops: '#3b82f6', Desktops: '#8b5cf6', Monitors: '#06b6d4', Accessories: '#10b981' };
  const color = colors[category] || '#94a3b8';
  const icons = {
    Laptops: '<rect x="20" y="30" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="10" y="70" width="80" height="5" rx="2" fill="currentColor" opacity="0.4"/><line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" stroke-width="2" opacity="0.3"/>',
    Desktops: '<rect x="30" y="20" width="40" height="50" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="42" y="72" width="16" height="6" fill="currentColor" opacity="0.4"/><rect x="34" y="78" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>',
    Monitors: '<rect x="15" y="20" width="70" height="48" rx="4" stroke="currentColor" stroke-width="2.5" fill="none"/><rect x="42" y="68" width="16" height="8" fill="currentColor" opacity="0.4"/><rect x="34" y="76" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>',
    Accessories: '<circle cx="50" cy="50" r="28" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.3"/>',
  };
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='${color}18'/><g style='color:${color}'>${icons[category] || icons.Accessories}</g></svg>`)}`;
}

// Build nav markup
function buildNav() {
  const user = Auth.getUser();
  const cartCount = Cart.count();

  return `
  <nav class="navbar">
    <div class="container">
      <div class="navbar-inner">
        <a href="/" class="navbar-logo">
          <img src="/images/logo.png" alt="Northstar" class="navbar-logo-img"/>
        </a>
        <nav class="navbar-nav" id="navLinks">
          <a href="/" class="nav-link">Home</a>

          <div class="nav-dropdown">
            <button class="nav-link nav-dropdown-btn">
              Shop
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="nav-dropdown-menu">
              <div class="nav-dropdown-grid">
                <div class="nav-dropdown-col">
                  <span class="nav-dropdown-heading">Categories</span>
                  <a href="/products?category=Laptops">💻 Laptops</a>
                  <a href="/products?category=Desktops">🖥️ Desktops</a>
                  <a href="/products?category=Monitors">🖵 Monitors</a>
                  <a href="/products?category=Accessories">🎧 Accessories</a>
                </div>
                <div class="nav-dropdown-col">
                  <span class="nav-dropdown-heading">Browse</span>
                  <a href="/products">All Products</a>
                  <a href="/products?featured=true">Best Sellers</a>
                  <a href="/products">New Arrivals</a>
                  <a href="/products">Deals</a>
                </div>
                <div class="nav-dropdown-col">
                  <span class="nav-dropdown-heading">Brands</span>
                  <a href="/products">Apple</a>
                  <a href="/products">Samsung</a>
                  <a href="/products">Dell</a>
                  <a href="/products">LG</a>
                </div>
              </div>
            </div>
          </div>

          <div class="nav-dropdown">
            <button class="nav-link nav-dropdown-btn">
              Support
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="nav-dropdown-menu nav-dropdown-menu-sm">
              <a href="/help">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Help Center
              </a>
              <a href="/contact">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12.18 19.79 19.79 0 0 1 1.08 3.58 2 2 0 0 1 3.05 1.4h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 6 6z"/></svg>
                Contact Us
              </a>
              <a href="/faq">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                FAQ
              </a>
              <a href="/shipping">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Shipping Information
              </a>
              <a href="/return-policy">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                Returns & Refunds
              </a>
              <a href="/payment-info">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Payment Information
              </a>
              <div class="nav-dropdown-divider"></div>
              <a href="/terms">Terms & Conditions</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/about">About Us</a>
            </div>
          </div>

          <a href="/seller" class="nav-link">Sell on Northstar</a>
        </nav>
        <div class="navbar-actions">
          ${user ? `
          <a href="/wishlist" class="cart-btn" title="Wishlist">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </a>
          ` : ''}
          <a href="/cart" class="cart-btn">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Cart
            <span class="cart-badge" style="display:${cartCount > 0 ? 'inline-flex' : 'none'}">${cartCount}</span>
          </a>
          ${user ? `
          <div class="user-menu" id="userMenu">
            <button class="user-btn" onclick="document.getElementById('userMenu').classList.toggle('open')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${user.name.split(' ')[0]}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="user-dropdown">
              <a href="/dashboard">My Dashboard</a>
              <a href="/wishlist">My Wishlist</a>
              ${user.role === 'admin' ? '<a href="/admin">Admin Panel</a>' : ''}
              ${user.role === 'seller' || true ? '<a href="/seller/dashboard">Seller Portal</a>' : ''}
              <div class="separator"></div>
              <button onclick="logout()">Sign Out</button>
            </div>
          </div>
          ` : `
          <a href="/login" class="btn btn-outline btn-sm">Sign In</a>
          <a href="/signup" class="btn btn-primary btn-sm">Sign Up</a>
          `}
        </div>
        <button class="hamburger" onclick="toggleMobileNav()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>`;
}

function buildFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="/images/logo.png" alt="Northstar" style="height:36px;filter:brightness(0) invert(1);opacity:0.9"/>
          </div>
          <p>Premium tech products for professionals and enthusiasts. Trusted by thousands of customers across North America.</p>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="/products?category=Laptops">Laptops</a></li>
            <li><a href="/products?category=Desktops">Desktops</a></li>
            <li><a href="/products?category=Monitors">Monitors</a></li>
            <li><a href="/products?category=Accessories">Accessories</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="/login">Sign In</a></li>
            <li><a href="/signup">Create Account</a></li>
            <li><a href="/dashboard">My Orders</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Help</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/return-policy">Return Policy</a></li>
            <li><a href="/shipping">Shipping Info</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} Northstar Electronics. All rights reserved.</span>
        <span>Made with care in Nairobi Kenya</span>
      </div>
    </div>
  </footer>`;
}

// Slim copyright-only footer for all dashboard pages
function buildDashboardFooter() {
  return `
  <footer class="dash-footer">
    <span>© ${new Date().getFullYear()} Northstar Electronics. All rights reserved.</span>
    <span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/contact">Support</a></span>
  </footer>`;
}

// ============================================================
//  Full-Screen Branded Splash Loader
// ============================================================

// Inject splash CSS once into <head>
(function injectSplashCSS() {
  if (document.getElementById('ns-splash-style')) return;
  const s = document.createElement('style');
  s.id = 'ns-splash-style';
  s.textContent = `
    #ns-splash {
      position: fixed; inset: 0; z-index: 99999;
      background: #ffffff;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      transition: opacity 0.45s ease, visibility 0.45s ease;
    }
    #ns-splash.ns-splash-hide {
      opacity: 0; visibility: hidden;
      pointer-events: none;
    }
    .ns-splash-logo {
      height: 72px; width: auto;
      margin-bottom: 36px;
      animation: ns-splash-pop 0.55s cubic-bezier(.34,1.56,.64,1) both;
    }
    @keyframes ns-splash-pop {
      from { opacity: 0; transform: scale(0.78) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    .ns-splash-track {
      width: 200px; height: 3px;
      background: #e5e7eb;
      border-radius: 99px;
      overflow: hidden;
    }
    .ns-splash-bar {
      height: 100%; width: 0;
      background: linear-gradient(90deg, #3b82d4, #7c5cd8);
      border-radius: 99px;
      transition: width 0.9s cubic-bezier(.4,0,.2,1);
    }
    .ns-splash-tagline {
      margin-top: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #57606a;
      letter-spacing: 0.5px;
      opacity: 0;
      animation: ns-splash-fadein 0.4s 0.3s ease forwards;
    }
    @keyframes ns-splash-fadein {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
})();

function showSplash() {
  // Remove any existing splash first
  const existing = document.getElementById('ns-splash');
  if (existing) existing.remove();

  const splash = document.createElement('div');
  splash.id = 'ns-splash';
  splash.innerHTML = `
    <img src="/images/logo.png" alt="Northstar" class="ns-splash-logo"/>
    <div class="ns-splash-track"><div class="ns-splash-bar" id="ns-splash-bar"></div></div>
    <div class="ns-splash-tagline">Northstar Electronics</div>
  `;
  document.body.appendChild(splash);

  // Kick the progress bar after one paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = document.getElementById('ns-splash-bar');
      if (bar) bar.style.width = '100%';
    });
  });
  return splash;
}

function hideSplash(splash, delay = 0) {
  const el = splash || document.getElementById('ns-splash');
  if (!el) return;
  setTimeout(() => {
    el.classList.add('ns-splash-hide');
    setTimeout(() => el.remove(), 500);
  }, delay);
}

// Navigate to a URL with a branded transition splash
function navigateWithSplash(url) {
  const splash = showSplash();
  // Show for at least 600ms so it's perceptible, then navigate
  setTimeout(() => { window.location.href = url; }, 650);
}

// ---- Legacy aliases so existing callers still work ----
function showPageLoader() { showSplash(); }
function hidePageLoader() { hideSplash(); }

const DASH_PAGES = ['/dashboard', '/admin', '/seller/dashboard', '/seller/products', '/seller/orders', '/seller/wallet', '/seller/analytics', '/seller/settings'];

function injectLayout() {
  const splash = showSplash();

  const navPlaceholder = document.getElementById('nav-placeholder');
  if (navPlaceholder) navPlaceholder.outerHTML = buildNav();

  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    const isDash = DASH_PAGES.some(p => window.location.pathname === p || window.location.pathname.startsWith(p));
    footerPlaceholder.outerHTML = isDash ? buildDashboardFooter() : buildFooter();
  }

  // Highlight active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  Cart.updateBadge();

  // Close user dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    if (menu && !menu.contains(e.target)) menu.classList.remove('open');
    // Close mobile nav when clicking outside
    const nav = document.getElementById('navLinks');
    const hamburger = document.querySelector('.hamburger');
    if (nav && hamburger && !nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove('mobile-open');
      hamburger.classList.remove('open');
    }
  });
  // Close mobile nav when a link inside it is clicked
  document.addEventListener('click', e => {
    if (e.target.closest('#navLinks a')) {
      const nav = document.getElementById('navLinks');
      const btn = document.querySelector('.hamburger');
      nav?.classList.remove('mobile-open');
      btn?.classList.remove('open');
    }
  });

  // Hide once fully loaded, min 600ms so logo registers
  const hideWhenReady = () => hideSplash(splash, 200);
  if (document.readyState === 'complete') {
    hideWhenReady();
  } else {
    window.addEventListener('load', hideWhenReady, { once: true });
    setTimeout(hideWhenReady, 2200); // hard fallback
  }
}

function toggleMobileNav() {
  const nav = document.getElementById('navLinks');
  const btn = document.querySelector('.hamburger');
  const isOpen = nav.classList.toggle('mobile-open');
  if (btn) btn.classList.toggle('open', isOpen);
}

function logout() {
  Auth.clear();
  Cart.clear();
  navigateWithSplash('/');
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', injectLayout);
