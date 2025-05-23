const { createNotification } = require('../services/notificationService');

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
            res.status(500).json({ error: 'Failed to send notification' });
        }
    }
}

module.exports = new NotificationController();