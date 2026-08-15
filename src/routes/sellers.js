const express = require('express');
const { Op } = require('sequelize');
const { Seller, User, Product, Order, WithdrawalRequest } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Helper: get Active seller or throw
async function requireActiveSeller(userId) {
  const seller = await Seller.findOne({ where: { userId } });
  if (!seller) throw Object.assign(new Error('No seller account found'), { status: 404 });
  if (seller.status !== 'Active') throw Object.assign(new Error('Your seller account is pending admin approval. You cannot add products yet.'), { status: 403 });
  return seller;
}

// POST /api/sellers/register
router.post('/register', authenticate, async (req, res) => {
  try {
    const exists = await Seller.findOne({ where: { userId: req.user.id } });
    if (exists) return res.status(409).json({ error: 'You already have a seller account' });
    const { businessName, description, email, phone, address, country } = req.body;
    if (!businessName || !email) return res.status(400).json({ error: 'Business name and email required' });
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const seller = await Seller.create({ userId: req.user.id, businessName, slug, description, email, phone, address, country, status: 'Pending', kycStatus: 'Pending' });
    res.status(201).json(seller);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/sellers/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    res.json(seller);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/sellers/me
router.put('/me', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    const { businessName, description, email, phone, address } = req.body;
    await seller.update({ businessName, description, email, phone, address });
    res.json(seller);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/sellers/withdraw
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    const { amount, method } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (parseFloat(amount) > parseFloat(seller.walletBalance)) return res.status(400).json({ error: 'Insufficient wallet balance' });
    const req_ = await WithdrawalRequest.create({ sellerId: seller.id, amount, method: method || 'Bank Transfer' });
    res.status(201).json(req_);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/sellers/withdrawals
router.get('/withdrawals', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    const withdrawals = await WithdrawalRequest.findAll({ where: { sellerId: seller.id }, order: [['createdAt', 'DESC']] });
    res.json(withdrawals);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Seller product routes ────────────────────────────────────────────────────

// GET /api/sellers/my-products
router.get('/my-products', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    const products = await Product.findAll({ where: { sellerId: seller.id }, order: [['createdAt', 'DESC']] });
    res.json({ seller, products });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/sellers/my-products — seller must be Active; product starts Pending
router.post('/my-products', authenticate, async (req, res) => {
  try {
    const seller = await requireActiveSeller(req.user.id);
    const { name, description, price, category, stock, image } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'Name, price, and category are required' });
    const product = await Product.create({
      name, description, price, category,
      stock: stock || 0, image: image || null,
      featured: false, sellerId: seller.id, approvalStatus: 'Pending',
    });
    res.status(201).json(product);
  } catch (e) { res.status(e.status || 500).json({ error: e.message || 'Server error' }); }
});

// PUT /api/sellers/my-products/:id — edit own product, resets to Pending
router.put('/my-products/:id', authenticate, async (req, res) => {
  try {
    const seller = await requireActiveSeller(req.user.id);
    const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
    if (!product) return res.status(404).json({ error: 'Product not found or not yours' });
    const { name, description, price, category, stock, image } = req.body;
    await product.update({ name, description, price, category, stock, image, approvalStatus: 'Pending' });
    res.json(product);
  } catch (e) { res.status(e.status || 500).json({ error: e.message || 'Server error' }); }
});

// DELETE /api/sellers/my-products/:id
router.delete('/my-products/:id', authenticate, async (req, res) => {
  try {
    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ error: 'No seller account' });
    const product = await Product.findOne({ where: { id: req.params.id, sellerId: seller.id } });
    if (!product) return res.status(404).json({ error: 'Product not found or not yours' });
    await product.destroy();
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const sellers = await Seller.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Product, as: 'products', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(sellers);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/admin/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) return res.status(404).json({ error: 'Not found' });
    await seller.update({ status: req.body.status, kycStatus: req.body.kycStatus || seller.kycStatus });
    res.json(seller);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/admin/withdrawals/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const wr = await WithdrawalRequest.findByPk(req.params.id);
    if (!wr) return res.status(404).json({ error: 'Not found' });
    await wr.update({ status: req.body.status, notes: req.body.notes });
    if (req.body.status === 'Paid') {
      const seller = await Seller.findByPk(wr.sellerId);
      if (seller) await seller.update({ walletBalance: Math.max(0, parseFloat(seller.walletBalance) - parseFloat(wr.amount)) });
    }
    res.json(wr);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/sellers/admin/pending-products — all Pending seller products
router.get('/admin/pending-products', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { approvalStatus: 'Pending', sellerId: { [Op.ne]: null } },
      include: [{ model: Seller, as: 'seller' }],
      order: [['createdAt', 'ASC']],
    });
    res.json(products);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/sellers/admin/products/:id/approve — approve or reject a seller product
router.put('/admin/products/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { approvalStatus } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(approvalStatus)) return res.status(400).json({ error: 'Invalid status' });
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sellerId) return res.status(400).json({ error: 'Not a seller product' });
    await product.update({ approvalStatus });
    res.json(product);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
