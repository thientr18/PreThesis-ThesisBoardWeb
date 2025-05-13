const { models } = require('../models');
const { compare } = require('bcrypt');

module.exports = {
    // AUTHENTICATION
    comparePassword: async (password, hashedPassword) => {
        try {
            const isMatch = await compare(password, hashedPassword);
            return isMatch;
        } catch (error) {
            console.error('Error comparing passwords:', error);
            throw error;
        }
    },
    // ANNOUNCEMENTS
    createAnnouncement: async (announcementData, recipientIds, transaction) => {
        try {
            const announcement = await models.Announcement.create({ announcementData }, { transaction });
            const recipients = recipientIds.map((userId) => {
                return {
                    userId,
                    announcementId: announcement.id,
                };
            });
            await models.AnnouncementRecipients.bulkCreate(recipients, { transaction });

            return announcement;
        } catch (error) {
            console.error('Error creating announcement:', error);
            throw error;
        }
    },
    getAnnouncementById: async (announcementId, userId) => {
        try {
            const announcement = await models.Announcement.findOne({
                where: { id: announcementId },
                include: [{
                    model: models.AnnouncementRecipients,
                    as: 'recipients',
                    where: { userId },
                    required: false,
                }],
            });

            if (!announcement) {
                throw new Error('Announcement not found');
            }

            return {
                id: announcement.id,
                title: announcement.title,
                content: announcement.content,
                createdAt: announcement.createdAt,
                isRead: announcement.recipients.length > 0 ? announcement.recipients[0].isRead : false,
            };
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    },
    getSentAnnouncements: async (userId) => {
        try {
            const announcements = await models.Announcement.findAll({
                where: { senderId: userId },
                order: [['createdAt', 'DESC']],
                include: [{
                    model: models.AnnouncementRecipients,
                    as: 'recipients',
                    where: { userId },
                    required: false,
                }],
            });
            const formattedAnnouncements = announcements.map((announcement) => {
                return {
                    id: announcement.id,
                    title: announcement.title,
                    content: announcement.content,
                    createdAt: announcement.createdAt,
                    isRead: announcement.recipients.length > 0 ? announcement.recipients[0].isRead : false,
                };
            });
            return formattedAnnouncements;
        } catch (error) {
            console.error('Error fetching sent announcements:', error);
            throw error;
        }
    },
    updateAnnouncement: async (announcementId, announcementData, transaction) => {
        try {
            const announcement = await models.Announcement.findOne({
                where: { id: announcementId }
            });
            if (!announcement) {
                throw new Error('Announcement not found');
            }
            const updatedAnnouncement = await announcement.update(announcementData, { transaction });
            return {
                id: updatedAnnouncement.id,
                title: updatedAnnouncement.title,
                content: updatedAnnouncement.content,
                createdAt: updatedAnnouncement.createdAt,
            };
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    },
    // deleteAnnouncement: update isDeleted to true
    deleteAnnouncement: async (announcementId, transaction) => {
        try {
            const announcement = await models.Announcement.findOne({
                where: { id: announcementId }
            });
            if (!announcement) {
                throw new Error('Announcement not found');
            }
            const deletedAnnouncement = await announcement.update({ isDeleted: true }, { transaction });
            return {
                id: deletedAnnouncement.id,
                title: deletedAnnouncement.title,
                content: deletedAnnouncement.content,
                createdAt: deletedAnnouncement.createdAt,
            };
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw error;
        }
    },
    // USERS
    createStudent: async (studentData, transaction) => {
        try {
            const user = await models.User.create({ 
                username: studentData.username,
                password: studentData.username,
                role: 'student',
                status: 'active' 
            }, { transaction });

            const rawStudent = await models.Student.create({
                userId: user.id,
                fullName: studentData.fullName,
                email: studentData.email,
                phone: studentData.phone || null,
                birthDate: studentData.birthDate || null,
                address: studentData.address || null,
                credits: studentData.credits || 0,
                gpa: studentData.gpa || 0,
                status: studentData.status || 'inactive',
            }, { transaction });

            const student = {
                id: rawStudent.id,
                userId: rawStudent.userId,
                fullName: rawStudent.fullName,
                email: rawStudent.email,
                phone: rawStudent.phone,
                birthDate: rawStudent.birthDate,
                address: rawStudent.address,
                credits: rawStudent.credits,
                gpa: rawStudent.gpa,
                status: rawStudent.status
            };
            return student;
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    },
    getAnnouncements: async ({where}, limit, offset) => {
        try {
            const { count, rows } = await models.AnnouncementRecipients.findAndCountAll({
                where,
                include: [{
                    model: models.Announcement,
                    attributes: ['id', 'title', 'content', 'createdAt'],
                }],
                order: [['createdAt', 'DESC']],
                offset,
                limit
            });

            return { count, rows };
        } catch (error) {
            console.error('Error fetching announcements:', error);
            throw error;
        }
    },
    createStudentSemester: async (studentSemesterData, transaction) => {
        try {
            const rawStudentSemester = await models.StudentSemester.create(studentSemesterData, { transaction });
            const studentSemester = {
                studentId: rawStudentSemester.studentId,
                semesterId: rawStudentSemester.semesterId,
                type: rawStudentSemester.type || 'null',
            };
            return studentSemester;
        } catch (error) {
            console.error('Error creating student semester:', error);
            throw error;
        }
    },
    getAllUsers: async () => {
        try {
            const rawUsers = await models.User.findAll({
                order: [['createdAt', 'DESC']]
            });
            const users = rawUsers.map((user) => {
                return {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    status: user.status,
                };
            });
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
    getAllStudents: async () => {
        try {
            const rawStudents = await models.Student.findAll({
                order: [['createdAt', 'DESC']]
            });
            const students = rawStudents.map((student) => {
                return {
                    id: student.id,
                    userId: student.userId,
                    fullName: student.fullName,
                    email: student.email,
                    phone: student.phone,
                    birthDate: student.birthDate,
                    address: student.address,
                    credits: student.credits,
                    gpa: student.gpa,
                    status: student.statusStudent,
                };
            });
            return students;
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },
    // getStudentById: async (studentId) => {
    //     try {
    //         const student = await models.Student.findOne({
    //             where: { userId: studentId }
    //         });
    //         if (!student) {
    //             throw new Error('Student not found');
    //         }
    //         return {
    //             id: student.id,
    //             userId: student.userId,
    //             fullName: student.fullName,
    //             email: student.email,
    //             phone: student.phone,
    //             birthDate: student.birthDate,
    //             address: student.address,
    //             credits: student.credits,
    //             gpa: student.gpa,
    //             status: student.statusStudent,
    //         };
    //     } catch (error) {
    //         console.error('Error fetching student:', error);
    //         throw error;
    //     }
    // },
    getStudentsBySemesterId: async (semesterId) => {
        try {
            if (!semesterId) {
                const semester = await models.Semester.findOne({
                    where: { isActive: true },
                    attributes: ['id', 'name']
                });
                semesterId = semester ? semester.id : null;
            }

            if (!semesterId) {
                throw new Error("No active semester found");
            }

            const students = await models.StudentSemester.findAll({
                where: { semesterId },
                attributes: ['studentId', 'semesterId', 'type'],
                include: {
                    model: models.Student,
                    as: 'student',
                    attributes: [
                        'userId', 'fullName', 'email', 'phone', 'birthDate',
                        'address', 'credits', 'gpa', 'status'
                    ],
                    include: {
                        model: models.User,
                        as: 'user',
                        attributes: ['username', 'role', 'status'],
                    }
                },
            });

            return students;
        } catch (error) {
            console.error('Error fetching students by semester:', error);
            throw error;
        }
    },
    updateStudentById: async (studentId, studentData, transaction) => {
        try {
            const student = await models.Student.findOne({
                where: { id: studentId }
            });
            if (!student) {
                throw new Error('Student not found');
            }
            const updatedStudent = await student.update(studentData, { transaction });
            return {
                id: updatedStudent.id,
                userId: updatedStudent.userId,
                fullName: updatedStudent.fullName,
                email: updatedStudent.email,
                phone: updatedStudent.phone,
                birthDate: updatedStudent.birthDate,
                address: updatedStudent.address,
                credits: updatedStudent.credits,
                gpa: updatedStudent.gpa,
                status: updatedStudent.statusStudent,
            };
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },
    updateStudentSemesters: async (studentSemesterData, transaction) => {
        try {
            const studentSemester = await models.StudentSemester.findOne({
                where: {
                    studentId: studentSemesterData.studentId,
                    semesterId: studentSemesterData.semesterId
                }
            });

            if (!studentSemester) {
                throw new Error('Student semester not found');
            }

            const updatedStudentSemester = await studentSemester.update(studentSemesterData, { transaction });
            return {
                studentId: updatedStudentSemester.studentId,
                semesterId: updatedStudentSemester.semesterId,
                type: updatedStudentSemester.type || 'null',
            };
        } catch (error) {
            console.error('Error updating student semester:', error);
            throw error;
        }
    },
    getAllTeachers: async () => {
        try {
            const teachers = await models.Teacher.findAll({
                order: [['createdAt', 'DESC']],
                include: {
                    model: models.User,
                    as: 'user',
                    attributes: ['username', 'role', 'status'],
                }
            });

            return teachers;
        } catch (error) {
            console.error('Error fetching teachers:', error);
            throw error;
        }
    },
    createTeacher: async (teacherData, transaction) => {
        try {
            const user = await models.User.create({ 
                username: teacherData.username,
                password: teacherData.username,
                role: 'teacher',
                status: 'active' 
            }, { transaction });

            const rawTeacher = await models.Teacher.create({
                userId: user.id,
                fullName: teacherData.fullName,
                email: teacherData.email,
                phone: teacherData.phone || null,
                birthDate: teacherData.birthDate || null,
                address: teacherData.address || null,
                status: teacherData.status || 'inactive',
            }, { transaction });

            const teacher = {
                id: rawTeacher.id,
                userId: rawTeacher.userId,
                fullName: rawTeacher.fullName,
                email: rawTeacher.email,
                phone: rawTeacher.phone,
                birthDate: rawTeacher.birthDate,
                address: rawTeacher.address,
                status: rawTeacher.status,
            };
            return teacher;
        } catch (error) {
            console.error('Error creating teacher:', error);
            throw error;
        }
    },
    // getTeacherById: async (teacherId) => {
    //     try {
    //         const teacher = await models.Teacher.findOne({
    //             where: { userId: teacherId }
    //         });
    //         if (!teacher) {
    //             throw new Error('Teacher not found');
    //         }
    //         return {
    //             id: teacher.id,
    //             userId: teacher.userId,
    //             fullName: teacher.fullName,
    //             email: teacher.email,
    //             phone: teacher.phone,
    //             birthDate: teacher.birthDate,
    //             address: teacher.address,
    //             status: teacher.status,
    //         };
    //     } catch (error) {
    //         console.error('Error fetching teacher:', error);
    //         throw error;
    //     }
    // },
    updateTeacherById: async (teacherId, teacherData, transaction) => {
        try {
            const teacher = await models.Teacher.findOne({
                where: { id: teacherId }
            });
            if (!teacher) {
                throw new Error('Teacher not found');
            }
            const updatedTeacher = await teacher.update(teacherData, { transaction });
            return {
                id: updatedTeacher.id,
                userId: updatedTeacher.userId,
                fullName: updatedTeacher.fullName,
                email: updatedTeacher.email,
                phone: updatedTeacher.phone,
                birthDate: updatedTeacher.birthDate,
                address: updatedTeacher.address,
                status: updatedTeacher.status,
            };
        } catch (error) {
            console.error('Error updating teacher:', error);
            throw error;
        }
    },
    getAllModerators: async () => {
        try {
            const moderators = await models.Moderator.findAll({
                order: [['createdAt', 'DESC']],
                include: {
                    model: models.User,
                    as: 'user',
                    attributes: ['username', 'role', 'status'],
                }
            });

            return moderators;
        } catch (error) {
            console.error('Error fetching moderators:', error);
            throw error;
        }
    },
    createModerator: async (moderatorData, transaction) => {
        try {
            const user = await models.User.create({ 
                username: moderatorData.username,
                password: moderatorData.username,
                role: 'moderator',
                status: 'active' 
            }, { transaction });

            const rawModerator = await models.Moderator.create({
                userId: user.id,
                fullName: moderatorData.fullName,
                email: moderatorData.email,
                phone: moderatorData.phone || null,
                birthDate: moderatorData.birthDate || null,
                address: moderatorData.address || null,
                status: moderatorData.status || 'inactive',
            }, { transaction });

            const moderator = {
                id: rawModerator.id,
                userId: rawModerator.userId,
                fullName: rawModerator.fullName,
                email: rawModerator.email,
                phone: rawModerator.phone,
                birthDate: rawModerator.birthDate,
                address: rawModerator.address,
                status: rawModerator.status,
            };
            return moderator;
        } catch (error) {
            console.error('Error creating moderator:', error);
            throw error;
        }
    },
    // getModeratorById: async (moderatorId) => {
    //     try {
    //         const moderator = await models.Moderator.findOne({
    //             where: { userId: moderatorId }
    //         });
    //         if (!moderator) {
    //             throw new Error('Moderator not found');
    //         }
    //         return {
    //             id: moderator.id,
    //             userId: moderator.userId,
    //             fullName: moderator.fullName,
    //             email: moderator.email,
    //             phone: moderator.phone,
    //             birthDate: moderator.birthDate,
    //             address: moderator.address,
    //             status: moderator.status,
    //         };
    //     } catch (error) {
    //         console.error('Error fetching moderator:', error);
    //         throw error;
    //     }
    // },
    updateModeratorById: async (moderatorId, moderatorData, transaction) => {
        try {
            const moderator = await models.Moderator.findOne({
                where: { id: moderatorId }
            });
            if (!moderator) {
                throw new Error('Moderator not found');
            }
            const updatedModerator = await moderator.update(moderatorData, { transaction });
            return {
                id: updatedModerator.id,
                userId: updatedModerator.userId,
                fullName: updatedModerator.fullName,
                email: updatedModerator.email,
                phone: updatedModerator.phone,
                birthDate: updatedModerator.birthDate,
                address: updatedModerator.address,
                status: updatedModerator.status,
            };
        } catch (error) {
            console.error('Error updating moderator:', error);
            throw error;
        }
    },
    getAllAdmins: async () => {
        try {
            const rawAdmins = await models.Admin.findAll({
                order: [['createdAt', 'DESC']]
            });
            const admins = rawAdmins.map((admin) => {
                return {
                    userId: admin.userId,
                    fullName: admin.fullName,
                    email: admin.email,
                    phone: admin.phone,
                };
            });
            return admins;
        } catch (error) {
            console.error('Error fetching admins:', error);
            throw error;
        }
    },
    updateAdminById: async (adminId, adminData, transaction) => {
        try {
            const admin = await models.Admin.findOne({
                where: { userId: adminId }
            });
            if (!admin) {
                throw new Error('Admin not found');
            }
            const updatedAdmin = await admin.update(adminData, { transaction });
            return {
                userId: updatedAdmin.userId,
                fullName: updatedAdmin.fullName,
                email: updatedAdmin.email,
                phone: updatedAdmin.phone,
            };
        } catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        }
    },

    // SEMESTERS
    // getAllSemesters: async () => {
    //     try {
    //         const rawSemesters = await models.Semester.findAll({
    //             order: [['startDate', 'DESC']]
    //         });

    //         const semesters = rawSemesters.map((semester) => {
    //             return {
    //                 id: semester.id,
    //                 name: semester.name,
    //                 startDate: semester.startDate,
    //                 endDate: semester.endDate,
    //                 isActive: semester.isActive
    //             };
    //         });
    //         return semesters;
    //     } catch (error) {
    //         console.error('Error fetching semesters:', error);
    //         throw error;
    //     }
    // },
    async getUserDataById(userId) {
        try {
            const user = await models.User.findOne({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }

            const role = user.role;
            if (!role) {
                throw new Error('User role not found');
            }
            
            switch (role) {
                case 'admin':
                    const admin = await models.Admin.findOne({
                        where: { userId: userId }
                    });
                    return {
                        id: admin.userId,
                        fullName: admin.fullName,
                        email: admin.email,
                        phone: admin.phone,
                        birthDate: admin.birthDate,
                        address: admin.address,
                        status: admin.status,
                    };
                case 'moderator':
                    const moderator = await models.Moderator.findOne({
                        where: { userId: userId }
                    });
                    return {
                        id: moderator.userId,
                        fullName: moderator.fullName,
                        email: moderator.email,
                        phone: moderator.phone,
                        birthDate: moderator.birthDate,
                        address: moderator.address,
                        status: moderator.status,
                    };
                case 'teacher':
                    const teacher = await models.Teacher.findOne({
                        where: { userId: userId }
                    });
                    return {
                        id: teacher.userId,
                        fullName: teacher.fullName,
                        email: teacher.email,
                        phone: teacher.phone,
                        birthDate: teacher.birthDate,
                        address: teacher.address,
                        status: teacher.status,
                    };
                case 'student':
                    const student = await models.Student.findOne({
                        where: { userId: userId }
                    });
                    return {
                        id: student.userId,
                        fullName: student.fullName,
                        email: student.email,
                        phone: student.phone,
                        birthDate: student.birthDate,
                        address: student.address,
                        credits: student.credits,
                        gpa: student.gpa,
                        status: student.statusStudent,
                    };
                default:
                    throw new Error('Invalid user role');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
    getUserById: async (userId) => {
        try {
            const user = await models.User.findOne({
                where: { id: userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
            };
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },
    updateUserById: async (userData, transaction) => {
        try {
            const user = await models.User.findOne({
                where: { id: userData.userId }
            });
            if (!user) {
                throw new Error('User not found');
            }
            const updatedUser = await user.update(userData, { transaction });
            return {
                id: updatedUser.id,
                username: updatedUser.username,
                status: updatedUser.status,
            };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },
}
