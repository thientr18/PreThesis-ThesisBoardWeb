const express = require('express');
const router = express.Router();
const StudentController = require("../app/controllers/StudentController");

router.get('/profile/', StudentController.getProfile);
router.get('/topic-list/', StudentController.getTopics);
router.post('/apply-topic/:topicId', StudentController.applyTopic);
router.get('/applied-topic', StudentController.getAppliedTopic);
router.post('/cancel-topic/:topicId', StudentController.cancelTopic);
router.get('/pre-thesis/:preThesisId', StudentController.getPreThesis);
router.get('/thesis/contact-supervisor', StudentController.getThesisContacts);
router.get('/thesis/:thesisId', StudentController.getThesis);

module.exports = router;