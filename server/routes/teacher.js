const express = require('express');
const router = express.Router();
const TeacherController = require("../app/controllers/TeacherController");
const AnnouncementController = require("../app/controllers/AnnouncementController");

// router.get('/announcements/dashboard/', TeacherControler.getAnnouncementDashboard);
// router.put('/announcements/:id/update', AnnouncementController.updateAnnouncement);
// router.delete('/announcements/:id/delete', AnnouncementController.deleteAnnouncement);
// router.get('/announcements/:id', AnnouncementController.getAnnouncementById);
// router.post('/announcements/new', AnnouncementController.createAnnouncement);
// router.get('/announcements/sent', AnnouncementController.getSentAnnouncements);
// router.get('/announcements/', AnnouncementController.getAnnouncements);

// router.put('/change-password', TeacherControler.changePassword);
// router.put('/profile/update', TeacherControler.updateProfile);
// router.get('/profile/', TeacherControler.getProfile);
// router.get('/semesters', TeacherControler.getSemesters);

router.get('/profile/', TeacherController.getProfile);
router.get('/topic/', TeacherController.getTopics);
router.post('/topic/', TeacherController.createTopic);
router.put('/topic/:topicId', TeacherController.updateTopic);
router.post('/pre-thesis/registration/:registrationId/approve', TeacherController.approvePreThesisRegistration);
router.post('/pre-thesis/registration/:registrationId/reject', TeacherController.rejectPreThesisRegistration);
router.get('/pre-thesis/registration', TeacherController.getPreThesisRegistration);
router.post('/thesis/assigned/:studentId/new', TeacherController.assignThesis);
router.post('/thesis/assigned/:studentId/update', TeacherController.updateThesis);
router.delete('/thesis/assigned/:studentId/delete', TeacherController.deleteThesis);
router.get('/thesis/assigned', TeacherController.getThesisStudents);

module.exports = router;