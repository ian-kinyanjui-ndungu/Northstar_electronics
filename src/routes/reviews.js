const express = require('express');
const { Review, User, Product } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const router = express.Router();

// GET reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId, status: 'Approved' },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    // Compute avg
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ reviews, avgRating: parseFloat(avg), total: reviews.length });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST create review
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body;
    if (!productId || !rating || !body) return res.status(400).json({ error: 'productId, rating, body required' });
    const existing = await Review.findOne({ where: { productId, userId: req.user.id } });
    if (existing) return res.status(409).json({ error: 'You already reviewed this product' });
    const review = await Review.create({ productId, userId: req.user.id, rating, title, body });
    res.status(201).json(review);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET all reviews (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Product, as: 'product', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// PUT moderate review (admin)
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ error: 'Not found' });
    await review.update({ status: req.body.status });
    res.json(review);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
