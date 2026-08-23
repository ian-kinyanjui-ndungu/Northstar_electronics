const express = require('express');
const router = express.Router();

// Cart is stored client-side in localStorage.
// These endpoints provide stock validation support.

const { Product } = require('../models/index');

// POST /api/cart/validate — validate cart items before checkout
router.post('/validate', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.json({ valid: true, issues: [] });

    const issues = [];
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        issues.push({ productId: item.productId, error: 'Product not found' });
      } else if (product.stock < item.quantity) {
        issues.push({
          productId: item.productId,
          name: product.name,
          requested: item.quantity,
          available: product.stock,
          error: product.stock === 0 ? 'Out of stock' : `Only ${product.stock} in stock`,
        });
      }
    }

    res.json({ valid: issues.length === 0, issues });
  } catch (err) {
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;
