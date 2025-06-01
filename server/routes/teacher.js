const express = require('express');
const router = express.Router();
const TeacherController = require("../app/controllers/TeacherController");
const NotificationController = require("../app/controllers/NotificationController");
const StorageController = require("../app/controllers/StorageController");

router.get('/notifications', NotificationController.getNotifications);
router.patch('/notifications/:id/read', NotificationController.readNotifications);

router.get('/profile/', TeacherController.getProfile);

router.get('/files/download/:filename', StorageController.downloadFilePreThesisTeacher);

router.get('/topic/', TeacherController.getTopics);
router.post('/topic/', TeacherController.createTopic);
router.put('/topic/:topicId', TeacherController.updateTopic);

router.post('/pre-thesis/registration/:registrationId/approve', TeacherController.approvePreThesisRegistration);
router.post('/pre-thesis/registration/:registrationId/reject', TeacherController.rejectPreThesisRegistration);
router.get('/pre-thesis/registration', TeacherController.getPreThesisRegistration);
router.delete('/pre-thesis/assigned/:studentId/delete', TeacherController.deletePreThesis);
router.get('/pre-thesis/assigned', TeacherController.getPreThesisStudents);
router.get('/pre-thesis/:preThesisId', TeacherController.getPreThesis);
router.post('/pre-thesis/:preThesisId/grade', TeacherController.gradePreThesis);
router.get('/pre-thesis/:preThesisId/grade', TeacherController.getPreThesisGrade);

// only moderator can assign pre-thesis
router.post('/thesis/assigned/:studentId/new', TeacherController.assignThesis);
router.post('/thesis/assigned/:studentId/update', TeacherController.updateThesis);
router.delete('/thesis/assigned/:thesisId/delete', TeacherController.deleteThesis);
router.get('/thesis/assigned', TeacherController.getThesisStudents);
router.get('/thesis/:thesisId', TeacherController.getThesis);

module.exports = router;