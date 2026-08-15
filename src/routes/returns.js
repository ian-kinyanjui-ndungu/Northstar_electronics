const express = require('express');
const { Return, Order } = require('../models/index');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const RETURN_WINDOW_DAYS = 14;

// POST /api/returns — create return request
router.post('/', authenticate, async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: 'Order ID and reason required' });

    const order = await Order.findOne({ where: { id: orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be returned' });
    }

    // Enforce 14-day return window
    const purchaseDate = new Date(order.createdAt);
    const daysSincePurchase = Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSincePurchase > RETURN_WINDOW_DAYS) {
      return res.status(400).json({
        error: `Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of purchase. This order was placed ${daysSincePurchase} days ago.`,
      });
    }

    // Check for existing return
    const existing = await Return.findOne({ where: { orderId } });
    if (existing) return res.status(409).json({ error: 'A return request already exists for this order' });

    const returnRequest = await Return.create({
      orderId,
      userId: req.user.id,
      reason,
      status: 'Requested',
    });

    res.status(201).json(returnRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/returns — user's return requests
router.get('/', authenticate, async (req, res) => {
  try {
    const returns = await Return.findAll({
      where: { userId: req.user.id },
      include: [{ model: Order, as: 'order' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
