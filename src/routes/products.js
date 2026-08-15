const express = require('express');
const { Op } = require('sequelize');
const { Product, Seller } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// ─── Public: list products ───────────────────────────────────────────────────
// Only show Approved products to the public
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, featured, limit, offset, sellerId } = req.query;
    const where = { approvalStatus: 'Approved' };

    if (category) where.category = category;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (featured === 'true') where.featured = true;
    if (sellerId) where.sellerId = parseInt(sellerId);

    const products = await Product.findAndCountAll({
      where,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
      order: [['featured', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Public: single product ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Admin: create platform product ──────────────────────────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, stock, image, featured } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'Name, price, category required' });
    // Admin products are platform-owned (sellerId = null) and pre-approved
    const product = await Product.create({
      name, description, price, category,
      stock: stock || 0, image, featured: featured || false,
      sellerId: null, approvalStatus: 'Approved',
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Admin: update any product ────────────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const { name, description, price, category, stock, image, featured, approvalStatus } = req.body;
    await product.update({ name, description, price, category, stock, image, featured, approvalStatus });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Admin: delete any product ────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
