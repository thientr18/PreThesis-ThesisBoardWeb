const express = require('express');
const router = express.Router();
const StudentController = require("../app/controllers/StudentController");
const NotificationController = require("../app/controllers/NotificationController");
const StorageController = require("../app/controllers/StorageController");
const { 
    uploadPreThesisReportFile, 
    uploadPreThesisProjectFile, 
    uploadThesisReportFile, 
    uploadThesisProjectFile, 
    uploadThesisPresentationFile 
} = require("../app/utils/multer");

router.get('/notifications', NotificationController.getNotifications);
router.patch('/notifications/:id/read', NotificationController.readNotifications);

router.get('/profile/', StudentController.getProfile);

router.get('/topic-list/', StudentController.getTopics);
router.post('/apply-topic/:topicId', StudentController.applyTopic);
router.get('/applied-topic', StudentController.getAppliedTopic);
router.post('/cancel-topic/:topicId', StudentController.cancelTopic);
router.get('/pre-thesis/:semesterId', StudentController.getPreThesis);
router.post('/pre-thesis/:preThesisId/submit-report', uploadPreThesisReportFile, StorageController.submitPreThesisReport);
router.post('/pre-thesis/:preThesisId/submit-project', uploadPreThesisProjectFile, StorageController.submitPreThesisProject);
router.post('/pre-thesis/:preThesisId/submit-video', StorageController.submitPreThesisVideoUrl);
router.get('/pre-thesis/files/download/:filename', StorageController.downloadFilePreThesis);

router.get('/thesis/contact-supervisor', StudentController.getThesisContacts);
router.get('/thesis/:semesterId', StudentController.getThesis);
router.post('/thesis/:thesisId/submit-report', uploadThesisReportFile, StorageController.submitThesisReport);
router.post('/thesis/:thesisId/submit-project', uploadThesisProjectFile, StorageController.submitThesisProject);
router.post('/thesis/:thesisId/submit-presentation', uploadThesisPresentationFile, StorageController.submitThesisPresentation);
router.post('/thesis/:thesisId/submit-video', StorageController.submitThesisVideoUrl);
router.get('/thesis/files/download/:filename', StorageController.downloadFileThesis);

module.exports = router;