const express = require('express');
const { Coupon, Brand, Category, Banner, AuditLog, User } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// All routes require admin
router.use(authenticate, requireAdmin);

// --- Coupons ---
router.get('/coupons', async (req, res) => {
  try { res.json(await Coupon.findAll({ order: [['createdAt', 'DESC']] })); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/coupons', async (req, res) => {
  try {
    const c = await Coupon.create(req.body);
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/coupons/:id', async (req, res) => {
  try {
    const c = await Coupon.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    await c.update(req.body);
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/coupons/:id', async (req, res) => {
  try { await Coupon.destroy({ where: { id: req.params.id } }); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Brands ---
router.get('/brands', async (req, res) => {
  try { res.json(await Brand.findAll({ order: [['name', 'ASC']] })); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/brands', async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const b = await Brand.create({ name, slug, description });
    res.status(201).json(b);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/brands/:id', async (req, res) => {
  try {
    const b = await Brand.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    await b.update(req.body);
    res.json(b);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/brands/:id', async (req, res) => {
  try { await Brand.destroy({ where: { id: req.params.id } }); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Categories ---
router.get('/categories', async (req, res) => {
  try {
    const cats = await Category.findAll({ include: [{ model: Category, as: 'children' }], where: { parentId: null }, order: [['name', 'ASC']] });
    res.json(cats);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/categories', async (req, res) => {
  try {
    const { name, parentId, icon } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const c = await Category.create({ name, slug, parentId: parentId || null, icon });
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/categories/:id', async (req, res) => {
  try {
    const c = await Category.findByPk(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    await c.update(req.body);
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/categories/:id', async (req, res) => {
  try { await Category.destroy({ where: { id: req.params.id } }); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Banners (CMS) ---
router.get('/banners', async (req, res) => {
  try { res.json(await Banner.findAll({ order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']] })); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.post('/banners', async (req, res) => {
  try { const b = await Banner.create(req.body); res.status(201).json(b); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/banners/:id', async (req, res) => {
  try {
    const b = await Banner.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    await b.update(req.body);
    res.json(b);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.delete('/banners/:id', async (req, res) => {
  try { await Banner.destroy({ where: { id: req.params.id } }); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Audit Logs ---
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// --- Users (admin) ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'createdAt'], order: [['createdAt', 'DESC']] });
    res.json(users);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});
router.put('/users/:id/role', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.role === 'admin' && req.body.role !== 'admin') {
      // prevent demoting last admin
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) return res.status(400).json({ error: 'Cannot demote the last admin account.' });
    }
    await user.update({ role: req.body.role });
    res.json({ id: user.id, role: user.role });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last admin account.' });
    }
    await user.destroy();
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
