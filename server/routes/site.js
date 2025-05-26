const express = require('express');
const router = express.Router();
const ConfigurationController = require('../app/controllers/ConfigurationController');

const { authenticateToken, authorizeRoles } = require('../app/middlewares/auth');

router.post('/semesters/new', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.addSemester);
router.get('/configurations/common/all', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.getCommonConfigurations);
router.put('/configurations/common/update', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.updateCommonConfigurations);
router.put('/configurations/:semesterId/update', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.updateSemesterConfigurations);
router.get('/configurations/:semesterId', authenticateToken, authorizeRoles(['admin', 'moderator']), ConfigurationController.getConfigurationsBySemester);

module.exports = router;