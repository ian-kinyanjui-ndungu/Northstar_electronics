const express = require('express');
const { Order, OrderItem, Product, Return, User } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await order.update({ status });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/returns
router.get('/returns', async (req, res) => {
  try {
    const returns = await Return.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Order, as: 'order' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/returns/:id
router.put('/returns/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['Requested', 'Approved', 'Rejected', 'Refunded'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const ret = await Return.findByPk(req.params.id);
    if (!ret) return res.status(404).json({ error: 'Return not found' });
    await ret.update({ status, adminNotes });
    res.json(ret);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/products — list all
router.get('/products', async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
