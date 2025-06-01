const express = require('express');
const router = express.Router();
const AdminController = require("../app/controllers/AdminController");
const NotificationController = require("../app/controllers/NotificationController");

router.get('/notifications', NotificationController.getNotifications);
router.patch('/notifications/:id/read', NotificationController.readNotifications);

router.get('/home', AdminController.getHomePage);
router.put('/change-password', AdminController.changePassword);
router.put('/profile/update', AdminController.updateProfile);
router.get('/profile/', AdminController.getProfile);
router.get('/semesters', AdminController.getSemesters);

router.post('/students/new', AdminController.createStudent);
// router.get('/students/:studentId', AdminController.getStudentById);
router.get('/students/dashboard', AdminController.getStudentDashboard);
router.put('/students/:studentId/update', AdminController.updateStudent);
router.get('/students', AdminController.getStudents);

router.post('/teachers/new', AdminController.createTeacher);
// router.get('/teachers/:teacherId', AdminController.getTeacherById);
router.get('/teachers/dashboard', AdminController.getTeacherDashboard);
router.put('/teachers/:teacherId/update', AdminController.updateTeacher);
router.get('/teachers', AdminController.getTeachers);

router.post('/moderators/new', AdminController.createModerator);
// router.get('/moderators/:moderatorId', AdminController.getModeratorById);
router.get('/moderators/dashboard', AdminController.getModeratorDashboard);
router.put('/moderators/:moderatorId/update', AdminController.updateModerator);
router.get('/moderators', AdminController.getModerators);

router.get('/semesters/:semesterId/teachers', AdminController.getTeachersBySemester);
router.post('/semesters/:semesterId/teachers/assign', AdminController.assignTeacherToSemester);
router.post('/semesters/:semesterId/teachers/assign-multiple', AdminController.assignMultipleTeachersToSemester);
router.put('/semesters/:semesterId/teachers/:teacherId/slots', AdminController.updateTeacherSlots);
router.delete('/semesters/:semesterId/teachers/:teacherId/unassign', AdminController.unassignTeacherFromSemester);

module.exports = router;