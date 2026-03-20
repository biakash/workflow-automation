const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// @route   GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const filter = {
      $or: [
        { recipientUser: req.user._id },
        { recipientRole: req.user.role },
      ],
    };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (page - 1) * limit;
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });
    const total = await Notification.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: { notifications, unreadCount, total },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PATCH /api/notifications/mark-all-read
router.patch('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipientUser: req.user._id }, { recipientRole: req.user.role }],
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;