const { models, sequelize } = require('../models');
const Semester = require('../models/Semester');
const share = require('../utils/share');

class TeacherController {
    async getProfile(req, res) {
        const teacherId = req.user.id;
        try {
            const teacher = await share.getTeacherById(teacherId);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });

            
            const activeSemester = await models.Semester.findOne({
                where: { isActive: true }
            });

            const currentSemester = await models.Semester.findOne({
                where: { isCurrent: true }
            });

            let enrolled = [];

            if ( activeSemester.id === currentSemester.id ) {
                enrolled = currentSemester
            } else {
                enrolled = [activeSemester, currentSemester]
            }

            const semesters = await models.TeacherSemester.findAll({
                where: {
                    teacherId: teacher.id,
                    semesterId: enrolled.map(t => t.id)
                },
                include: [
                    {
                        model: Semester,
                        as: 'semester',
                        attributes: ['name', 'startDate', 'endDate', 'isCurrent', 'isActive'],
                    }
                ],
                attributes: ['teacherId', 'semesterId']
            })
            return res.status(200).json({ teacher, semesters});
        } catch (error) {
            console.error('Error fetching teacher:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getTopics(req, res) {
        const userId = req.user.id;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) return res.status(404).json({ message: "Teacher semester not found" });

            const topics = await share.getTopicsByTeacherId(teacher.teacherId, teacher.semesterId);
            if (!topics) return res.status(404).json({ message: "Topics not found", teacher, semester });
            if (topics.length === 0) return res.status(200).json({ message: "Topics fetched successfully", topics: topics || [], teacher, semester });

            return res.status(200).json({ message: "Topics fetched successfully", topics, teacher, semester });
        } catch (error) {
            console.error('Error fetching topics:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async createTopic(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const { topic, description, maximumSlots, minGpa } = req.body;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            if (teacher.remainingPreThesisSlots <= 0) {
                return res.status(400).json({ message: 'No remaining slots available' });
            }
            if (maximumSlots <= 0) {
                return res.status(400).json({ message: 'Maximum slots must be greater than 0' });
            }
            if (!minGpa) {
                return res.status(400).json({ message: 'Minimum GPA is required' });
            }
            if (minGpa < 0 || minGpa > 4) {
                return res.status(400).json({ message: 'Minimum GPA must be between 0 and 4' });
            }
            if (!topic || !description) {
                return res.status(400).json({ message: 'Topic and description are required' });
            }
            if (maximumSlots > teacher.remainingPreThesisSlots) {
                return res.status(400).json({ message: 'Requested slots exceed available slots' });
            }
            
            const topicData = {
                supervisorId: teacher.teacherId,
                semesterId: semester.id,
                topic,
                description,
                maximumSlots,
                remainingSlots: maximumSlots,
                minGpa
            };

            const newTopic = await models.Topic.create(topicData, { transaction: transaction });
            await models.TeacherSemester.update(
                { remainingPreThesisSlots: teacher.remainingPreThesisSlots - maximumSlots },
                { where: { teacherId: teacher.teacherId, semesterId: teacher.semesterId },
                transaction: transaction,
            });

            await transaction.commit();
            return res.status(201).json({ message: "Topic created successfully", topic: newTopic });
        } catch (error) {
            console.error('Error creating topic:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateTopic(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const topicId = req.params.topicId;
        const { topic, description, maximumSlots, minGpa } = req.body;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            if (maximumSlots <= 0) {
                return res.status(400).json({ message: 'Maximum slots must be greater than 0' });
            }
            if (!minGpa) {
                return res.status(400).json({ message: 'Minimum GPA is required' });
            }
            if (minGpa < 0 || minGpa > 4) {
                return res.status(400).json({ message: 'Minimum GPA must be between 0 and 4' });
            }
            if (!topic || !description) {
                return res.status(400).json({ message: 'Topic and description are required' });
            }            

            const topicToUpdate = await models.Topic.findOne({
                where: {
                    id: topicId
                }
            });
            if (!topicToUpdate) {
                return res.status(404).json({ message: "Topic not found" });
            }
            const registeredSlots = topicToUpdate.maximumSlots - topicToUpdate.remainingSlots;
            // 3/4 => 3 - 4 = 1
            // remain = 4 - 1 = 3
            const oldRemaining = teacher.remainingPreThesisSlots;
            const oldMaximum = topicToUpdate.maximumSlots;
            const newRemaining = oldRemaining + oldMaximum - maximumSlots;
            if (newRemaining < 0) {
                return res.status(400).json({ message: 'Requested slots exceed available slots' });
            }
            
            const updatedTopicData = {
                topic,
                description,
                maximumSlots,
                remainingSlots: maximumSlots - registeredSlots,
                minGpa
            };
            
            await models.Topic.update(updatedTopicData, {
                where: {
                    id: topicId
                },
                transaction: transaction
            });
            await models.TeacherSemester.update(
                { remainingPreThesisSlots: newRemaining },
                { where: { teacherId: teacher.teacherId, semesterId: teacher.semesterId },
                transaction: transaction,
            });

            await transaction.commit();
            return res.status(200).json({ message: "Topic updated successfully" });
        } catch (error) {
            console.error('Error updating topic:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getPreThesisRegistration(req, res) {
        const userId = req.user.id;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const topics = await share.getTopicsByTeacherId(teacher.teacherId, teacher.semesterId);
            if (!topics) return res.status(404).json({ message: "Topics not found", teacher, semester });

            const registrations = await models.PreThesisRegistration.findAll({
                where: {
                    status: 'pending',
                    topicId: topics.map(topic => topic.id)
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                    },
                    {
                        model: models.Topic,
                        as: 'topic',
                        attributes: ['id', 'topic', 'description', 'maximumSlots', 'remainingSlots', 'minGpa', 'minCredits', 'requirements', 'status'],
                    }
                ]
            });
            return res.status(200).json({ message: "Pre-thesis registrations fetched successfully", registrations });
        } catch (error) {
            console.error('Error fetching pre-thesis registrations:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async approvePreThesisRegistration(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const registrationId = req.params.registrationId;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const registration = await models.PreThesisRegistration.findOne({
                where: {
                    id: registrationId,
                    status: 'pending',
                }
            });
            if (!registration) {
                return res.status(404).json({ message: "Pre-thesis registration not found" });
            }

            const topic = await models.Topic.findOne({
                where: {
                    id: registration.topicId,
                }
            });
            if (!topic) {
                return res.status(404).json({ message: "Topic not found" });
            }
            if (topic.remainingSlots <= 0) {
                return res.status(400).json({ message: 'No remaining slots available for this topic' });
            }
            if (topic.supervisorId !== teacher.teacherId) {
                return res.status(403).json({ message: 'You are not authorized to accept this registration' });
            }
            if (topic.remainingSlots <= 0) {
                return res.status(400).json({ message: 'No remaining slots available for this topic' });
            }

            const s = await models.Student.findOne({
                where: {
                    id: registration.studentId,
                }
            });
            if (!s) {
                return res.status(404).json({ message: "Student not found" });
            }
            if (!s) {
                return res.status(404).json({ message: "Student not found" });
            }
            if (s.gpa < topic.minGpa) {
                return res.status(400).json({ message: 'Student GPA does not meet the minimum requirement' });
            }
            if (s.credits < topic.minCredits) {
                return res.status(400).json({ message: 'Student credits do not meet the minimum requirement' });
            }
            if (s.status !== 'active') {
                return res.status(400).json({ message: 'Student is not active' });
            }

            const student = await models.StudentSemester.findOne({
                where: {
                    studentId: registration.studentId,
                    semesterId: semester.id
                }
            });
            if (!student) {
                return res.status(404).json({ message: "Student semester not found" });
            }
            if (student.isRegistered) {
                return res.status(400).json({ message: 'Student is already registered for a pre-thesis' });
            }

            const newRemaining = topic.remainingSlots - 1;
            if (newRemaining < 0) {
                return res.status(400).json({ message: 'Requested slots exceed available slots' });
            }
            const topicUpdate = await models.Topic.update(
                { remainingSlots: newRemaining },
                { where: { id: topic.id }, transaction }
            );
            if (topicUpdate.remainingSlots <= 0) {
                await models.Topic.update(
                    { status: 'closed' },
                    { where: { id: topic.id }, transaction }
                );
            }
            await models.StudentSemester.update(
                { isRegistered: true },
                { where: { studentId: registration.studentId, semesterId: semester.id }, transaction }
            );
            const updatedRegistration = await models.PreThesisRegistration.update(
                { status: 'approved' },
                { where: { id: registrationId }, transaction }
            );
            console.log('Updated registration:', updatedRegistration);
            const r = await models.PreThesisRegistration.findAll({
                where: {
                    studentId: registration.studentId,
                    status: 'pending',
                }
            });

            if (r.length > 0) {
                await models.PreThesisRegistration.destroy({
                    where: {
                        studentId: registration.studentId,
                        status: 'pending',
                    },
                    transaction
                });
            }

            await models.PreThesis.create({
                studentId: registration.studentId,
                topicId: registration.topicId,
                topic: topic.topic,
                title: registration.title,
                description: registration.description,
                status: 'pending',
                dueDate: semester.endDate,
            }, { transaction });

            console.log('Updated registration:');

            await transaction.commit();
            return res.status(200).json({ message: "Pre-thesis registration accepted successfully" });
        } catch (error) {
            console.error('Error accepting pre-thesis registration:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async rejectPreThesisRegistration(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const registrationId = req.params.registrationId;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const registration = await models.PreThesisRegistration.findOne({
                where: {
                    id: registrationId,
                    status: 'pending',
                }
            });
            if (!registration) {
                return res.status(404).json({ message: "Pre-thesis registration not found" });
            }

            await models.PreThesisRegistration.update(
                { status: 'rejected' },
                { where: { id: registrationId }, transaction }
            );

            await transaction.commit();
            return res.status(200).json({ message: "Pre-thesis registration rejected successfully" });
        } catch (error) {
            console.error('Error rejecting pre-thesis registration:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    
    async getPreThesisStudents(req, res) {
        const userId = req.user.id;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const topics = await share.getTopicsByTeacherId(teacher.teacherId, teacher.semesterId);
            if (!topics) return res.status(404).json({ message: "Topics not found", teacher, semester });

            const preThesisStudents = await models.PreThesis.findAll({
                where: {
                    topicId: topics.map(topic => topic.id),
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    },
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        attributes: ['id', 'topic', 'description', 'maximumSlots', 'remainingSlots', 'minGpa', 'minCredits', 'requirements', 'status'],
                    }
                ]
            });

            return res.status(200).json({ message: "Pre-thesis students fetched successfully", preThesisStudents, semester });
        } catch (error) {
            console.error('Error fetching pre-thesis students:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deletePreThesis(req, res) {
        const { preThesisId } = req.params;
        try {
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId
                }
            });
            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found" });
            }

            const student = await models.StudentSemester.findOne({
                where: {
                    studentId: preThesis.studentId,
                    semesterId: preThesis.semesterId
                }
            });
            if (!student) {
                return res.status(404).json({ message: "Student semester not found" });
            }

            await models.StudentSemester.update(
                { isRegistered: false },
                { where: { studentId: preThesis.studentId, semesterId: preThesis.semesterId } }
            );

            await preThesis.destroy();

            return res.status(200).json({ message: "Thesis deleted successfully" });
        } catch (error) {
            console.error('Error deleting thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getPreThesis(req, res) {
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                },
                include: [
                    {
                        model: models.Topic,
                        as: "preThesisTopic",
                        where: {
                            teacherId: t.id,
                        },
                        attributes: ['id', 'topic', 'description'],
                    },
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                    }
                ],
                attributes: ['id', 'studentId', 'topicId', 'title', 'description', 'report', 'demo', 'grade', 'dueDate', 'status'],
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found" });
            }

            return res.status(200).json({ message: "Pre-thesis fetched successfully", preThesis });
        } catch (error) {
            console.error('Error fetching pre-thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async assignThesis(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const studentId = req.params.studentId;
        if (!studentId) {
            return res.status(400).json({ message: "Student ID is required" });
        }
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required" });
        }
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            if (teacher.remainingThesisSlots <= 0) {
                return res.status(400).json({ message: 'No remaining slots available' });
            }

            const s = await models.Student.findOne({
                where: {
                    id: studentId,
                    status: 'active'
                }
            });
            if (!s) {
                return res.status(404).json({ message: "Student not found" });
            }

            const student = await models.StudentSemester.findOne({
                where: {
                    studentId: studentId,
                    semesterId: semester.id,
                    type: 'thesis',
                    isRegistered: false,
                }
            });
            if (!student) {
                return res.status(404).json({ message: "Student semester not found" });
            }

            const thesis = await models.Thesis.create({
                studentId,
                supervisorId: teacher.teacherId,
                semesterId: semester.id,
                title,
                description,
            }, { transaction });

            await models.StudentSemester.update(
                { isRegistered: true },
                { where: { studentId: studentId, semesterId: semester.id, type: 'thesis' }, transaction }
            );
            const teacherSemester = await models.TeacherSemester.update(
                { remainingThesisSlots: teacher.remainingThesisSlots - 1 },
                { where: { teacherId: teacher.teacherId, semesterId: teacher.semesterId }, transaction }
            );
            if (teacherSemester.remainingThesisSlots <= 0) {
                await models.TeacherSemester.update(
                    { status: 'inactive' },
                    { where: { teacherId: teacher.teacherId, semesterId: teacher.semesterId }, transaction }
                );
            }

            const thesisStudents = await models.Thesis.findAll({
                where: {
                    supervisorId: teacher.teacherId,
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    }
                ]
            });

            await transaction.commit();
            return res.status(201).json({ message: "Thesis assigned successfully", thesisStudents });
        } catch (error) {
            console.error('Error assigning thesis:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getThesisStudents(req, res) {
        const userId = req.user.id;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const teacher = await models.TeacherSemester.findOne({
                where: {
                    teacherId: t.id,
                    semesterId: semester.id
                }
            });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }

            const thesisStudents = await models.Thesis.findAll({
                where: {
                    supervisorId: teacher.teacherId,
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    }
                ]
            });

            const notRegisteredStudents = await models.StudentSemester.findAll({
                where: {
                    semesterId: semester.id,
                    type: 'thesis',
                    isRegistered: false,
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'userId', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    }
                ]
            });
            return res.status(200).json({ message: "Thesis students fetched successfully", thesisStudents, notRegisteredStudents, semester });
        } catch (error) {
            console.error('Error fetching thesis students:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateThesis(req, res) {
        const { studentId } = req.params;
        const { title, description } = req.body;

        try {
            const thesis = await models.Thesis.findOne({
                where: {
                    id: studentId
                }
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }

            thesis.title = title;
            thesis.description = description;

            await thesis.save();

            return res.status(200).json({ message: "Thesis updated successfully", thesis });
        } catch (error) {
            console.error('Error updating thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteThesis(req, res) {
        const { thesisId } = req.params;

        try {
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId
                }
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }

            const student = await models.StudentSemester.findOne({
                where: {
                    studentId: thesis.studentId,
                    semesterId: thesis.semesterId
                }
            });
            
            if (!student) {
                return res.status(404).json({ message: "Student semester not found" });
            }
            
            await models.StudentSemester.update(
                { isRegistered: false },
                { where: { studentId: thesis.studentId, semesterId: thesis.semesterId } }
            );

            await thesis.destroy();

            return res.status(200).json({ message: "Thesis deleted successfully" });
        } catch (error) {
            console.error('Error deleting thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getThesis(req, res) {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId,
                    supervisorId: t.id,
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName', 'email', 'phone', 'gpa', 'credits'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }
            return res.status(200).json({ message: "Thesis fetched successfully", thesis });
        } catch (error) {
            console.error('Error fetching thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new TeacherController();