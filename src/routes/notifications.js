const express = require('express');
const { Notification } = require('../models/index');
const { authenticate, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifs = await Notification.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json(notifs);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Broadcast (admin only)
router.post('/broadcast', authenticate, requireAdmin, async (req, res) => {
  try {
    const { User } = require('../models/index');
    const users = await User.findAll({ attributes: ['id'] });
    await Notification.bulkCreate(users.map(u => ({ userId: u.id, type: req.body.type || 'info', title: req.body.title, message: req.body.message })));
    res.json({ sent: users.length });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
