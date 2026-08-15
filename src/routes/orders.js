const express = require('express');
const { sequelize } = require('../database/connection');
const { Order, OrderItem, Product, Return } = require('../models/index');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/orders — current user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Return, as: 'returnRequest' },
      ],
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/orders — checkout
router.post('/', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !items.length) {
      await t.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }
    if (!shippingAddress) {
      await t.rollback();
      return res.status(400).json({ error: 'Shipping address required' });
    }

    // Validate and reserve stock
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(409).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          productId: product.id,
        });
      }
      await product.update({ stock: product.stock - item.quantity }, { transaction: t });
      total += parseFloat(product.price) * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price });
    }

    const order = await Order.create({
      userId: req.user.id,
      status: 'Processing',
      total: total.toFixed(2),
      shippingAddress,
    }, { transaction: t });

    for (const oi of orderItems) {
      await OrderItem.create({ ...oi, orderId: order.id }, { transaction: t });
    }

    await t.commit();

    const full = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
    });
    res.status(201).json(full);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

module.exports = router;
