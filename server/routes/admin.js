const express = require('express');
const router = express.Router();
const AdminController = require("../app/controllers/AdminController");

// router.get('/announcements/dashboard/', AdminController.getAnnouncementDashboard);
router.put('/announcements/:id/update', AdminController.updateAnnouncement);
router.delete('/announcements/:id/delete', AdminController.deleteAnnouncement);
router.get('/announcements/:id', AdminController.getAnnouncementById);
router.post('/announcements/new', AdminController.createAnnouncement);
router.get('/announcements/sent', AdminController.getSentAnnouncements);
router.get('/announcements/', AdminController.getAnnouncements);

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