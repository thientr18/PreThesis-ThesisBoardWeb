const express = require('express');
const router = express.Router();
const ConfigurationController = require('../app/controllers/ConfigurationController');
const AnnouncementController = require('../app/controllers/AnnouncementController');

const { authenticateToken, authorizeRoles } = require('../app/middlewares/auth');

router.post('/semesters/new', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.addSemester);
router.get('/configurations/common/all', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.getCommonConfigurations);
router.put('/configurations/common/update', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.updateCommonConfigurations);
router.put('/configurations/:semesterId/update', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.updateSemesterConfigurations);
router.get('/configurations/:semesterId', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.getConfigurationsBySemester);

router.post('/announcement', authenticateToken, authorizeRoles(['admin', 'moderator']), AnnouncementController.createAnnouncement);
router.put('/announcement/:id', authenticateToken, authorizeRoles(['admin', 'moderator']), AnnouncementController.updateAnnouncement);
router.delete('/announcement/:id', authenticateToken, authorizeRoles(['admin', 'moderator']), AnnouncementController.deleteAnnouncement);
router.get('/announcement', authenticateToken, AnnouncementController.getAnnouncements);
router.get('/announcement/:id', authenticateToken, AnnouncementController.getAnnouncementById);
module.exports = router;