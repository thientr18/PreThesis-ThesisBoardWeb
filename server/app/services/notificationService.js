const Notification = require('../models/monongoDB/Notification');

async function createNotification({ recipientId, type, title, message }) {
    const notification = new Notification({
        recipientId,
        type,
        title,
        message,
    });

    await notification.save();
    return notification;
}

module.exports = {
  createNotification,
};