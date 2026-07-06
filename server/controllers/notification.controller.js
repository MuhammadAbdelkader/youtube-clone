const Notification = require('../models/notification.model');

// ─── Helper: create a notification (fire-and-forget, won't crash callers) ────
const createNotification = async (data) => {
    try {
        // Don't notify yourself
        if (data.recipient.toString() === data.sender.toString()) return;
        await Notification.create(data);
    } catch (err) {
        console.warn('[Notifications] Failed to create notification (non-critical):', err.message);
    }
};

// @desc    Get logged in user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ recipient: req.user.userId })
                .sort({ createdAt: -1 })
                .skip(startIndex)
                .limit(limit)
                .populate('sender', 'username avatar_url')
                .populate('video', 'title thumbnailUrl')
                .populate('channel', 'title avatar'),
            Notification.countDocuments({ recipient: req.user.userId }),
        ]);

        res.status(200).json({
            success: true,
            count: notifications.length,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            data: notifications,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({ recipient: req.user.userId, isRead: false });
        res.status(200).json({ success: true, count });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark a specific notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ recipient: req.user.userId, isRead: false }, { isRead: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
};

// Export helper for use in other controllers
exports.createNotification = createNotification;

