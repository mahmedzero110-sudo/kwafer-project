const Notification = require('../models/Notification');

exports.markAllRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark All Read Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.markAsRead(id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark Read Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.delete(id, req.user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
