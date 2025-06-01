const { models, sequelize } = require('../models');
const Joi = require('joi');
const share = require('../utils/share');
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
}

module.exports = new AdminController();