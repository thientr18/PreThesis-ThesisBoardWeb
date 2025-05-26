const express = require('express');
const router = express.Router();
const StudentController = require("../app/controllers/StudentController");
const NotificationController = require("../app/controllers/NotificationController");

router.get('/notifications', NotificationController.getNotifications);
router.patch('/notifications/:id/read', NotificationController.readNotifications);
router.get('/profile/', StudentController.getProfile);
router.get('/topic-list/', StudentController.getTopics);
router.post('/apply-topic/:topicId', StudentController.applyTopic);
router.get('/applied-topic', StudentController.getAppliedTopic);
router.post('/cancel-topic/:topicId', StudentController.cancelTopic);
router.get('/pre-thesis/:semesterId', StudentController.getPreThesis);
router.get('/thesis/contact-supervisor', StudentController.getThesisContacts);
router.get('/thesis/:semesterId', StudentController.getThesis);

module.exports = router;