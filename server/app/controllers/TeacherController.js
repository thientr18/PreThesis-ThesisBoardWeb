const { models, sequelize } = require('../models');
const Semester = require('../models/Semester');
const Configuration = require('../models/monongoDB/Configuration');
const { createNotification } = require('../services/notificationService');
const share = require('../utils/share');

class TeacherController {
    async getProfile(req, res) {
        const teacherId = req.user.id;
        try {
            const teacher = await share.getTeacherById(teacherId);
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });

            // Lấy semester active
            const activeSemester = await models.Semester.findOne({
                where: { isActive: true }
            });

            // Lấy các semesterId mà giáo viên có mặt trong TeacherSemester hoặc ThesisTeacher
            const preThesisSemesters = await models.TeacherSemester.findAll({
                where: { teacherId: teacher.id },
                attributes: ['semesterId']
            });
            const thesisSemesters = await models.ThesisTeacher.findAll({
                where: { teacherId: teacher.id },
                include: [{
                    model: models.Thesis,
                    as: 'thesis',
                    attributes: ['semesterId']
                }]
            });

            // Lấy tất cả semesterId
            const semesterIds = [
                ...preThesisSemesters.map(ts => ts.semesterId),
                ...thesisSemesters.map(tt => tt.thesis?.semesterId).filter(Boolean)
            ];
            // Loại bỏ trùng lặp
            const uniqueSemesterIds = [...new Set(semesterIds)];

            // Lấy thông tin semester
            const semesters = await models.Semester.findAll({
                where: {
                    id: uniqueSemesterIds,
                    isActive: true // chỉ lấy semester đang active
                },
            });

            return res.status(200).json({ teacher, semesters });
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
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not in the semester' });
            }
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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
            }, { transaction });

            await createNotification({
                recipientId: s.userId,
                type: 'alert',
                title: 'Pre-thesis Registration Accepted',
                message: `Your pre-thesis registration has been accepted: ${topic.topic}`
            });

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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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

            const s = await models.Student.findOne({
                where: {
                    id: registration.studentId,
                }
            });

            await models.PreThesisRegistration.update(
                { status: 'rejected' },
                { where: { id: registrationId }, transaction }
            );

            await createNotification({
                recipientId: s.userId,
                type: 'alert',
                title: 'Pre-thesis Registration Rejected',
                message: `Your pre-thesis registration has been rejected: ${topic.topic}`
            });

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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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
                            supervisorId: t.id,
                        },
                        attributes: ['id', 'topic', 'description'],
                    },
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
                        model: models.PreThesisSubmission,
                        as: 'submissions',
                        required: false,
                        order: [['submittedAt', 'DESC']],
                    }
                ],
                attributes: ['id', 'studentId', 'topicId', 'title', 'description', 'videoUrl', 'status'],
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found" });
            }

            // Process submissions similar to StudentController
            const submissions = preThesis.submissions || [];
            const reportSubmissions = submissions.filter(sub => sub.type === 'report');
            const projectSubmissions = submissions.filter(sub => sub.type === 'project');

            const latestReportSubmission = reportSubmissions.length > 0 
                ? reportSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;
            const latestProjectSubmission = projectSubmissions.length > 0 
                ? projectSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;

            const preThesisWithSubmissions = {
                ...preThesis.toJSON(),
                report: latestReportSubmission ? latestReportSubmission.fileUrl : null,
                project: latestProjectSubmission ? latestProjectSubmission.fileUrl : null,
                reportSubmittedAt: latestReportSubmission ? latestReportSubmission.submittedAt : null,
                projectSubmittedAt: latestProjectSubmission ? latestProjectSubmission.submittedAt : null,
                reportSubmissionCount: reportSubmissions.length,
                projectSubmissionCount: projectSubmissions.length
            };

            return res.status(200).json({ message: "Pre-thesis fetched successfully", preThesis: preThesisWithSubmissions });
        } catch (error) {
            console.error('Error fetching pre-thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async gradePreThesis(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;
        const { grade, feedback } = req.body;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });

            // Validate grade
            if (grade === undefined || grade === null) {
                return res.status(400).json({ message: 'Grade is required' });
            }
            if (grade < 0 || grade > 100) {
                return res.status(400).json({ message: 'Grade must be between 0 and 100' });
            }

            // Find pre-thesis and verify supervisor access (without semester join)
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        where: {
                            supervisorId: t.id
                        },
                        attributes: ['id', 'topic', 'description', 'semesterId']
                    }
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found or access denied" });
            }

            // Get semester information from MySQL
            const semester = await models.Semester.findByPk(preThesis.preThesisTopic.semesterId, {
                attributes: ['id', 'name']
            });

            if (!semester) {
                return res.status(404).json({ message: "Semester not found" });
            }

            // Get semester end date from MongoDB configuration
            const endDateConfig = await Configuration.findOne({
                key: `end_date_${semester.id}`,
                semesterId: semester.id,
                scope: 'semester'
            });

            if (!endDateConfig || !endDateConfig.value) {
                return res.status(400).json({ 
                    message: "Semester end date not configured. Please contact administrator." 
                });
            }

            // Check if semester end date has passed
            const currentDate = new Date();
            const semesterEndDate = new Date(endDateConfig.value);
            
            if (currentDate > semesterEndDate) {
                return res.status(400).json({ 
                    message: `Grading period has ended. Semester "${semester.name}" ended on ${semesterEndDate.toDateString()}` 
                });
            }
            
            let newStatus = preThesis.status;
            if (grade >= 50) {
                newStatus = 'approved';
            } else {
                newStatus = 'failed';
            }

            await models.PreThesis.update(
                {
                    grade: grade,
                    feedback: feedback || null,
                    gradedAt: new Date(),
                    status: newStatus
                },
                {
                    where: { id: preThesis.id },
                    transaction
                }
            );

            // Get student for notification
            const student = await models.Student.findOne({
                where: { id: preThesis.studentId }
            });

            // Create notification for student
            await createNotification({
                recipientId: student.userId,
                type: 'alert',
                title: 'Pre-thesis Graded',
                message: `Your pre-thesis "${preThesis.title}" has been graded: ${grade}/100 - ${newStatus.toUpperCase()}`
            });

            await transaction.commit();
            return res.status(200).json({ 
                message: "Pre-thesis graded successfully",
                grade: grade,
                feedback: feedback || null,
                status: newStatus,
                semesterEndDate: semesterEndDate
            });

        } catch (error) {
            console.error('Error grading pre-thesis:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getPreThesisGrade(req, res) {
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });

            // Find pre-thesis and verify supervisor access (without semester join)
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        where: {
                            supervisorId: t.id
                        },
                        attributes: ['id', 'topic', 'description', 'semesterId']
                    }
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found or access denied" });
            }

            // Get semester information from MySQL
            const semester = await models.Semester.findByPk(preThesis.preThesisTopic.semesterId, {
                attributes: ['id', 'name']
            });

            if (!semester) {
                return res.status(404).json({ message: "Semester not found" });
            }

            // Get semester end date from MongoDB configuration
            const endDateConfig = await Configuration.findOne({
                key: `end_date_${semester.id}`,
                semesterId: semester.id,
                scope: 'semester'
            });

            let canGrade = true;
            let semesterEndDate = null;

            if (endDateConfig && endDateConfig.value) {
                semesterEndDate = new Date(endDateConfig.value);
                const currentDate = new Date();
                canGrade = currentDate <= semesterEndDate;
            }

            return res.status(200).json({ 
                message: "Grade fetched successfully",
                grade: preThesis.grade,
                semester: {
                    id: semester.id,
                    name: semester.name,
                    endDate: semesterEndDate
                },
                feedback: preThesis.feedback,
                status: preThesis.status,
                gradedAt: preThesis.gradedAt,
                canGrade: canGrade
            });

        } catch (error) {
            console.error('Error fetching pre-thesis grade:', error);
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
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

            await models.ThesisTeacher.create({
                thesisId: thesis.id,
                teacherId: teacher.teacherId,
                role: 'supervisor'
            }, { transaction });

            const thesisStudents = await models.Thesis.findAll({
                where: {
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

            await createNotification({
                recipientId: s.userId,
                type: 'alert',
                title: 'Thesis Assigned',
                message: `You have been assigned a new thesis: ${thesis.title}`
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
                return res.status(404).json({ message: 'Teacher not in the semester' });
            }

            // Find theses where this teacher is the supervisor
            const thesisStudents = await models.Thesis.findAll({
                where: {
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
                    },
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        where: {
                            teacherId: t.id,
                            role: 'supervisor'
                        },
                        required: true,
                        include: [
                            {
                                model: models.Teacher,
                                as: 'teacher',
                                attributes: ['id', 'fullName', 'email', 'phone'],
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

    async getThesisBelongingsToTeacher(req, res) {
        const userId = req.user.id;
        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });

            const semester = await models.Semester.findOne({
                where: { isActive: true },
                attributes: ['id', 'name']
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const thesisStudents = await models.Thesis.findAll({
                where: {
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['id', 'fullName'],
                        include: [
                            {
                                model: models.User,
                                as: 'user',
                                attributes: ['username'],
                            }
                        ]
                    },
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        where: {
                            teacherId: t.id
                        },
                        attributes: ['role'],
                        required: true,
                    }
                ],
            });

            return res.status(200).json({ message: "Thesis students fetched successfully", thesisStudents, semester });
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

            const student = await models.Student.findOne({
                where: {
                    id: thesis.studentId
                }
            });

            await createNotification({
                recipientId: student.userId,
                type: 'alert',
                title: 'Thesis Update!',
                message: `Your thesis has been updated by your supervisor: ${thesis.title}`
            })

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
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        include: [
                            {
                                model: models.Teacher,
                                as: 'teacher',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                            }
                        ],
                        attributes: ['role']
                    },
                    {
                        model: models.ThesisSubmission,
                        as: 'submissions',
                        required: false,
                        order: [['submittedAt', 'DESC']],
                    }
                ],
                attributes: ['id', 'studentId', 'semesterId', 'title', 'description', 'videoUrl', 'status', 'defenseDate', 'createdAt', 'finalGrade'],
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found" });
            }
            // if teacher is not supervisor or reviewer or committee member, deny access
            if (!thesis.thesisTeachers || thesis.thesisTeachers.length === 0) {
                return res.status(403).json({ message: "Access denied" });
            }
            
            const thesisTeacher = thesis.thesisTeachers.find(tt => tt.teacher.id === t.id);
            if (!thesisTeacher) {
                return res.status(403).json({ message: "Access denied" });
            }

            // Get all grades for this thesis
            const allGrades = await models.ThesisGrade.findAll({
                where: {
                    thesisId: thesis.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'teacher',
                        attributes: ['id', 'fullName']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Process submissions for all types
            const submissions = thesis.submissions || [];
            const reportSubmissions = submissions.filter(sub => sub.type === 'report');
            const projectSubmissions = submissions.filter(sub => sub.type === 'project');
            const presentationSubmissions = submissions.filter(sub => sub.type === 'presentation');

            const latestReportSubmission = reportSubmissions.length > 0 
                ? reportSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;
            const latestProjectSubmission = projectSubmissions.length > 0 
                ? projectSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;
            const latestPresentationSubmission = presentationSubmissions.length > 0 
                ? presentationSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;

            // Calculate final grade
            let finalGrade = null;
            let gradeBreakdown = {};
            
            if (allGrades.length > 0) {
                // Group grades by type
                const supervisorGrades = allGrades.filter(g => g.gradeType === 'supervisor');
                const reviewerGrades = allGrades.filter(g => g.gradeType === 'reviewer');
                const committeeGrades = allGrades.filter(g => g.gradeType === 'committee');

                // Calculate averages for each type
                const avgSupervisor = supervisorGrades.length > 0 
                    ? supervisorGrades.reduce((sum, g) => sum + g.grade, 0) / supervisorGrades.length 
                    : 0;
                const avgReviewer = reviewerGrades.length > 0 
                    ? reviewerGrades.reduce((sum, g) => sum + g.grade, 0) / reviewerGrades.length 
                    : 0;
                const avgCommittee = committeeGrades.length > 0 
                    ? committeeGrades.reduce((sum, g) => sum + g.grade, 0) / committeeGrades.length 
                    : 0;

                gradeBreakdown = {
                    supervisor: { average: avgSupervisor, count: supervisorGrades.length },
                    reviewer: { average: avgReviewer, count: reviewerGrades.length },
                    committee: { average: avgCommittee, count: committeeGrades.length }
                };

                // Calculate final grade with weights (supervisor: 50%, reviewer: 30%, committee: 20%)
                const totalWeight = (supervisorGrades.length > 0 ? 0.5 : 0) + 
                                  (reviewerGrades.length > 0 ? 0.3 : 0) + 
                                  (committeeGrades.length > 0 ? 0.2 : 0);
                
                if (totalWeight > 0) {
                    finalGrade = (
                        (avgSupervisor * (supervisorGrades.length > 0 ? 0.5 : 0)) +
                        (avgReviewer * (reviewerGrades.length > 0 ? 0.3 : 0)) +
                        (avgCommittee * (committeeGrades.length > 0 ? 0.2 : 0))
                    ) / totalWeight;
                }
            }

            const thesisWithSubmissions = {
                ...thesis.toJSON(),
                report: latestReportSubmission ? latestReportSubmission.fileUrl : null,
                project: latestProjectSubmission ? latestProjectSubmission.fileUrl : null,
                presentation: latestPresentationSubmission ? latestPresentationSubmission.fileUrl : null,
                reportSubmittedAt: latestReportSubmission ? latestReportSubmission.submittedAt : null,
                projectSubmittedAt: latestProjectSubmission ? latestProjectSubmission.submittedAt : null,
                presentationSubmittedAt: latestPresentationSubmission ? latestPresentationSubmission.submittedAt : null,
                reportSubmissionCount: reportSubmissions.length,
                projectSubmissionCount: projectSubmissions.length,
                presentationSubmissionCount: presentationSubmissions.length,
                grades: allGrades,
                gradeBreakdown,
                finalGrade: thesis.finalGrade,
            };

            return res.status(200).json({ 
                message: "Thesis fetched successfully", 
                thesis: thesisWithSubmissions,
                currentTeacher: {
                    id: t.id,
                    role: thesis.thesisTeachers.find(tt => tt.teacher.id === t.id)?.role || 'supervisor'
                }
            });
        } catch (error) {
            console.error('Error fetching thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async gradeThesis(req, res) {
        const transaction = await sequelize.transaction();
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        const { value, feedback } = req.body;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });
            if (t.status !== 'active') return res.status(404).json({ message: "Teacher not active" });

            // Validate grade
            if (value === undefined || value === null) {
                return res.status(400).json({ message: 'Grade is required' });
            }
            if (value < 0 || value > 100) {
                return res.status(400).json({ message: 'Grade must be between 0 and 100' });
            }

            // Find thesis and verify teacher access through ThesisTeacher
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId
                },
                include: [
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        where: {
                            teacherId: t.id
                        },
                        required: true
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            // Get teacher's role
            const teacherRole = thesis.thesisTeachers.find(tt => tt.teacherId === t.id)?.role || 'supervisor';

            // Get semester information
            const semester = await models.Semester.findByPk(thesis.semesterId, {
                attributes: ['id', 'name']
            });

            if (!semester) {
                return res.status(404).json({ message: "Semester not found" });
            }

            if (Date.now() < thesis.defenseDate && teacherRole === 'committee') {
                return res.status(400).json({ 
                    message: "Thesis cannot be graded before defense date." 
                });
            }

            if (teacherRole === 'committee' && !thesis.defenseDate) {
                return res.status(400).json({ 
                    message:  "Committee members can only grade after the defense date."
                });
            }

            // Get semester end date from MongoDB configuration
            const endDateConfig = await Configuration.findOne({
                key: `end_date_${semester.id}`,
                semesterId: semester.id,
                scope: 'semester'
            });

            if (!endDateConfig || !endDateConfig.value) {
                return res.status(400).json({ 
                    message: "Semester end date not configured. Please contact administrator." 
                });
            }

            // Check if grade already exists
            const existingGrade = await models.ThesisGrade.findOne({
                where: {
                    thesisId: thesis.id,
                    teacherId: t.id,
                    gradeType: teacherRole
                }
            });

            if (existingGrade) {
                // Update existing grade
                await models.ThesisGrade.update(
                    {
                        grade: value,
                        feedback: feedback || null,
                    },
                    {
                        where: {
                            id: existingGrade.id
                        },
                        transaction
                    }
                );
            } else {
                // Create new grade
                await models.ThesisGrade.create({
                    thesisId: thesis.id,
                    teacherId: t.id,
                    gradeType: teacherRole,
                    grade: value,
                    feedback: feedback || null
                }, { transaction });
            }

            // Fetch all assigned teachers and all grades again (to get the latest)
            const allAssignedTeachers = await models.ThesisTeacher.findAll({
                where: { thesisId: thesis.id },
                attributes: ['teacherId', 'role'],
                transaction
            });
            const allGrades = await models.ThesisGrade.findAll({
                where: { thesisId: thesis.id },
                attributes: ['teacherId', 'gradeType', 'grade'],
                transaction
            });

            // Find assigned supervisor, reviewer, and committee members
            const supervisor = allAssignedTeachers.find(t => t.role === 'supervisor');
            const reviewer = allAssignedTeachers.find(t => t.role === 'reviewer');
            const committeeMembers = allAssignedTeachers.filter(t => t.role === 'committee');

            // Find grades for each
            const supervisorGrade = supervisor
                ? allGrades.find(g => g.gradeType === 'supervisor' && g.teacherId === supervisor.teacherId)
                : null;
            const reviewerGrade = reviewer
                ? allGrades.find(g => g.gradeType === 'reviewer' && g.teacherId === reviewer.teacherId)
                : null;

            // Check all committee members have graded
            const allCommitteeGraded = committeeMembers.length > 0 &&
                committeeMembers.every(cm =>
                    allGrades.some(g => g.gradeType === 'committee' && g.teacherId === cm.teacherId)
                );

            // Only generate final grade if all conditions are met
            let finalGrade = null;
            let thesisStatus = thesis.status;

            if (supervisor && supervisorGrade && reviewer && reviewerGrade && allCommitteeGraded) {
            // Collect all grades
                const allFinalGrades = [
                    supervisorGrade.grade,
                    reviewerGrade.grade,
                    ...committeeMembers.map(cm =>
                        allGrades.find(g => g.gradeType === 'committee' && g.teacherId === cm.teacherId).grade
                    )
                ];

                // Final grade: average of all grades
                finalGrade = Math.round(
                    (allFinalGrades.reduce((sum, g) => sum + g, 0) / allFinalGrades.length) * 100
                ) / 100;

                thesisStatus = finalGrade >= 50 ? 'complete' : 'failed';

                await models.Thesis.update(
                    { finalGrade, status: thesisStatus },
                    { where: { id: thesis.id }, transaction }
                );
            } else {
                await models.Thesis.update(
                    { finalGrade: null },
                    { where: { id: thesis.id }, transaction }
                );
            }

            // Get student for notification
            const student = await models.Student.findOne({
                where: { id: thesis.studentId }
            });

            // Create notification for student
            await createNotification({
                recipientId: student.userId,
                type: 'alert',
                title: 'Thesis Graded',
                message: `Your thesis "${thesis.title}" has been graded by ${teacherRole}: ${value}/100`
            });

            await transaction.commit();
            return res.status(200).json({ 
                message: "Thesis graded successfully",
                grade: value,
            });

        } catch (error) {
            console.error('Error grading thesis:', error);
            await transaction.rollback();
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getThesisGrade(req, res) {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;

        try {
            const t = await models.Teacher.findOne({
                where: { userId: userId }
            });
            if (!t) return res.status(404).json({ message: "Teacher not found" });

            // Find thesis and verify teacher access through ThesisTeacher
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId
                },
                include: [
                    {
                        model: models.ThesisTeacher,
                        as: 'thesisTeachers',
                        where: {
                            teacherId: t.id
                        },
                        required: true
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            // Get teacher's role
            const teacherRole = thesis.thesisTeachers.find(tt => tt.teacherId === t.id)?.role || 'supervisor';

            // Get semester information
            const semester = await models.Semester.findByPk(thesis.semesterId, {
                attributes: ['id', 'name']
            });

            if (!semester) {
                return res.status(404).json({ message: "Semester not found" });
            }

            // Get semester end date from MongoDB configuration
            const endDateConfig = await Configuration.findOne({
                key: `end_date_${semester.id}`,
                semesterId: semester.id,
                scope: 'semester'
            });

            let canGrade = true;
            let semesterEndDate = null;

            if (endDateConfig && endDateConfig.value) {
                semesterEndDate = new Date(endDateConfig.value);
                const currentDate = new Date();
                canGrade = currentDate <= semesterEndDate;
            }
            
            // Get existing grade
            const grade = await models.ThesisGrade.findOne({
                where: {
                    thesisId: thesis.id,
                    teacherId: t.id,
                    gradeType: teacherRole
                }
            });

            // Transform the grade object to match frontend expectations
            let transformedGrade = null;
            if (grade) {
                transformedGrade = {
                    id: grade.id,
                    value: grade.grade,
                    feedback: grade.feedback,
                    updatedAt: grade.updatedAt,
                    createdAt: grade.createdAt
                };
            }

            return res.status(200).json({ 
                message: "Grade fetched successfully",
                grade: transformedGrade,
                semester: {
                    id: semester.id,
                    name: semester.name,
                    endDate: semesterEndDate
                },
                canGrade: canGrade,
                teacherRole: teacherRole
            });

        } catch (error) {
            console.error('Error fetching thesis grade:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new TeacherController();