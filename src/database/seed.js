require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./connection');
const { User, Product, Order, OrderItem, Return } = require('../models/index');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database...');
    await sequelize.sync({ force: true });
    console.log('Tables created...');

    // Users
    const adminHash = await bcrypt.hash('admin123', 10);
    const customerHash = await bcrypt.hash('customer123', 10);
    const customer2Hash = await bcrypt.hash('demo123', 10);

    const admin = await User.create({ name: 'Admin User', email: 'admin@northstar.com', password: adminHash, role: 'admin' });
    const customer1 = await User.create({ name: 'Alex Johnson', email: 'alex@example.com', password: customerHash, role: 'customer' });
    const customer2 = await User.create({ name: 'Sam Rivera', email: 'sam@example.com', password: customer2Hash, role: 'customer' });

    console.log('✅ Users seeded');

    // Products
    const products = await Product.bulkCreate([
      {
        name: 'ProBook X15 Laptop',
        description: 'Powerhouse 15.6" laptop with Intel Core i7-13700H, 16GB DDR5 RAM, 512GB NVMe SSD. Ideal for professionals who need performance on the go. Backlit keyboard, Thunderbolt 4, all-day battery life.',
        price: 1299.99,
        category: 'Laptops',
        stock: 18,
        image: '/images/products/laptop-1.svg',
        featured: true,
      },
      {
        name: 'UltraSlim 14 Pro',
        description: 'Featherlight 14" ultrabook at just 1.2kg. Intel Core i5-1340P, 8GB RAM, 256GB SSD. Perfect for travel and everyday productivity with a stunning OLED display.',
        price: 899.99,
        category: 'Laptops',
        stock: 24,
        image: '/images/products/laptop-2.svg',
        featured: true,
      },
      {
        name: 'GameForce 17 RTX',
        description: 'Uncompromising gaming laptop with NVIDIA RTX 4070, Intel i9-13900H, 32GB RAM, 1TB SSD. 165Hz QHD display, advanced cooling system, RGB per-key backlight.',
        price: 2199.99,
        category: 'Laptops',
        stock: 9,
        image: '/images/products/laptop-3.svg',
        featured: true,
      },
      {
        name: 'Northstar WorkStation Pro',
        description: 'High-performance desktop tower for creative professionals. AMD Ryzen 9 7950X, 64GB DDR5, RTX 4080, 2TB NVMe RAID. Whisper-quiet thermals with dual-360mm liquid cooling.',
        price: 3499.99,
        category: 'Desktops',
        stock: 5,
        image: '/images/products/desktop-1.svg',
        featured: true,
      },
      {
        name: 'MiniCore M1 Desktop',
        description: 'Compact but capable mini PC with AMD Ryzen 5 7600, 16GB RAM, 512GB SSD. Fits anywhere, connects everything. Perfect for home office or media center use.',
        price: 649.99,
        category: 'Desktops',
        stock: 15,
        image: '/images/products/desktop-2.svg',
        featured: false,
      },
      {
        name: 'TowerMax Elite 9',
        description: 'The ultimate desktop experience. Intel Core i9-14900K, 128GB ECC RAM, dual RTX 4090, 4TB NVMe storage. Built for 3D rendering, machine learning, and extreme multitasking.',
        price: 5999.99,
        category: 'Desktops',
        stock: 3,
        image: '/images/products/desktop-3.svg',
        featured: false,
      },
      {
        name: 'CrystalView 27" 4K Monitor',
        description: '27" IPS 4K UHD monitor with 99% DCI-P3 color accuracy, 144Hz refresh, 1ms GTG. HDR600 certified, USB-C 90W charging, height/tilt/swivel adjustable stand.',
        price: 699.99,
        category: 'Monitors',
        stock: 20,
        image: '/images/products/monitor-1.svg',
        featured: true,
      },
      {
        name: 'UltraWide 34" Curved',
        description: '34" WQHD curved ultrawide with 21:9 aspect ratio, 165Hz, 1ms response. AMD FreeSync Premium Pro, dual HDMI, DisplayPort, 4x USB hub. Immersive gaming and multitasking.',
        price: 849.99,
        category: 'Monitors',
        stock: 11,
        image: '/images/products/monitor-2.svg',
        featured: false,
      },
      {
        name: 'ProColor 24" OLED',
        description: '24" OLED professional display with true blacks, infinite contrast, and 0.03ms response time. Factory-calibrated, X-Rite certified, ideal for photo and video editing.',
        price: 1199.99,
        category: 'Monitors',
        stock: 7,
        image: '/images/products/monitor-3.svg',
        featured: false,
      },
      {
        name: 'MechType Pro Keyboard',
        description: 'Compact TKL mechanical keyboard with Cherry MX Red switches. Per-key RGB, PBT double-shot keycaps, USB-C detachable cable, aluminum top plate.',
        price: 149.99,
        category: 'Accessories',
        stock: 45,
        image: '/images/products/keyboard-1.svg',
        featured: true,
      },
      {
        name: 'PrecisionGlide Mouse',
        description: 'Ergonomic wireless gaming mouse with 26,000 DPI optical sensor, 70hr battery, 7 programmable buttons. Works on any surface, USB-A and USB-C receiver included.',
        price: 79.99,
        category: 'Accessories',
        stock: 60,
        image: '/images/products/mouse-1.svg',
        featured: true,
      },
      {
        name: 'USB-C Hub Pro 12-in-1',
        description: 'All-in-one 12-port USB-C hub: 4K HDMI, 4K DisplayPort, 100W PD, 3x USB-A 3.2, 2x USB-C, SD/microSD, Gigabit Ethernet, 3.5mm audio. Aluminum shell, bus-powered.',
        price: 89.99,
        category: 'Accessories',
        stock: 38,
        image: '/images/products/hub-1.svg',
        featured: false,
      },
      {
        name: 'NoiseClear Pro Headset',
        description: 'Professional USB headset with active noise cancellation, 50mm drivers, multi-point Bluetooth, 30hr battery. Crystal-clear mic with AI noise suppression. Foldable for travel.',
        price: 199.99,
        category: 'Accessories',
        stock: 0,
        image: '/images/products/headset-1.svg',
        featured: false,
      },
      {
        name: 'CamPro 4K Webcam',
        description: '4K 30fps webcam with built-in stereo mic array, AI auto-framing, HDR, privacy cover. Plug-and-play USB-C, works with all major conferencing platforms.',
        price: 119.99,
        category: 'Accessories',
        stock: 22,
        image: '/images/products/webcam-1.svg',
        featured: false,
      },
    ]);

    console.log('✅ Products seeded');

    // Orders
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const order1 = await Order.create({
      userId: customer1.id,
      status: 'Delivered',
      total: 1449.98,
      shippingAddress: '123 Tech Lane, San Francisco, CA 94102',
      createdAt: thirtyDaysAgo,
      updatedAt: thirtyDaysAgo,
    });
    await OrderItem.bulkCreate([
      { orderId: order1.id, productId: products[0].id, quantity: 1, unitPrice: 1299.99 },
      { orderId: order1.id, productId: products[10].id, quantity: 1, unitPrice: 79.99 },
      { orderId: order1.id, productId: products[9].id, quantity: 1, unitPrice: 149.99 },
    ]);

    const order2 = await Order.create({
      userId: customer1.id,
      status: 'Shipped',
      total: 699.99,
      shippingAddress: '123 Tech Lane, San Francisco, CA 94102',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
    });
    await OrderItem.bulkCreate([
      { orderId: order2.id, productId: products[6].id, quantity: 1, unitPrice: 699.99 },
    ]);

    const order3 = await Order.create({
      userId: customer1.id,
      status: 'Processing',
      total: 2279.98,
      shippingAddress: '123 Tech Lane, San Francisco, CA 94102',
      createdAt: yesterday,
      updatedAt: yesterday,
    });
    await OrderItem.bulkCreate([
      { orderId: order3.id, productId: products[2].id, quantity: 1, unitPrice: 2199.99 },
      { orderId: order3.id, productId: products[11].id, quantity: 1, unitPrice: 89.99 },
    ]);

    const order4 = await Order.create({
      userId: customer2.id,
      status: 'Out for Delivery',
      total: 3499.99,
      shippingAddress: '456 Innovation Ave, Austin, TX 78701',
      createdAt: tenDaysAgo,
      updatedAt: tenDaysAgo,
    });
    await OrderItem.bulkCreate([
      { orderId: order4.id, productId: products[3].id, quantity: 1, unitPrice: 3499.99 },
    ]);

    console.log('✅ Orders seeded');

    // Return request on the old delivered order (within 14 days won't apply here — admin can override)
    await Return.create({
      orderId: order2.id,
      userId: customer1.id,
      reason: 'The monitor arrived with a dead pixel cluster in the center of the screen. Requesting replacement or refund.',
      status: 'Requested',
    });

    console.log('✅ Returns seeded');
    console.log('\n🎉 Seed complete!\n');
    console.log('Demo accounts:');
    console.log('  Admin:     admin@northstar.com   / admin123');
    console.log('  Customer:  alex@example.com      / customer123');
    console.log('  Customer:  sam@example.com       / demo123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
