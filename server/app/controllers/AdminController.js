const { models, sequelize } = require('../models');
const Joi = require('joi');
const share = require('../utils/share');
const charts = require('../utils/charts');
const { getIO } = require('../utils/socket');

const validateUser = (user) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(20).required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('admin', 'user').required(),
        password: Joi.string().min(6).required(),
    });

    return schema.validate(user);
};

class AdminController {
    // Route: /admin/announcements/new
    async createAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const data = req.body;
        const senderId = req.user.id;

        const announcementData = {
            senderId,
            title: data.title,
            content: data.content,
        };

        const recipientIds = data.recipientIds; // Array of user IDs
        if (!recipientIds || recipientIds.length === 0) {
            return res.status(400).json({ message: "Recipient IDs are required" });
        }
        
        try {
            const announcement = await share.createAnnouncement(announcementData, recipientIds, t);
          
            // Emit to each user
            const io = getIO();
            recipientIds.forEach(userId => {
                io.to(`user_${userId}`).emit("new-announcement", {
                    title: announcement.title,
                    content: announcement.content,
                    createdAt: announcement.createdAt,
                });
            });
          
            return announcement;
        } catch (error) {
            console.error("Error creating announcement:", error);
            res.status(500).json({ message: "Failed to create announcement" });
        }
    }
    
    // Route: /admin/announcements
    async getAnnouncements (req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        const isUnread = req.query.unread === 'true';
      
        const where = {
          userId,
          isDeleted: false
        };
      
        if (isUnread) where.isRead = false;
      
        try {
            const { count, rows } = await share.getAnnouncements({ where, limit, offset });
            if (!rows) return res.status(404).json({ message: "Announcements not found" });
      
            res.status(200).json({
                total: count,
                page,
                pageSize: rows.length,
                announcements: rows
            });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Failed to load announcements' });
        }
    };

    // Route: /admin/announcements/sent
    async getSentAnnouncements(req, res) {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        try {
            const { count, rows } = await share.getSentAnnouncements(userId, limit, offset);
            if (!rows) return res.status(404).json({ message: "Sent announcements not found" });

            res.status(200).json({
                total: count,
                page,
                pageSize: rows.length,
                announcements: rows
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id
    async getAnnouncementById(req, res) {
        const userId = req.user.id;
        const announcementId = req.params.id;
        try {
            const announcement = await share.getAnnouncementById(announcementId, userId);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            // Mark as read
            await share.markAnnouncementAsRead(announcementId, userId);

            res.status(200).json(announcement);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id/update
    async updateAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const announcementId = req.params.id;
        const data = req.body;
        const announcementData = {
            title: data.title,
            content: data.content,
        };

        try {
            const announcement = await share.updateAnnouncement(announcementId, announcementData, t);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            await t.commit();
            res.status(200).json({ message: "Announcement updated successfully", data: announcement });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/announcements/:id/delete
    async deleteAnnouncement(req, res) {
        const t = await sequelize.transaction();
        const announcementId = req.params.id;
        const userId = req.user.id;

        try {
            const announcement = await share.deleteAnnouncement(announcementId, userId, t);
            if (!announcement) return res.status(404).json({ message: "Announcement not found" });

            await t.commit();
            res.status(200).json({ message: "Announcement deleted successfully" });
        } catch (error) {
            console.error(error);
            await t.rollback();
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

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
            const totalPreThesis = await models.StudentPreThesis.count({ where: { semesterId } });
            const totalThesis = await models.Thesis.count({ where: { semesterId } });

            res.status(200).json({ semester, totalStudents, totalTeachers, totalPreThesis, totalThesis, });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }

    // Route: /admin/students/dashboard
    // CHƯA BIẾT CÁCH LÀM
    async getStudentDashboard(req, res) {
        const semesterId = req.body.semesterId;
    }

    // Route: /admin/students/
    async getStudents(req, res) {
        let semesterId = req.query.semesterId || req.query.semester;

        try {
            const students = await share.getStudentsBySemesterId(semesterId);
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

            res.status(200).json(semesters);
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

    // Route: /admin/teachers/dashboard
    // CHƯA BIẾT CÁCH LÀM
    async getTeacherDashboard(req, res) {}

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
    // async getTeacherById(req, res) {
    //     try {
    //         const teacher = await share.getTeacherById(req.params.teacherId);
    //         if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    //         res.status(200).json(teacher);
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ message: "Internal Server Error" });
    //     }
    // }

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

    // Route: /admin/moderators/dashboard
    // CHƯA BIẾT CÁCH LÀM
    async getModeratorDashboard(req, res) {}

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
}

module.exports = new AdminController();