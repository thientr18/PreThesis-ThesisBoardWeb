const express = require('express');
const router = express.Router();
const AdminController = require("../app/controllers/AdminController");
const NotificationController = require("../app/controllers/NotificationController");

router.get('/notifications', NotificationController.getNotifications);
router.get('/notifications/all', NotificationController.getAllNotifications);
router.patch('/notifications/:id/read', NotificationController.readNotifications);

router.get('/home', AdminController.getHomePage);
router.put('/change-password', AdminController.changePassword);
router.put('/profile/update', AdminController.updateProfile);
router.get('/profile/', AdminController.getProfile);
router.get('/semesters', AdminController.getSemesters);
router.get('/topics/available', AdminController.getAvailablePreThesisTopics);

router.get('/teachers/active', AdminController.getActiveTeachers);
router.get('/semesters/:semesterId/theses', AdminController.getThesesBySemester);
router.post('/theses/:thesisId/assign-reviewer', AdminController.assignReviewerToThesis);
router.post('/theses/:thesisId/assign-committee', AdminController.assignCommitteeToThesis);
router.post('/theses/:thesisId/set-defense-date', AdminController.setThesisDefenseDate);
router.get('/theses/:thesisId/export-registration', AdminController.exportThesisRegistrationReport);
router.get('/theses/:thesisId/export-final', AdminController.exportThesisFinalReport);
router.get('/prethesis', AdminController.getPreThesesBySemester);
router.get('/prethesis/:preThesisId/export-final', AdminController.exportPreThesisFinalReport);

router.post('/students/new', AdminController.createStudent);
router.post('/students/prethesis-assign-random', AdminController.assignPreThesisRandomly);
router.post('/students/prethesis-assign-specific', AdminController.assignPreThesisToSpecificTopic);
router.post('/students/thesis-assign-random', AdminController.assignThesisRandomly);
router.post('/students/thesis-assign-specific', AdminController.assignThesisToSpecificTeacher);
router.put('/students/:studentId/update', AdminController.updateStudent);
router.get('/students', AdminController.getStudents);

router.post('/teachers/new', AdminController.createTeacher);
router.get('/teachers/slots', AdminController.getTeachersWithSlots);
router.put('/teachers/:teacherId/update', AdminController.updateTeacher);
router.get('/teachers', AdminController.getTeachers);

router.post('/moderators/new', AdminController.createModerator);
router.put('/moderators/:moderatorId/update', AdminController.updateModerator);
router.get('/moderators', AdminController.getModerators);

router.get('/semesters/:semesterId/teachers', AdminController.getTeachersBySemester);
router.post('/semesters/:semesterId/teachers/assign', AdminController.assignTeacherToSemester);
router.post('/semesters/:semesterId/teachers/assign-multiple', AdminController.assignMultipleTeachersToSemester);
router.put('/semesters/:semesterId/teachers/:teacherId/slots', AdminController.updateTeacherSlots);
router.delete('/semesters/:semesterId/teachers/:teacherId/unassign', AdminController.unassignTeacherFromSemester);

module.exports = router;