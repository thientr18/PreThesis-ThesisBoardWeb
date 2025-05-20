const { models, sequelize } = require('../models');
const { Op } = require('sequelize');
const share = require('../utils/share');
const { getIO } = require('../utils/socket');

class AnnouncementController {
    // Route: /admin/announcements/new
    async createAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const data = req.body;
        const senderId = req.user.id;

        const announcementData = {
            senderId,
            title: data.title,
            content: data.content,
        };

        const recipientIds = data.recipientIds; // Array of user IDs
        if (!recipientIds || recipientIds.length === 0) {
            return res.status(400).json({ message: "Recipient IDs are required" });
        }
        
        try {
            const announcement = await share.createAnnouncement(announcementData, recipientIds, t);
            
            // Emit to each user
            const io = getIO();
            recipientIds.forEach(userId => {
                io.to(`user_${userId}`).emit("new-announcement", {
                    title: announcement.title,
                    content: announcement.content,
                    createdAt: announcement.createdAt,
                });
            });
            
            return announcement;
        } catch (error) {
            console.error("Error creating announcement:", error);
            res.status(500).json({ message: "Failed to create announcement" });
        }
    }
    
    // Route: /admin/announcements
    async getAnnouncements (req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        const isUnread = req.query.unread === 'true';
        
        const where = {
            userId,
            isDeleted: false
        };
        
        if (isUnread) where.isRead = false;
        
        try {
            const { count, rows } = await share.getAnnouncements({ where, limit, offset });
            if (!rows) return res.status(404).json({ message: "Announcements not found" });
        
            res.status(200).json({
                total: count,
                page,
                pageSize: rows.length,
                announcements: rows
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to load announcements' });
        }
    };

    // Route: /admin/announcements/sent
    async getSentAnnouncements(req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        try {
            const { count, rows } = await share.getSentAnnouncements(userId, limit, offset);
            if (!rows) return res.status(404).json({ message: "Sent announcements not found" });

            res.status(200).json({
                total: count,
                page,
                pageSize: rows.length,
                announcements: rows
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id
    async getAnnouncementById(req, res) {
        const userId = req.user.id;
        const announcementId = req.params.id;
        try {
            const announcement = await share.getAnnouncementById(announcementId, userId);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            // Mark as read
            await share.markAnnouncementAsRead(announcementId, userId);

            res.status(200).json(announcement);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id/update
    async updateAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const announcementId = req.params.id;
        const data = req.body;
        const announcementData = {
            title: data.title,
            content: data.content,
        };

        try {
            const announcement = await share.updateAnnouncement(announcementId, announcementData, t);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            await t.commit();
            res.status(200).json({ message: "Announcement updated successfully", data: announcement });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id/delete
    async deleteAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const announcementId = req.params.id;
        const userId = req.user.id;

        try {
            const announcement = await share.deleteAnnouncement(announcementId, userId, t);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            await t.commit();
            res.status(200).json({ message: "Announcement deleted successfully" });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

module.exports = new AnnouncementController();