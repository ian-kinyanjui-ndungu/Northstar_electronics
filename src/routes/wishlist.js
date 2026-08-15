const express = require('express');
const { Wishlist, Product } = require('../models/index');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{ model: Product, as: 'product' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(items);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:productId', authenticate, async (req, res) => {
  try {
    const exists = await Wishlist.findOne({ where: { userId: req.user.id, productId: req.params.productId } });
    if (exists) { await exists.destroy(); return res.json({ added: false }); }
    await Wishlist.create({ userId: req.user.id, productId: req.params.productId });
    res.json({ added: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    await Wishlist.destroy({ where: { userId: req.user.id, productId: req.params.productId } });
    res.json({ removed: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
