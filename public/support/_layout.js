// Shared support page layout helper
function supportPage(activeHref, title, content) {
  const links = [
    { href: '/help', icon: '❓', label: 'Help Center' },
    { href: '/contact', icon: '📞', label: 'Contact Us' },
    { href: '/faq', icon: '💬', label: 'FAQ' },
    { href: '/shipping', icon: '🚚', label: 'Shipping Information' },
    { href: '/return-policy', icon: '↩️', label: 'Returns & Refunds' },
    { href: '/payment-info', icon: '💳', label: 'Payment Information' },
    { href: '/terms', icon: '📋', label: 'Terms & Conditions' },
    { href: '/privacy', icon: '🔒', label: 'Privacy Policy' },
    { href: '/about', icon: '🌟', label: 'About Us' },
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Northstar Electronics</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/>
  <link rel="stylesheet" href="/css/style.css"/>
</head>
<body>
  <div id="nav-placeholder"></div>
  <div class="page-wrapper">
    <div class="container">
      <div class="support-layout">
        <aside class="support-sidebar">
          <div class="card card-body" style="padding:12px">
            <span class="support-nav section-label" style="padding-left:4px">Support</span>
            <nav class="support-nav" style="display:flex;flex-direction:column;gap:2px">
              ${links.map(l => `<a href="${l.href}" class="${l.href === activeHref ? 'active' : ''}">${l.icon} ${l.label}</a>`).join('\n              ')}
            </nav>
          </div>
        </aside>
        <main class="support-content">${content}</main>
      </div>
    </div>
  </div>
  <div id="footer-placeholder"></div>
  <script src="/js/app.js"></script>
</body>
</html>`;
}
