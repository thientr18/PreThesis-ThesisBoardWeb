const mongoose = require('mongoose');
const AnnouncementSchema = require('../models/monongoDB/Announcement');
const Announcement = mongoose.model('Announcement', AnnouncementSchema);

class AnnouncementController {
    async createAnnouncement(req, res) {
        try {
            const { title, content, targetAudience, attachments, expiresAt } = req.body;
            if (!title || !content) {
                return res.status(400).json({ error: 'Title and content are required' });
            }
            const createdBy = req.user.id; // assuming user is authenticated
            const announcement = await Announcement.create({
                title,
                content,
                targetAudience,
                attachments,
                createdBy,
                expiresAt
            });
            res.status(201).json(announcement);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create announcement' });
        }
    }

    async getAnnouncements(req, res) {
        try {
            const announcements = await Announcement.find().sort({ createdAt: -1 });
            res.status(200).json(announcements);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch announcements' });
        }
    }

    async getAnnouncementById(req, res) {
        try {
            const { id } = req.params;
            const announcement = await Announcement.findById(id);
            if (!announcement) {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            res.status(200).json(announcement);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch announcement' });
        }
    }

    async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const announcement = await Announcement.findByIdAndUpdate(id, updateData, { new: true });
            if (!announcement) {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            res.status(200).json(announcement);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update announcement' });
        }
    }

    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const announcement = await Announcement.findByIdAndDelete(id);
            if (!announcement) {
                return res.status(404).json({ error: 'Announcement not found' });
            }
            res.status(200).json({ message: 'Announcement deleted' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete announcement' });
        }
    }
}

module.exports = new AnnouncementController();