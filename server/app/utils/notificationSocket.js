const connectedUsers = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('identify', (userId) => {
            connectedUsers.set(userId, socket.id);
            console.log(`User ${userId} connected with socket ID ${socket.id}`);
        });

        socket.on('disconnect', () => {
            for (const [userId, id] of connectedUsers.entries()) {
                if (id === socket.id) {
                connectedUsers.delete(userId);
                console.log(`User ${userId} disconnected`);
                break;
                }
            }
        });
    });

    return {
        sendNotification: (userId, notification) => {
            const socketId = connectedUsers.get(userId);
            if (socketId) {
                io.to(socketId).emit('notification', notification);
                console.log(`Notification sent to user ${userId}`);
            } else {
                console.log(`User ${userId} is not connected`);
            }
        },
    };
};
