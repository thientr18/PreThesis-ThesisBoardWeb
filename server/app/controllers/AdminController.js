const { models, sequelize } = require('../models');
const Joi = require('joi');
const { Op } = require('sequelize');
const share = require('../utils/share');
const Configuration = require('../models/monongoDB/Configuration');
const { createNotification } = require('../services/notificationService');
const PDFDocument = require('pdfkit');
const path = require('path');

class AdminController {
    // Route: /admin/profile
    async getProfile(req, res) {
        const userId = req.user.id;
        try {
            const profile = await share.getUserDataById(userId);
            if (!profile) return res.status(404).json({ message: "User not found" });

            res.status(200).json(profile);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
    // Route: /admin/profile/update
    async updateProfile(req, res) {
        const t = await sequelize.transaction();
        const userId = req.user.id;
        const data = req.body;
        const profileData = {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
        };

        try {
            const profile = await share.updateAdminById(userId, profileData, t);
            if (!profile) return res.status(404).json({ message: "User not found" });

            await t.commit();

            res.status(200).json({profile, message: "Profile updated successfully" });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/change-password
    async changePassword(req, res) {
        const t = await sequelize.transaction();
        const userId = req.user.id;
        const data = req.body;
        const passwordData = {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
        };

        try {
            const user = await share.getUserById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            const isValidPassword = await share.comparePassword(passwordData.oldPassword, user.password);
            if (!isValidPassword) return res.status(400).json({ message: "Invalid password" });

            await share.updateUserById(userId, { password: passwordData.newPassword }, t);

            await t.commit();

            res.status(200).json({ message: "Password changed successfully" });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/active-semester
    async activeSemester(req, res) {
        const id = req.params.id;
        try {
            const semester = await models.Semester.setActiveSemester(id);
            res.status(200).json({ message: "Active semester updated successfully", semester });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // APPLICATIONS
    // Route: /admin/home
    async getHomePage(req, res) {
        try {
            const semester = await models.Semester.findOne({
                where: { isActive: true },
                attributes: ['id', 'name']
            });
            if (!semester) return res.status(404).json({ message: "Semester not found" });

            const semesterId = semester.id;

            const totalStudents = await models.StudentSemester.count({ where: { semesterId } });
            const totalTeachers = await models.Teacher.count({ where: { status: "active" } });
            const totalPreThesis = await models.PreThesis.count({
                include: {
                    model: models.Topic,
                    as: 'preThesisTopic',
                    where: { semesterId }
                }
            });
            const totalThesis = await models.Thesis.count({ where: { semesterId } });

            res.status(200).json({ semester, totalStudents, totalTeachers, totalPreThesis, totalThesis });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/students/
    async getStudents(req, res) {
        let semesterId = req.query.semesterId || req.query.semester;

        try {
            const students = await share.getStudentsBySemesterId(semesterId);
            if (!students) return res.status(404).json({ message: "Student not found" });
            
            res.status(200).json(students);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/semesters
    async getSemesters(req, res) {
        try {
            const semesters = await models.Semester.findAll({
                order: [['createdAt', 'DESC']]
            });
            if (!semesters) return res.status(404).json({ message: "Semester not found" });

            // get semester's data from mongodb which is stored in mongodb configuration
            const semesterData = await Promise.all(semesters.map(async (semester) => {
                const configurations = await Configuration.find({ 
                    semesterId: parseInt(semester.id),
                    scope: 'semester'
                });
                
                // Return the combined semester data with configurations
                return {
                    ...semester.toJSON(), // Convert Sequelize instance to plain object
                    configurations: configurations
                };
            }));

            res.status(200).json(semesterData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/students/new
    async createStudent(req, res) {
        const t = await sequelize.transaction();
        const data = req.body;
        const studentData = {
            username: data.username, // studentId is username for student
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            credits:data.credits || 0,
            gpa: data.gpa || 0,
            type: data.type || "null",
            status: data.status || "active",
        };

        try {
            const student = await share.createStudent(studentData, t);
            if (!student) return res.status(404).json({ message: "Student not found" });

            const studentSemesterData = {
                userId: student.userId,
                studentId: student.id,
                semesterId: data.semesterId,
                type: data.type || "null",
            }

            const studentSemester = await share.createStudentSemester(studentSemesterData, t);

            const responseData = {
                student: student,
                studentSemester: studentSemester,
            }

            await t.commit();
            res.status(201).json({ message: "Student created successfully", data: responseData });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/students/:id
    // async getStudentById(req, res) {
    //     try {
    //         const student = await share.getStudentById(req.params.teacherId);
    //         if (!student) return res.status(404).json({ message: "Student not found" });
    
    //         res.status(200).json(student);
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ message: "Internal Server Error" });
    //     }
    // }

    // Route: /admin/students/:id/update
    async updateStudent(req, res) {
        const t = await sequelize.transaction();
        let transactionFinished = false;
        const studentId = req.params.studentId; // userId of student
        const data = req.body;

        const userData = {
            userId: data.userId,
            username: data.username,
        };

        const studentData = {
            userId: data.userId,
            studentId: studentId,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            credits:data.credits || 0,
            gpa: data.gpa || 0,
            status: data.status || "inactive",
        };
        const studentSemesterData = {
            studentId,
            semesterId: data.semesterId,
            type: data.type || "null",
        }

        try {
            const user = await share.updateUserById(userData, t);
            const student = await share.updateStudentById(studentId, studentData, t);
            const studentSemester = await share.updateStudentSemesters(studentSemesterData, t);

            const responseData  = {
                username: user.username,
                student,
                studentSemester,
            }
        
            await t.commit();
            transactionFinished = true;
            res.status(200).json({ message: "Student updated successfully", data: responseData });
        } catch (error) {
            console.error(error);
            if (!transactionFinished) {
                await t.rollback();
            }
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/students/prethesis-assign-random
    async assignPreThesisRandomly(req, res) {
        const t = await sequelize.transaction();
        const { studentIds, semesterId } = req.body;

        try {
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "Student IDs array is required" });
            }
            if (!semesterId) {
                await t.rollback();
                return res.status(400).json({ message: "Semester ID is required" });
            }

            // Get unregistered pre-thesis students
            const studentSemesters = await models.StudentSemester.findAll({
                where: { 
                    studentId: studentIds,
                    semesterId,
                    type: 'pre-thesis'
                },
                include: [{
                    model: models.Student,
                    as: 'student',
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }]
            });

            if (studentSemesters.length !== studentIds.length) {
                await t.rollback();
                return res.status(404).json({ message: "One or more pre-thesis students not found" });
            }

            const alreadyRegistered = studentSemesters.filter(ss => ss.isRegistered);
            if (alreadyRegistered.length > 0) {
                await t.rollback();
                return res.status(400).json({ message: "Some students are already registered" });
            }

            // Find all open topics with available slots for this semester
            let topics = await models.Topic.findAll({
                where: {
                    semesterId,
                    status: 'open',
                    remainingSlots: { [Op.gt]: 0 }
                }
            });

            // Calculate total available slots
            const totalAvailableSlots = topics.reduce(
                (sum, topic) => sum + (topic.remainingSlots || 0), 0
            );

            if (totalAvailableSlots < studentIds.length) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `Not enough pre-thesis topic slots: ${totalAvailableSlots} slot(s) available for ${studentIds.length} student(s). Please increase topic slots first.` 
                });
            }

            if (topics.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "No available pre-thesis topics" });
            }

            // Flatten topics into a pool by available slots
            let topicSlotPool = [];
            topics.forEach(topic => {
                for (let i = 0; i < topic.remainingSlots; i++) {
                    topicSlotPool.push(topic);
                }
            });

            // Shuffle the pool for randomness
            topicSlotPool = topicSlotPool.sort(() => Math.random() - 0.5);

            const assignments = [];

            for (let i = 0; i < studentSemesters.length; i++) {
                const studentSemester = studentSemesters[i];
                const topic = topicSlotPool[i];

                // Assign student to topic
                const preThesis = await models.PreThesis.create({
                    studentId: studentSemester.studentId,
                    topicId: topic.id,
                    status: 'pending',
                    createdAt: new Date()
                }, { transaction: t });

                // Decrement topic slot
                await models.Topic.decrement(
                    'remainingSlots',
                    { where: { id: topic.id }, transaction: t }
                );

                // Update student registration
                await models.StudentSemester.update(
                    { isRegistered: true },
                    { where: { studentId: studentSemester.studentId, semesterId }, transaction: t }
                );

                const topicSupervisor = await models.Teacher.findOne({
                    where: { id: topic.supervisorId },
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                });

                // Notification (optional)
                await createNotification({
                    recipientId: studentSemester.student.userId,
                    type: 'reminder',
                    title: 'Pre-Thesis Assignment Reminder',
                    message: `You have been assigned to ${topicSupervisor.fullName} for your Pre-Thesis.`
                });
                await createNotification({
                    recipientId: topicSupervisor.userId,
                    type: 'reminder',
                    title: 'New Pre-Thesis Student',
                    message: `${topicSupervisor.fullName} has been assigned to you for Pre-Thesis.`
                });

                assignments.push({
                    studentId: studentSemester.studentId,
                    studentName: studentSemester.student.fullName,
                    topicId: topic.id,
                    topic: topic.topic,
                    assignmentId: preThesis.id
                });
            }

            await t.commit();
            res.status(200).json({ message: "Pre-thesis students assigned randomly", assignments });
        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: "Failed to assign pre-thesis students randomly" });
        }
    }


    // Route: /admin/students/prethesis-assign-specific
    async assignPreThesisToSpecificTopic(req, res) {
        const t = await sequelize.transaction();
        const { studentId, topicId, semesterId } = req.body;

        try {
            if (!studentId || !topicId || !semesterId) {
                await t.rollback();
                return res.status(400).json({ message: "Student ID, Topic ID, and Semester ID are required" });
            }

            const studentSemester = await models.StudentSemester.findOne({
                where: { studentId, semesterId, type: 'pre-thesis' },
                include: [{
                    model: models.Student,
                    as: 'student',
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }]
            });

            if (!studentSemester) {
                await t.rollback();
                return res.status(404).json({ message: "Pre-thesis student not found" });
            }
            if (studentSemester.isRegistered) {
                await t.rollback();
                return res.status(400).json({ message: "Student already registered" });
            }

            // Find the topic and check slot
            const topic = await models.Topic.findOne({
                where: { id: topicId, semesterId, status: 'open' }
            });
            if (!topic || topic.remainingSlots <= 0) {
                await t.rollback();
                return res.status(400).json({ message: "Topic not available or no slots left" });
            }

            // Assign student to topic
            const preThesis = await models.PreThesis.create({
                studentId: studentSemester.studentId,
                topicId: topic.id,
                status: 'pending',
                createdAt: new Date()
            }, { transaction: t });

            // Decrement topic slot
            await models.Topic.decrement(
                'remainingSlots',
                { where: { id: topic.id }, transaction: t }
            );

            // Update student registration
            await models.StudentSemester.update(
                { isRegistered: true },
                { where: { studentId, semesterId }, transaction: t }
            );

            // Notify student and supervisor
            const topicSupervisor = await models.Teacher.findOne({
                where: { id: topic.supervisorId },
                include: [{
                    model: models.User,
                    as: 'user',
                    attributes: ['username']
                }]
            });

            await createNotification({
                recipientId: studentSemester.student.userId,
                type: 'reminder',
                title: 'Pre-Thesis Assignment Reminder',
                message: `You have been assigned to ${topicSupervisor.fullName} for your Pre-Thesis.`
            });
            await createNotification({
                recipientId: topicSupervisor.userId,
                type: 'reminder',
                title: 'New Pre-Thesis Student',
                message: `${studentSemester.student.fullName} (${studentSemester.student.user.username}) has been assigned to your topic "${topic.topic}".`
            });

            await t.commit();
            res.status(200).json({ message: "Pre-thesis student assigned to specific topic", assignmentId: preThesis.id });
        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: "Failed to assign pre-thesis student to specific topic" });
        }
    }

    // Route: /admin/students/thesis-assign-random
    async assignThesisRandomly(req, res) {
        const t = await sequelize.transaction();
        const { studentIds, semesterId } = req.body;

        try {
            if (!Array.isArray(studentIds) || studentIds.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "Student IDs array is required" });
            }
            if (!semesterId) {
                await t.rollback();
                return res.status(400).json({ message: "Semester ID is required" });
            }

            // Get unregistered thesis students
            const studentSemesters = await models.StudentSemester.findAll({
                where: { 
                    studentId: studentIds,
                    semesterId,
                    type: 'thesis'
                },
                include: [{
                    model: models.Student,
                    as: 'student',
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }]
            });

            if (studentSemesters.length !== studentIds.length) {
                await t.rollback();
                return res.status(404).json({ message: "One or more thesis students not found" });
            }

            const alreadyRegistered = studentSemesters.filter(ss => ss.isRegistered);
            if (alreadyRegistered.length > 0) {
                await t.rollback();
                return res.status(400).json({ message: "Some students are already registered" });
            }

            // Get teachers with available thesis slots
            let availableTeachers = await models.TeacherSemester.findAll({
                where: { 
                    semesterId,
                    remainingThesisSlots: { [Op.gt]: 0 }
                },
                include: [{
                    model: models.Teacher,
                    as: 'teacher',
                    where: { status: 'active' },
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }]
            });

            // Calculate total available slots
            const totalAvailableSlots = availableTeachers.reduce(
                (sum, teacher) => sum + (teacher.remainingThesisSlots || 0), 0
            );

            if (totalAvailableSlots < studentIds.length) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `Not enough thesis slots: ${totalAvailableSlots} slot(s) available for ${studentIds.length} student(s). Please increase teacher slots first.` 
                });
            }

            if (availableTeachers.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "No teachers with available thesis slots" });
            }

            const assignments = [];

            // Flatten teachers into an array of teacherId, repeated for each available slot
            let teacherSlotPool = [];
            availableTeachers.forEach(teacher => {
                for (let i = 0; i < teacher.remainingThesisSlots; i++) {
                    teacherSlotPool.push(teacher);
                }
            });

            // Shuffle the pool for randomness
            teacherSlotPool = teacherSlotPool.sort(() => Math.random() - 0.5);

            for (let i = 0; i < studentSemesters.length; i++) {
                const studentSemester = studentSemesters[i];
                const teacherSlot = teacherSlotPool[i];
                const teacher = teacherSlot.teacher;

                // Create Thesis
                const thesis = await models.Thesis.create({
                    studentId: studentSemester.studentId,
                    semesterId,
                    title: `Thesis for ${studentSemester.student.fullName}`,
                    description: 'Thesis assigned',
                    status: 'pending',
                    createdAt: new Date()
                }, { transaction: t });

                // Create ThesisTeacher
                await models.ThesisTeacher.create({
                    thesisId: thesis.id,
                    teacherId: teacherSlot.teacherId,
                    role: 'supervisor'
                }, { transaction: t });

                // Update slots
                await models.TeacherSemester.decrement(
                    'remainingThesisSlots',
                    { where: { teacherId: teacherSlot.teacherId, semesterId }, transaction: t }
                );

                // Notification (optional)
                await createNotification({
                    recipientId: studentSemester.student.userId,
                    type: 'reminder',
                    title: 'Thesis Assignment Reminder',
                    message: `You have been assigned to ${teacher.fullName} for your Thesis.`
                });
                await createNotification({
                    recipientId: teacher.userId,
                    type: 'reminder',
                    title: 'New Thesis Student',
                    message: `${studentSemester.student.fullName} (${studentSemester.student.user.username}) has been assigned to you for Thesis.`
                });

                assignments.push({
                    studentId: studentSemester.studentId,
                    studentName: studentSemester.student.fullName,
                    teacherId: teacherSlot.teacherId,
                    teacherName: teacher.fullName,
                    assignmentId: thesis.id
                });
            }

            await models.StudentSemester.update(
                { isRegistered: true },
                { where: { studentId: studentIds, semesterId }, transaction: t }
            );

            await t.commit();
            res.status(200).json({ message: "Thesis students assigned randomly", assignments });
        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: "Failed to assign thesis students randomly" });
        }
    }

    // Route: /admin/students/thesis-assign-specific
    async assignThesisToSpecificTeacher(req, res) {
        const t = await sequelize.transaction();
        const { studentId, teacherId, semesterId } = req.body;

        try {
            if (!studentId || !teacherId || !semesterId) {
                await t.rollback();
                return res.status(400).json({ message: "Student ID, Teacher ID, and Semester ID are required" });
            }

            const studentSemester = await models.StudentSemester.findOne({
                where: { studentId, semesterId, type: 'thesis' },
                include: [{
                    model: models.Student,
                    as: 'student',
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }]
            });

            if (!studentSemester) {
                await t.rollback();
                return res.status(404).json({ message: "Thesis student not found" });
            }
            if (studentSemester.isRegistered) {
                await t.rollback();
                return res.status(400).json({ message: "Student already registered" });
            }

            const teacherSemester = await models.TeacherSemester.findOne({
                where: { teacherId, semesterId }
            });
            if (!teacherSemester || (teacherSemester.remainingThesisSlots || 0) <= 0) {
                await t.rollback();
                return res.status(400).json({ message: "Teacher has no available thesis slots" });
            }

            const teacher = await models.Teacher.findOne({
                where: { id: teacherId, status: 'active' },
                include: [{
                    model: models.User,
                    as: 'user',
                    attributes: ['username']
                }]
            });

            // Create Thesis
            const thesis = await models.Thesis.create({
                studentId: studentSemester.studentId,
                semesterId,
                title: `Thesis for ${studentSemester.student.fullName}`,
                description: 'Thesis assigned',
                status: 'pending',
                createdAt: new Date()
            }, { transaction: t });

            // Create ThesisTeacher
            await models.ThesisTeacher.create({
                thesisId: thesis.id,
                teacherId,
                role: 'supervisor'
            }, { transaction: t });

            await models.TeacherSemester.decrement(
                'remainingThesisSlots',
                { where: { teacherId, semesterId }, transaction: t }
            );

            await models.StudentSemester.update(
                { isRegistered: true },
                { where: { studentId, semesterId }, transaction: t }
            );

            await createNotification({
                recipientId: studentSemester.student.userId,
                type: 'reminder',
                title: 'Thesis Assignment Reminder',
                message: `You have been assigned to ${teacher.fullName} for your Thesis.`
            });
            await createNotification({
                recipientId: teacher.userId,
                type: 'reminder',
                title: 'New Thesis Student',
                message: `${studentSemester.student.fullName} (${studentSemester.student.user.username}) has been assigned to you for Thesis.`
            });

            await t.commit();
            res.status(200).json({ message: "Thesis student assigned to specific teacher", assignmentId: thesis.id });
        } catch (error) {
            await t.rollback();
            console.error(error);
            res.status(500).json({ message: "Failed to assign thesis student to specific teacher" });
        }
    }

    // Route: /admin/teachers
    async getTeachers(req, res) {
        try {
            const teachers = await share.getAllTeachers();
            if (!teachers) return res.status(404).json({ message: "Teacher not found" });

            res.status(200).json(teachers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/teachers/new
    async createTeacher(req, res) {
        const t = await sequelize.transaction();
        const data = req.body;
        const teacherData = {
            username: data.username, // teacherId is username for teacher
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            status: data.status || "inactive",
        };

        try {
            const teacher = await share.createTeacher(teacherData, t);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });

            await t.commit();
            res.status(201).json({ message: "Teacher created successfully", data: teacher });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/teachers/:id
    async getTeacherById(req, res) {
        try {
            const teacher = await share.getTeacherById(req.params.teacherId);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });

            res.status(200).json(teacher);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/teachers/:id/update
    async updateTeacher(req, res) {
        const t = await sequelize.transaction();
        const teacherId = req.params.teacherId;
        const data = req.body;

        const userData = {
            userId: data.userId,
            username: data.username, // teacherId is username for teacher
        }

        const teacherData = {
            id: teacherId,
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            status: data.status || "inactive",
        };

        try {
            const user = await share.updateUserById(userData, t);
            if (!user) return res.status(404).json({ message: "User not found" });

            const teacher = await share.updateTeacherById(teacherId, teacherData, t);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });

            await t.commit();
            res.status(200).json({ message: "Teacher updated successfully", data: teacher });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async getAvailablePreThesisTopics(req, res) {
        const { semesterId } = req.query;
        try {
            const topics = await models.Topic.findAll({
                where: {
                    semesterId,
                    status: 'open',
                    remainingSlots: { [Op.gt]: 0 }
                },
                include: [{
                    model: models.Teacher,
                    as: 'supervisor',
                    attributes: ['fullName']
                }]
            });
            res.status(200).json(topics.map(t => ({
                id: t.id,
                topic: t.topic,
                remainingSlots: t.remainingSlots,
                supervisorName: t.supervisor?.fullName || 'N/A'
            })));
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch topics" });
        }
    }

    // Route: /admin/teachers/slots
    async getTeachersWithSlots(req, res) {
        try {
            // Get semesterId from query parameters
            const semesterId = req.query.semesterId;
            
            if (!semesterId) {
                return res.status(400).json({ message: "Semester ID is required" });
            }

            const teachersWithSlots = await models.TeacherSemester.findAll({
                where: { semesterId: semesterId },
                include: [{
                    model: models.Teacher,
                    as: 'teacher',
                    where: { status: 'active' },
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['id', 'username']
                    }]
                }],
                attributes: [
                    'teacherId',
                    'semesterId',
                    'maxPreThesisSlots',
                    'maxThesisSlots',
                    'remainingPreThesisSlots',
                    'remainingThesisSlots'
                ]
            });

            // Transform the data to match what the frontend expects
            const formattedTeachers = teachersWithSlots.map(ts => ({
                userId: ts.teacher.id,
                teacherId: ts.teacherId,
                fullName: ts.teacher.fullName,
                user: {
                    id: ts.teacher.user.id,
                    username: ts.teacher.user.username
                },
                slots: {
                    maxPreThesis: ts.maxPreThesisSlots,
                    maxThesis: ts.maxThesisSlots,
                    remainingPreThesis: ts.remainingPreThesisSlots,
                    remainingThesis: ts.remainingThesisSlots
                }
            }));

            res.status(200).json(formattedTeachers);
        } catch (error) {
            console.error('Error fetching teachers with slots:', error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/moderators
    async getModerators(req, res) {
        try {
            const moderators = await share.getAllModerators();
            if (!moderators) return res.status(404).json({ message: "Moderator not found" });

            res.status(200).json(moderators);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
    // Route: /admin/moderators/new
    async createModerator(req, res) {
        const t = await sequelize.transaction();
        const data = req.body;
        const moderatorData = {
            username: data.username, // moderatorId is username for moderator
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            status: data.status || "inactive",
        };

        try {
            const moderator = await share.createModerator(moderatorData, t);
            if (!moderator) return res.status(404).json({ message: "Moderator not found" });

            await t.commit();
            res.status(201).json({ message: "Moderator created successfully", data: moderator });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/moderators/:id
    // async getModeratorById(req, res) {

    // }

    // Route: /admin/moderators/:id/update
    async updateModerator(req, res) {
        const t = await sequelize.transaction();
        const moderatorId = req.params.moderatorId;
        const data = req.body;

        const userData = {
            userId: data.userId,
            username: data.username, // moderatorId is username for moderator
        }

        const moderatorData = {
            id: moderatorId,
            userId: data.userId,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || null,
            birthDate: data.birthDate || null,
            address: data.address || null,
            status: data.status || "inactive",
        };

        try {
            const user = await share.updateUserById(userData, t);
            if (!user) return res.status(404).json({ message: "User not found" });

            const moderator = await share.updateModeratorById(moderatorId, moderatorData, t);
            if (!moderator) return res.status(404).json({ message: "Moderator not found" });

            await t.commit();
            res.status(200).json({ message: "Moderator updated successfully", data: moderator });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/semesters/:semesterId/teachers
    async getTeachersBySemester(req, res) {
        const { semesterId } = req.params;
        
        try {
            // Assuming you have a TeacherSemester or similar junction table
            // Adjust the model names based on your actual database structure
            const assignments = await models.TeacherSemester.findAll({
                where: { semesterId },
                include: [{
                    model: models.Teacher,
                    as: 'teacher',
                    attributes: ['id', 'fullName', 'email', 'status'],
                    include: [{
                        model: models.User,
                        as: 'user',
                        attributes: ['username']
                    }]
                }],
                attributes: [
                    'teacherId',
                    'semesterId',
                    'maxPreThesisSlots',
                    'remainingPreThesisSlots',
                    'maxThesisSlots',
                    'remainingThesisSlots'
                ]
            });

            const teachers = assignments.map(assignment => ({
                id: assignment.teacher.id,
                fullName: assignment.teacher.fullName,
                name: assignment.teacher.fullName, // Add this for compatibility
                email: assignment.teacher.email,
                username: assignment.teacher.user?.username,
                department: assignment.teacher.department || 'N/A',
                status: assignment.teacher.status,
                // Include the TeacherSemester data with slot information
                TeacherSemester: {
                    maxPreThesisSlots: assignment.maxPreThesisSlots,
                    remainingPreThesisSlots: assignment.remainingPreThesisSlots,
                    maxThesisSlots: assignment.maxThesisSlots,
                    remainingThesisSlots: assignment.remainingThesisSlots,
                    assignedAt: assignment.assignedAt
                }
            }));
            
            res.status(200).json(teachers);
        } catch (error) {
            console.error('Error fetching teachers by semester:', error);
            res.status(500).json({ error: 'Failed to fetch teachers' });
        }
    }

    // Route: /admin/semesters/:semesterId/teachers/assign
    async assignTeacherToSemester(req, res) {
        const t = await sequelize.transaction();
        const { semesterId } = req.params;
        const { teacherId } = req.body;
        
        try {
            // Check if assignment already exists
            const existingAssignment = await models.TeacherSemester.findOne({
                where: { teacherId, semesterId }
            });
            
            if (existingAssignment) {
                await t.rollback();
                return res.status(400).json({ error: 'Teacher is already assigned to this semester' });
            }
            
            // Verify teacher exists
            const teacher = await models.Teacher.findByPk(teacherId);
            if (!teacher) {
                await t.rollback();
                return res.status(404).json({ error: 'Teacher not found' });
            }

            // Verify semester exists
            const semester = await models.Semester.findByPk(semesterId);
            if (!semester) {
                await t.rollback();
                return res.status(404).json({ error: 'Semester not found' });
            }
            
            const assignment = await models.TeacherSemester.create({
                teacherId,
                semesterId,
                assignedBy: req.user.id,
                assignedAt: new Date()
            }, { transaction: t });
            
            await t.commit();
            res.status(201).json({ message: 'Teacher assigned successfully', assignment });
        } catch (error) {
            await t.rollback();
            console.error('Error assigning teacher to semester:', error);
            res.status(500).json({ error: 'Failed to assign teacher' });
        }
    }

    // Route: /admin/semesters/:semesterId/teachers/assign-multiple
    async assignMultipleTeachersToSemester(req, res) {
        const t = await sequelize.transaction();
        const { semesterId } = req.params;
        const { teacherIds, maxPreThesisSlots, maxThesisSlots } = req.body;
        try {
            if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
                await t.rollback();
                return res.status(400).json({ error: 'Teacher IDs array is required' });
            }

            // Get existing assignments to avoid duplicates
            const existingAssignments = await models.TeacherSemester.findAll({
                where: { 
                    semesterId,
                    teacherId: teacherIds
                },
                attributes: ['teacherId']
            });

            const existingTeacherIds = existingAssignments.map(a => a.teacherId);
            const newTeacherIds = teacherIds.filter(id => !existingTeacherIds.includes(id));

            if (newTeacherIds.length === 0) {
                await t.rollback();
                return res.status(400).json({ error: 'All teachers are already assigned to this semester' });
            }

            const assignments = newTeacherIds.map(teacherId => ({
                teacherId,
                semesterId,
                maxPreThesisSlots: maxPreThesisSlots || 0,
                remainingPreThesisSlots: maxPreThesisSlots || 0,
                maxThesisSlots: maxThesisSlots || 0,
                remainingThesisSlots: maxThesisSlots || 0,
                assignedBy: req.user.id,
                assignedAt: new Date()
            }));
            
            await models.TeacherSemester.bulkCreate(assignments, { transaction: t });
            
            await t.commit();
            res.status(201).json({ 
                message: `${newTeacherIds.length} teachers assigned successfully`,
                assignedCount: newTeacherIds.length,
                skippedCount: existingTeacherIds.length,
            });
        } catch (error) {
            await t.rollback();
            console.error('Error assigning multiple teachers:', error);
            res.status(500).json({ error: 'Failed to assign teachers' });
        }
    }
    async updateTeacherSlots(req, res) {
        const t = await sequelize.transaction();
        const { semesterId, teacherId } = req.params;
        const { maxPreThesisSlots, maxThesisSlots } = req.body;
        
        try {
            // Find the TeacherSemester assignment
            const assignment = await models.TeacherSemester.findOne({
                where: { teacherId, semesterId }
            });
            
            if (!assignment) {
                await t.rollback();
                return res.status(404).json({ error: 'Teacher assignment not found' });
            }
            
            // Update the slot values
            const updateData = {};
            
            // Update pre-thesis slots
            if (maxPreThesisSlots !== undefined) {
                const currentMax = assignment.maxPreThesisSlots || 0;
                const currentRemaining = assignment.remainingPreThesisSlots || 0;
                const usedSlots = currentMax - currentRemaining;
                
                // Ensure new max is not less than used slots
                if (maxPreThesisSlots < usedSlots) {
                    await t.rollback();
                    return res.status(400).json({ 
                        error: `Cannot reduce max pre-thesis slots below ${usedSlots}. Currently ${usedSlots} slots are in use.` 
                    });
                }
                
                updateData.maxPreThesisSlots = maxPreThesisSlots;
                updateData.remainingPreThesisSlots = maxPreThesisSlots - usedSlots;
            }
            
            // Update thesis slots
            if (maxThesisSlots !== undefined) {
                const currentMax = assignment.maxThesisSlots || 0;
                const currentRemaining = assignment.remainingThesisSlots || 0;
                const usedSlots = currentMax - currentRemaining;
                
                // Ensure new max is not less than used slots
                if (maxThesisSlots < usedSlots) {
                    await t.rollback();
                    return res.status(400).json({ 
                        error: `Cannot reduce max thesis slots below ${usedSlots}. Currently ${usedSlots} slots are in use.` 
                    });
                }
                
                updateData.maxThesisSlots = maxThesisSlots;
                updateData.remainingThesisSlots = maxThesisSlots - usedSlots;
            }
            
            await models.TeacherSemester.update(updateData, {
                where: { teacherId, semesterId },
                transaction: t
            });
            
            await t.commit();
            res.status(200).json({ 
                message: 'Teacher slots updated successfully',
                slots: updateData
            });
        } catch (error) {
            await t.rollback();
            console.error('Error updating teacher slots:', error);
            res.status(500).json({ error: 'Failed to update teacher slots' });
        }
    }

    // Route: /admin/semesters/:semesterId/teachers/:teacherId/unassign
    async unassignTeacherFromSemester(req, res) {
        const t = await sequelize.transaction();
        const { semesterId, teacherId } = req.params;
        
        try {
            const deleted = await models.TeacherSemester.destroy({
                where: { teacherId, semesterId },
                transaction: t
            });
            
            if (deleted === 0) {
                await t.rollback();
                return res.status(404).json({ error: 'Assignment not found' });
            }
            
            await t.commit();
            res.status(200).json({ message: 'Teacher unassigned successfully' });
        } catch (error) {
            await t.rollback();
            console.error('Error unassigning teacher:', error);
            res.status(500).json({ error: 'Failed to unassign teacher' });
        }
    }

    // Route: /admin/teachers/active
    async getActiveTeachers(req, res) {
        try {
            const activeTeachers = await models.Teacher.findAll({
                where: { status: 'active' },
                include: [{
                    model: models.User,
                    as: 'user',
                    attributes: ['username', 'id']
                }],
                attributes: ['id', 'fullName', 'email', 'phone', 'status'],
                order: [['fullName', 'ASC']]
            });

            const formattedTeachers = activeTeachers.map(teacher => ({
                id: teacher.id,
                fullName: teacher.fullName,
                email: teacher.email,
                phone: teacher.phone,
                status: teacher.status,
                username: teacher.user?.username || null,
                userId: teacher.user?.id || null
            }));

            res.status(200).json(formattedTeachers);
        } catch (error) {
            console.error('Error fetching active teachers:', error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/semesters/:semesterId/theses
    async getThesesBySemester(req, res) {
        const { semesterId } = req.params;

        try {
            const theses = await models.Thesis.findAll({
                where: { semesterId },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['username']
                        }]
                    },
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        attributes: ['role'],
                        include: [
                            {
                                model: models.Teacher,
                                as: 'teacher',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                                include: [{
                                    model: models.User,
                                    as: 'user',
                                    attributes: ['username']
                                }]
                            }
                        ]
                    }
                ],
                attributes: [
                    'id', 'title', 'description', 'status', 'finalGrade', 
                    'defenseDate', 'videoUrl', 'createdAt', 'updatedAt'
                ],
                order: [['createdAt', 'DESC']]
            });

            // Format the response to match expected structure
            const formattedTheses = theses.map(thesis => ({
                id: thesis.id,
                title: thesis.title,
                description: thesis.description,
                status: thesis.status,
                finalGrade: thesis.finalGrade,
                defenseDate: thesis.defenseDate,
                videoUrl: thesis.videoUrl,
                supervisorId: thesis.supervisor?.id,
                reviewerId: thesis.reviewer?.id,
                student: thesis.student,
                teachers: thesis.thesisTeachers.map(tt => ({
                    role: tt.role,
                    teacher: {
                        id: tt.teacher.id,
                        fullName: tt.teacher.fullName,
                        email: tt.teacher.email,
                        phone: tt.teacher.phone,
                        username: tt.teacher.user?.username || null
                    }
                }))
            }));

            res.status(200).json(formattedTheses);
        } catch (error) {
            console.error('Error fetching theses by semester:', error);
            res.status(500).json({ message: "Failed to fetch theses" });
        }
    }

    // Route: /admin/theses/:thesisId/assign-reviewer
    async assignReviewerToThesis(req, res) {
        const t = await sequelize.transaction();
        const { thesisId } = req.params;
        const { reviewerId } = req.body;

        try {
            // Check if thesis exists
            const thesis = await models.Thesis.findByPk(thesisId);
            if (!thesis) {
                await t.rollback();
                return res.status(404).json({ message: "Thesis not found" });
            }

            // Check if teacher exists and is active
            const teacher = await models.Teacher.findOne({
                where: { id: reviewerId, status: 'active' }
            });
            if (!teacher) {
                await t.rollback();
                return res.status(404).json({ message: "Active teacher not found" });
            }

            // Check if teacher is not the supervisor
            if (thesis.supervisorId === reviewerId) {
                await t.rollback();
                return res.status(400).json({ message: "Supervisor cannot be assigned as reviewer" });
            }

            // Remove existing reviewer assignment if any
            await models.ThesisTeacher.destroy({
                where: { thesisId, role: 'reviewer' },
                transaction: t
            });

            // Create new reviewer assignment
            await models.ThesisTeacher.create({
                thesisId,
                teacherId: reviewerId,
                role: 'reviewer'
            }, { transaction: t });

            // Notify the reviewer
            await createNotification({
                recipientId: reviewerId,
                type: 'reminder',
                title: 'Reviewer Assignment',
                message: `You have been assigned as a reviewer for thesis ID ${thesisId}.`,
            });

            const student = await models.Student.findOne({
                where: { id: thesis.studentId },
            });

            // Notify the student about the reviewer assignment
            await createNotification({
                recipientId: student.userId,
                type: 'reminder',
                title: 'Reviewer Assigned',
                message: `A reviewer has been assigned to your thesis ID ${thesisId}.`,
            });

            await t.commit();
            res.status(200).json({ message: "Reviewer assigned successfully" });
        } catch (error) {
            await t.rollback();
            console.error('Error assigning reviewer:', error);
            res.status(500).json({ message: "Failed to assign reviewer" });
        }
    }

    // Route: /admin/theses/:thesisId/assign-committee
    async assignCommitteeToThesis(req, res) {
        const t = await sequelize.transaction();
        const { thesisId } = req.params;
        const { committeeMembers } = req.body;

        try {
            if (!Array.isArray(committeeMembers) || committeeMembers.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "Committee members array is required" });
            }

            // Check if thesis exists
            const thesis = await models.Thesis.findByPk(thesisId);
            if (!thesis) {
                await t.rollback();
                return res.status(404).json({ message: "Thesis not found" });
            }

            // Verify all teachers exist and are active
            const teachers = await models.Teacher.findAll({
                where: { 
                    id: committeeMembers, 
                    status: 'active' 
                }
            });

            if (teachers.length !== committeeMembers.length) {
                await t.rollback();
                return res.status(400).json({ message: "One or more teachers not found or inactive" });
            }

            // Check if any teacher is the supervisor
            if (committeeMembers.includes(thesis.supervisorId)) {
                await t.rollback();
                return res.status(400).json({ message: "Supervisor cannot be a committee member" });
            }

            // Remove existing committee assignments
            await models.ThesisTeacher.destroy({
                where: { thesisId, role: 'committee' },
                transaction: t
            });

            // Create new committee assignments
            const assignments = committeeMembers.map(teacherId => ({
                thesisId,
                teacherId,
                role: 'committee'
            }));

            await models.ThesisTeacher.bulkCreate(assignments, { transaction: t });

            // Notify all committee members
            for (const teacherId of committeeMembers) {
                await createNotification({
                    recipientId: teacherId,
                    type: 'reminder',
                    title: 'Committee Assignment',
                    message: `You have been assigned as a committee member for thesis ID ${thesisId}.`,
                });
            }

            const student = await models.Student.findOne({
                where: { id: thesis.studentId },
            });

            // Notify the student about the committee assignment
            await createNotification({
                recipientId: student.userId,
                type: 'reminder',
                title: 'Committee Assigned',
                message: `Committee members have been assigned to your thesis ID ${thesisId}.`,
            });

            await t.commit();
            res.status(200).json({ message: "Committee members assigned successfully" });
        } catch (error) {
            await t.rollback();
            console.error('Error assigning committee:', error);
            res.status(500).json({ message: "Failed to assign committee members" });
        }
    }

    // Route: /admin/theses/:thesisId/set-defense-date
    async setThesisDefenseDate(req, res) {
        const t = await sequelize.transaction();
        const { thesisId } = req.params;
        const { defenseDate } = req.body;

        try {
            // Validate defense date
            const defenseDateObj = new Date(defenseDate);
            if (isNaN(defenseDateObj.getTime())) {
                await t.rollback();
                return res.status(400).json({ message: "Invalid defense date" });
            }

            // Check if defense date is in the future
            if (defenseDateObj <= new Date()) {
                await t.rollback();
                return res.status(400).json({ message: "Defense date must be in the future" });
            }

            // Update thesis with defense date
            const [updatedRows] = await models.Thesis.update(
                { defenseDate: defenseDateObj },
                { 
                    where: { id: thesisId },
                    transaction: t
                }
            );

            if (updatedRows === 0) {
                await t.rollback();
                return res.status(404).json({ message: "Thesis not found" });
            }

            const thesis = await models.Thesis.findOne({
                where: { id: thesisId },
                include: [{
                    model: models.Student,
                    as: 'student',
                    attributes: ['userId'],
                }]
            });

            // notify the student and supervisors about the defense date
            await createNotification({
                recipientId: thesis.student.userId,
                type: 'reminder',
                title: 'Thesis Defense Date Set',
                message: `Your thesis defense date has been set to ${defenseDateObj.toLocaleString()}.`,
            });

            const supervisor = await models.ThesisTeacher.findOne({
                where: { thesisId, role: 'supervisor' },
                include: [
                    {
                        model: models.Teacher,
                        as: 'teacher',
                        attributes: ['userId']
                    },
                ]
            });

            const student = await models.Student.findOne({
                where: { id: thesis.studentId },
                attributes: ['fullName']
            });

            await createNotification({
                recipientId: supervisor.teacher.userId,
                type: 'reminder',
                title: 'Thesis Defense Date Set',
                message: `The defense date for student ${student.fullName} has been set to ${defenseDateObj.toLocaleString()}.`,
            });

            await t.commit();
            res.status(200).json({ message: "Defense date set successfully" });
        } catch (error) {
            await t.rollback();
            console.error('Error setting defense date:', error);
            res.status(500).json({ message: "Failed to set defense date" });
        }
    }

    // Route: /admin/theses/:thesisId/export
    async exportThesisRegistrationReport(req, res) {
        const { thesisId } = req.params;
        const { format = 'pdf' } = req.query;

        try {
            // Get specific thesis information with all required details
            const thesis = await models.Thesis.findByPk(thesisId, {
                include: [
                    {
                        model: models.Semester,
                        as: 'semester',
                        attributes: ['id', 'name']
                    },
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['username']
                        }]
                    },
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        where: { role: 'supervisor' },
                        required: false,
                        include: [{
                            model: models.Teacher,
                            as: 'teacher',
                            attributes: ['id', 'fullName', 'email', 'phone']
                        }]
                    }
                ],
                attributes: ['id', 'title', 'description', 'status', 'finalGrade', 'defenseDate', 'createdAt']
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }

            const semester = thesis.semester;
            const student = thesis.student;
            const supervisor = thesis.thesisTeachers && thesis.thesisTeachers.length > 0 
                ? thesis.thesisTeachers[0].teacher 
                : null;

            if (format === 'pdf') {
                // Generate PDF report for specific thesis
                const doc = new PDFDocument({ margin: 50 });
                
                // Set response headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="thesis-registration-${student.user.username}-${semester.name.replace(/\s+/g, '-')}.pdf"`);
                
                // Pipe the PDF to response
                doc.pipe(res);

                // Add title
                doc.fontSize(18)
                .font('Helvetica-Bold')
                .text('Thesis Registration Report', { align: 'center' });
                
                doc.fontSize(14)
                .font('Helvetica')
                .text(`Semester: ${semester.name}`, { align: 'center' })
                .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
                .moveDown(2);

                // Thesis Information Section
                doc.fontSize(14)
                .font('Helvetica-Bold')
                .text('Thesis Information', { underline: true })
                .moveDown(0.5);

                // Table setup
                const tableTop = doc.y;
                const tableLeft = 50;
                const colWidths = [150, 350]; // Label, Value
                const rowHeight = 25;

                // Table data
                const tableData = [
                    ['Student', student.fullName],
                    ['Student ID', student.user.username],
                    ['Student Email', student.email],
                    ['Student Phone', student.phone || 'N/A'],
                    ['Supervisor', supervisor ? supervisor.fullName : 'Not Assigned'],
                    ['Supervisor Email', supervisor ? supervisor.email : 'N/A'],
                    ['Supervisor Phone', supervisor ? supervisor.phone || 'N/A' : 'N/A'],
                    ['Topic', thesis.title],
                ];

                let currentY = tableTop;

                // Draw table header
                doc.fontSize(10)
                .font('Helvetica-Bold')
                .rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                .fillAndStroke('#f0f0f0', '#000000')
                .fillColor('#000000')
                .text('Field', tableLeft + 5, currentY + 8, { width: colWidths[0] - 10 })
                .text('Information', tableLeft + colWidths[0] + 5, currentY + 8, { width: colWidths[1] - 10 });

                currentY += rowHeight;

                // Draw table rows
                doc.font('Helvetica').fontSize(9);
                
                tableData.forEach((row, index) => {
                    // Alternate row colors
                    if (index % 2 === 1) {
                        doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                        .fill('#f9f9f9');
                    }

                    // Draw row borders
                    doc.strokeColor('#cccccc')
                    .rect(tableLeft, currentY, colWidths[0], rowHeight).stroke()
                    .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight).stroke();

                    // Add text
                    doc.fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text(row[0], tableLeft + 5, currentY + 8, { 
                        width: colWidths[0] - 10, 
                        height: rowHeight - 10,
                        ellipsis: true 
                    })
                    .font('Helvetica')
                    .text(row[1], tableLeft + colWidths[0] + 5, currentY + 8, { 
                        width: colWidths[1] - 10,
                        height: rowHeight - 10,
                        ellipsis: true 
                    });

                    currentY += rowHeight;
                });

                // Add footer
                doc.fontSize(8)
                .text(`Generated by Thesis Management System - ${new Date().toLocaleString()}`, 
                        50, doc.page.height - 50, { align: 'center' });

                // Finalize the PDF
                doc.end();

            } else {
                // Return JSON format for specific thesis
                const formattedData = {
                    student: {
                        name: student.fullName,
                        username: student.user.username,
                        email: student.email,
                        phone: student.phone,
                    },
                    supervisor: supervisor ? {
                        name: supervisor.fullName,
                        email: supervisor.email,
                        phone: supervisor.phone,
                    } : null,
                    thesis: {
                        title: thesis.title,
                        description: thesis.description,
                        status: thesis.status,
                        finalGrade: thesis.finalGrade,
                        defenseDate: thesis.defenseDate,
                        registrationDate: thesis.createdAt
                    },
                    semester: {
                        id: semester.id,
                        name: semester.name
                    }
                };

                res.status(200).json(formattedData);
            }

        } catch (error) {
            console.error('Error exporting thesis report:', error);
            res.status(500).json({ message: "Failed to export thesis report" });
        }
    }

    async exportThesisFinalReport(req, res) {
        const { thesisId } = req.params;
        const { format = 'pdf' } = req.query;

        try {
            // Get thesis with all required details
            const thesis = await models.Thesis.findByPk(thesisId, {
                include: [
                    {
                        model: models.Semester,
                        as: 'semester',
                        attributes: ['id', 'name']
                    },
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['username']
                        }]
                    },
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        include: [{
                            model: models.Teacher,
                            as: 'teacher',
                            attributes: ['id', 'fullName', 'email', 'phone']
                        }]
                    },
                    {
                        model: models.ThesisGrade,
                        as: 'grades',
                        include: [{
                            model: models.Teacher,
                            as: 'teacher',
                            attributes: ['id', 'fullName']
                        }]
                    }
                ],
                attributes: [
                    'id', 'title', 'description', 'status', 'finalGrade',
                    'defenseDate', 'videoUrl', 'createdAt', 'updatedAt'
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }

            const semester = thesis.semester;
            const student = thesis.student;
            const supervisor = thesis.thesisTeachers.find(tt => tt.role === 'supervisor')?.teacher;
            const reviewer = thesis.thesisTeachers.find(tt => tt.role === 'reviewer')?.teacher;
            const committeeMembers = thesis.thesisTeachers
                .filter(tt => tt.role === 'committee')
                .map(tt => tt.teacher);

            // Extract grades
            const supervisorGrade = thesis.grades.find(g => g.gradeType === 'supervisor');
            const reviewerGrade = thesis.grades.find(g => g.gradeType === 'reviewer');
            const committeeGrades = committeeMembers.map(cm => ({
                name: cm?.fullName || '-',
                grade: thesis.grades.find(g => g.gradeType === 'committee' && g.teacherId === cm.id)?.grade ?? '-'
            }));

            if (format === 'pdf') {
                // Generate PDF report for thesis final result
                const doc = new PDFDocument({ margin: 50 });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="thesis-final-report-${student.user.username}-${semester.name.replace(/\s+/g, '-')}.pdf"`);

                doc.pipe(res);

                // Title and semester info
                doc.fontSize(18)
                    .font('Helvetica-Bold')
                    .text('Thesis Final Report', { align: 'center' });

                doc.fontSize(14)
                    .font('Helvetica')
                    .text(`Semester: ${semester.name}`, { align: 'center' })
                    .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
                    .moveDown(2);

                // Thesis Information Section
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text('Thesis Information', { underline: true })
                    .moveDown(0.5);

                // Table setup
                const tableTop = doc.y;
                const tableLeft = 50;
                const colWidths = [150, 350]; // Label, Value
                const rowHeight = 25;

                // Table data
                const tableData = [
                    ['Student', student.fullName],
                    ['Student ID', student.user.username],
                    ['Student Email', student.email],
                    ['Student Phone', student.phone || 'N/A'],
                    ['Supervisor', supervisor ? supervisor.fullName : 'Not Assigned'],
                    ['Reviewer', reviewer ? reviewer.fullName : 'Not Assigned'],
                    ['Committee', committeeMembers.length > 0 ? committeeMembers.map(cm => cm.fullName).join(', ') : 'Not Assigned'],
                    ['Topic', thesis.title],
                    ['Description', thesis.description || '-'],
                    ['Defense Date', thesis.defenseDate ? new Date(thesis.defenseDate).toLocaleString() : '-'],
                    ['Status', thesis.status],
                ];

                let currentY = tableTop;

                // Draw table header
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                    .fillAndStroke('#f0f0f0', '#000000')
                    .fillColor('#000000')
                    .text('Field', tableLeft + 5, currentY + 8, { width: colWidths[0] - 10 })
                    .text('Information', tableLeft + colWidths[0] + 5, currentY + 8, { width: colWidths[1] - 10 });

                currentY += rowHeight;

                // Draw table rows
                doc.font('Helvetica').fontSize(9);

                tableData.forEach((row, index) => {
                    // Alternate row colors
                    if (index % 2 === 1) {
                        doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                            .fill('#f9f9f9');
                    }

                    // Draw row borders
                    doc.strokeColor('#cccccc')
                        .rect(tableLeft, currentY, colWidths[0], rowHeight).stroke()
                        .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight).stroke();

                    // Add text
                    doc.fillColor('#000000')
                        .font('Helvetica-Bold')
                        .text(row[0], tableLeft + 5, currentY + 8, {
                            width: colWidths[0] - 10,
                            height: rowHeight - 10,
                            ellipsis: true
                        })
                        .font('Helvetica')
                        .text(row[1], tableLeft + colWidths[0] + 5, currentY + 8, {
                            width: colWidths[1] - 10,
                            height: rowHeight - 10,
                            ellipsis: true
                        });

                    currentY += rowHeight;
                });

                // Score Details Section
                doc.moveDown(2);
                doc.fontSize(14)
                .font('Helvetica-Bold')
                .text('Score Details', 50, doc.y, { underline: true, align: 'left' }) // <--- add 50, doc.y
                .moveDown(0.5);

                const scoreTableLeft = 50;
                const scoreColWidths = [200, 200];
                const scoreRowHeight = 25;
                let scoreY = doc.y;

                // Table header
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .rect(scoreTableLeft, scoreY, scoreColWidths[0] + scoreColWidths[1], scoreRowHeight)
                    .fillAndStroke('#f0f0f0', '#000000')
                    .fillColor('#000000')
                    .text('Role', scoreTableLeft + 5, scoreY + 8, { width: scoreColWidths[0] - 10, align: 'left' })
                    .text('Score', scoreTableLeft + scoreColWidths[0] + 5, scoreY + 8, { width: scoreColWidths[1] - 10, align: 'left' });

                scoreY += scoreRowHeight;

                // Table rows
                const scoreRows = [
                    ['Supervisor', supervisorGrade?.grade ?? '-'],
                    ['Reviewer', reviewerGrade?.grade ?? '-'],
                    ...committeeGrades.map((cg, idx) => [
                        `Committee Member ${idx + 1} (${cg.name})`, cg.grade
                    ]),
                    ['Final Grade', thesis.finalGrade !== null ? thesis.finalGrade : '-'],
                    ['Status', thesis.status]
                ];

                doc.font('Helvetica').fontSize(10);

                scoreRows.forEach((row, idx) => {
                    // Alternate row color
                    if (idx % 2 === 1) {
                        doc.rect(scoreTableLeft, scoreY, scoreColWidths[0] + scoreColWidths[1], scoreRowHeight)
                            .fill('#f9f9f9');
                    }
                    // Draw row borders
                    doc.strokeColor('#cccccc')
                        .rect(scoreTableLeft, scoreY, scoreColWidths[0], scoreRowHeight).stroke()
                        .rect(scoreTableLeft + scoreColWidths[0], scoreY, scoreColWidths[1], scoreRowHeight).stroke();

                    // Add text
                    doc.fillColor('#000000')
                        .font('Helvetica')
                        .text(row[0], scoreTableLeft + 5, scoreY + 8, {
                            width: scoreColWidths[0] - 10,
                            align: 'left',
                            ellipsis: true
                        })
                        .text(row[1], scoreTableLeft + scoreColWidths[0] + 5, scoreY + 8, {
                            width: scoreColWidths[1] - 10,
                            align: 'left',
                            ellipsis: true
                        });

                    scoreY += scoreRowHeight;
                });

                doc.moveDown(4);

                // Footer
                doc.text(
                    `Generated by Thesis Management System - ${new Date().toLocaleString()}`,
                    0,
                    doc.page.height - 50,
                    { align: 'center', width: doc.page.width }
                );
                doc.end();

            } else {
                // Return JSON format for thesis final report
                const formattedData = {
                    student: {
                        name: student.fullName,
                        username: student.user.username,
                        email: student.email,
                        phone: student.phone,
                    },
                    supervisor: supervisor ? {
                        name: supervisor.fullName,
                        email: supervisor.email,
                        phone: supervisor.phone,
                    } : null,
                    reviewer: reviewer ? {
                        name: reviewer.fullName,
                        email: reviewer.email,
                        phone: reviewer.phone,
                    } : null,
                    committee: committeeMembers.map(cm => ({
                        name: cm.fullName,
                        email: cm.email,
                        phone: cm.phone,
                    })),
                    thesis: {
                        title: thesis.title,
                        description: thesis.description,
                        status: thesis.status,
                        finalGrade: thesis.finalGrade,
                        defenseDate: thesis.defenseDate,
                        registrationDate: thesis.createdAt
                    },
                    semester: {
                        id: semester.id,
                        name: semester.name
                    },
                    grades: {
                        supervisor: supervisorGrade?.grade ?? null,
                        reviewer: reviewerGrade?.grade ?? null,
                        committee: committeeGrades
                    }
                };

                res.status(200).json(formattedData);
            }

        } catch (error) {
            console.error('Error exporting thesis final report:', error);
            res.status(500).json({ message: "Failed to export thesis final report" });
        }
    }

    // Route: /admin/prethesis?semesterId=...
    async getPreThesesBySemester(req, res) {
        const { semesterId } = req.query;
        try {
            // Find all topics for this semester
            const topics = await models.Topic.findAll({
                where: { semesterId },
                attributes: ['id', 'topic', 'supervisorId']
            });
            const topicIds = topics.map(t => t.id);

            // Find all pre-theses for these topics
            const preTheses = await models.PreThesis.findAll({
                where: { topicId: topicIds },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'userId'],
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['username']
                        }]
                    },
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        attributes: ['id', 'topic', 'supervisorId'],
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.status(200).json(preTheses);
        } catch (error) {
            console.error('Error fetching pre-theses:', error);
            res.status(500).json({ message: "Failed to fetch pre-theses" });
        }
    }

    // Route: /admin/prethesis/:preThesisId/export-final
    async exportPreThesisFinalReport(req, res) {
        const { preThesisId } = req.params;
        const { format = 'pdf' } = req.query;

        try {
            // Get pre-thesis with all required details
            const preThesis = await models.PreThesis.findByPk(preThesisId, {
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                        include: [{
                            model: models.User,
                            as: 'user',
                            attributes: ['username']
                        }]
                    },
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        attributes: ['id', 'topic', 'supervisorId'],
                        include: [{
                            model: models.Teacher,
                            as: 'supervisor',
                            attributes: ['id', 'fullName', 'email', 'phone']
                        }]
                    },
                ],
                attributes: [
                    'id', 'title', 'description', 'status',
                    'videoUrl', 'grade', 'feedback', 'gradedAt', 'createdAt', 'updatedAt'
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found" });
            }

            const student = preThesis.student;
            const topic = preThesis.preThesisTopic;
            const supervisor = topic?.supervisor;

            if (format === 'pdf') {
                // Generate PDF report for pre-thesis final result
                const doc = new PDFDocument({ margin: 50 });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="prethesis-final-report-${student.user.username}.pdf"`);

                doc.pipe(res);

                // Title
                doc.fontSize(18)
                    .font('Helvetica-Bold')
                    .text('Pre-Thesis Final Report', { align: 'center' });

                doc.fontSize(14)
                    .font('Helvetica')
                    .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
                    .moveDown(2);

                // Information Section
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .text('Pre-Thesis Information', { underline: true })
                    .moveDown(0.5);

                const tableTop = doc.y;
                const tableLeft = 50;
                const colWidths = [150, 350];
                const rowHeight = 25;

                const tableData = [
                    ['Student', student.fullName],
                    ['Student ID', student.user.username],
                    ['Student Email', student.email],
                    ['Student Phone', student.phone || 'N/A'],
                    ['Supervisor', supervisor ? supervisor.fullName : 'Not Assigned'],
                    ['Supervisor Email', supervisor ? supervisor.email : 'N/A'],
                    ['Supervisor Phone', supervisor ? supervisor.phone || 'N/A' : 'N/A'],
                    ['Topic', topic?.topic || '-'],
                    ['Title', preThesis.title || '-'],
                    ['Description', preThesis.description || '-'],
                    ['Status', preThesis.status],
                    ['Grade', preThesis.grade || '-'],
                    ['Feedback', preThesis.feedback || '-'],
                    ['Graded At', preThesis.gradedAt || '-'],
                    ['Video Demo URL', preThesis.videoUrl || '-'],
                ];

                let currentY = tableTop;

                // Table header
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                    .fillAndStroke('#f0f0f0', '#000000')
                    .fillColor('#000000')
                    .text('Field', tableLeft + 5, currentY + 8, { width: colWidths[0] - 10 })
                    .text('Information', tableLeft + colWidths[0] + 5, currentY + 8, { width: colWidths[1] - 10 });

                currentY += rowHeight;

                // Table rows
                doc.font('Helvetica').fontSize(9);

                tableData.forEach((row, index) => {
                    // Alternate row colors
                    if (index % 2 === 1) {
                        doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
                            .fill('#f9f9f9');
                    }

                    // Draw row borders
                    doc.strokeColor('#cccccc')
                        .rect(tableLeft, currentY, colWidths[0], rowHeight).stroke()
                        .rect(tableLeft + colWidths[0], currentY, colWidths[1], rowHeight).stroke();

                    // Add text
                    doc.fillColor('#000000')
                        .font('Helvetica-Bold')
                        .text(row[0], tableLeft + 5, currentY + 8, {
                            width: colWidths[0] - 10,
                            height: rowHeight - 10,
                            ellipsis: true
                        })
                        .font('Helvetica')
                        .text(row[1], tableLeft + colWidths[0] + 5, currentY + 8, {
                            width: colWidths[1] - 10,
                            height: rowHeight - 10,
                            ellipsis: true
                        });

                    currentY += rowHeight;
                });

                // Footer
                doc.fontSize(8)
                    .text(`Generated by Thesis Management System - ${new Date().toLocaleString()}`,
                        50, doc.page.height - 50, { align: 'center' });

                doc.end();

            } else {
                // Return JSON format
                const formattedData = {
                    student: {
                        name: student.fullName,
                        username: student.user.username,
                        email: student.email,
                        phone: student.phone,
                    },
                    supervisor: supervisor ? {
                        name: supervisor.fullName,
                        email: supervisor.email,
                        phone: supervisor.phone,
                    } : null,
                    topic: topic?.topic || null,
                    preThesis: {
                        title: preThesis.title,
                        description: preThesis.description,
                        status: preThesis.status,
                        grade: preThesis.grade || null,
                        feedback: preThesis.feedback || null,
                        gradeAt: preThesis.gradeAt || null,
                        videoUrl: preThesis.videoUrl,
                        createdAt: preThesis.createdAt,
                        updatedAt: preThesis.updatedAt
                    }
                };

                res.status(200).json(formattedData);
            }

        } catch (error) {
            console.error('Error exporting pre-thesis final report:', error);
            res.status(500).json({ message: "Failed to export pre-thesis final report" });
        }
    }
}

module.exports = new AdminController();