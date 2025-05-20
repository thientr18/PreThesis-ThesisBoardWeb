const express = require('express');
const router = express.Router();
const StudentController = require("../app/controllers/StudentController");

router.get('/profile/', StudentController.getProfile);
router.get('/topic-list/', StudentController.getTopics);
router.post('/apply-topic/:topicId', StudentController.applyTopic);
router.get('/applied-topic', StudentController.getAppliedTopic);
router.post('/cancel-topic/:topicId', StudentController.cancelTopic);
router.get('/thesis/contact-supervisor', StudentController.getThesisContact);

module.exports = router;