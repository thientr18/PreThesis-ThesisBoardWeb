const express = require('express');
const router = express.Router();
const AdminController = require("../app/controllers/AdminController");
const AnnouncementController = require("../app/controllers/AnnouncementController");

// router.get('/announcements/dashboard/', AdminController.getAnnouncementDashboard);
router.put('/announcements/:id/update', AnnouncementController.updateAnnouncement);
router.delete('/announcements/:id/delete', AnnouncementController.deleteAnnouncement);
router.get('/announcements/:id', AnnouncementController.getAnnouncementById);
router.post('/announcements/new', AnnouncementController.createAnnouncement);
router.get('/announcements/sent', AnnouncementController.getSentAnnouncements);
router.get('/announcements/', AnnouncementController.getAnnouncements);

router.get('/home', AdminController.getHomePage);
router.put('/change-password', AdminController.changePassword);
router.put('/profile/update', AdminController.updateProfile);
router.get('/profile/', AdminController.getProfile);
router.get('/semesters', AdminController.getSemesters);

router.post('/students/new', AdminController.createStudent);
router.put('/students/:studentId/update', AdminController.updateStudent);
// router.get('/students/:studentId', AdminController.getStudentById);
router.get('/students/dashboard', AdminController.getStudentDashboard);
router.get('/students', AdminController.getStudents);

router.post('/teachers/new', AdminController.createTeacher);
router.put('/teachers/:teacherId/update', AdminController.updateTeacher);
// router.get('/teachers/:teacherId', AdminController.getTeacherById);
router.get('/teachers/dashboard', AdminController.getTeacherDashboard);
router.get('/teachers', AdminController.getTeachers);

router.post('/moderators/new', AdminController.createModerator);
router.put('/moderators/:moderatorId/update', AdminController.updateModerator);
// router.get('/moderators/:moderatorId', AdminController.getModeratorById);
router.get('/moderators/dashboard', AdminController.getModeratorDashboard);
router.get('/moderators', AdminController.getModerators);

module.exports = router;