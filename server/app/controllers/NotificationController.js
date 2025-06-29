const { createNotification } = require('../services/notificationService');
const Notification = require('../models/monongoDB/Notification');

class NotificationController {
    async sendNotification(req, res) {
        const { recipientId, type, title, message } = req.body;
        if (!recipientId || !type || !title || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        try {
            const notification = await createNotification({ recipientId, type, title, message });
            // Emit the notification using Socket.IO
            req.app.get('socketService').sendNotification(recipientId, notification);
            res.status(201).json(notification);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to send notification' });
        }
    }

    async getNotifications(req, res) {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const recipientId = userId;
        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient ID is required' });
        }
        try {
            const notifications = await Notification.find({ recipientId }).sort({ createdAt: -1 });
            res.status(200).json(notifications);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }

    async getNotificationById(req, res) {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const notificationId = req.params.id;
        if (!notificationId) {
            return res.status(400).json({ error: 'Notification ID is required' });
        }
        try {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.status(200).json(notification);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to fetch notification' });
        }
    }

    async readNotifications(req, res) {
        const notificationId = req.params.id;
        if (!notificationId) {
            return res.status(400).json({ error: 'Notification ID is required' });
        }
        try {
            const notification = await Notification.findById(notificationId);
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            notification.isRead = true;
            await notification.save();
            res.status(200).json(notification);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Failed to read notification' });
        }
    }

    
}

module.exports = new NotificationController();