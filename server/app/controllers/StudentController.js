const { models, sequelize } = require('../models');
const share = require('../utils/share');
const { Op } = require('sequelize');

const { createNotification } = require('../services/notificationService');
const Configuration = require('../models/monongoDB/Configuration');
class StudentController {
    async getProfile(req, res) {
        const studentId = req.user.id;
        try {
            const student = await share.getStudentById(studentId);
            if (!student) return res.status(404).json({ message: "Student not found" });

            const activeSemester = await models.Semester.findOne({
                where: { isActive: true }
            });

            const currentSemester = await models.Semester.findOne({
                where: { isCurrent: true }
            });

            let enrolled = [];

            if ( activeSemester.id === currentSemester.id ) {
                enrolled = [activeSemester];
            } else {
                enrolled = [activeSemester, currentSemester]
            }

            const semesters = await models.StudentSemester.findAll({
                where: {
                    studentId: student.id,
                    semesterId: enrolled.map(s => s.id)
                },
                include: [
                    {
                        model: models.Semester,
                        as: 'semester',
                        attributes: ['name', 'isCurrent', 'isActive'],
                    }
                ],
                attributes: ['studentId', 'semesterId', 'type', 'isRegistered'],
            });
            return res.status(200).json({
                message: "Student profile fetched successfully",
                student, semesters
            });
        } catch (error) {
            console.error('Error fetching student:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getTopics(req, res) {
        const userId = req.user.id;
        try {
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const topics = await models.Topic.findAll({
                where: {
                    semesterId: semester.id,
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                    }
                ]
            });

            if (!topics) return res.status(404).json({ message: "Topics not found", student, semester });

            return res.status(200).json({ message: "Topics fetched successfully", topics, semester });
        } catch (error) {
            console.error('Error fetching topics:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async applyTopic(req, res) {
        const userId = req.user.id;
        const topicId = req.params.topicId;
        try {
            if (!req.body.title) return res.status(400).json({ message: "Title is required" });
            if (!req.body.description) return res.status(400).json({ message: "Description is required" });
            const s = await share.getStudentById(userId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            if (s.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            const student = await models.StudentSemester.findOne({
                where: {
                    studentId: s.id,
                    semesterId: semester.id
                }   
            });
            if (!student) return res.status(404).json({ message: "Student not registered for this semester" });
            if(student.isRegistered) return res.status(404).json({ message: "Already registered for a topic" });
            
            const topic = await models.Topic.findOne({
                where: { id: topicId }
            });
            if (!topic) return res.status(404).json({ message: "Topic not found" });
            if (topic.status !== 'open') return res.status(404).json({ message: "Topic not open" });
            if (topic.remainingSlots <= 0) return res.status(404).json({ message: "No slots available" });
            
            if (topic.minGpa > s.gpa) return res.status(404).json({ message: "GPA not sufficient" });
            if (topic.minCredits > s.credits) return res.status(404).json({ message: "Credits not sufficient" });
            

            const pendingApplication = await models.PreThesisRegistration.findOne({
                where: {
                    studentId: s.id,
                    topicId: topic.id,
                    status: 'pending'
                }
            });
            if (pendingApplication) return res.status(404).json({ message: "Already applied for a topic" });

            const existingApplication = await models.PreThesisRegistration.findOne({
                where: {
                    studentId: s.id,
                    topicId: topic.id,
                    status: 'approved'
                }
            });
            if (existingApplication) return res.status(404).json({ message: "Already registered for this topic" });

            const reapplyingApplication = await models.PreThesisRegistration.findOne({
                where: {
                    studentId: s.id,
                    topicId: topic.id,
                    status: 'rejected'
                }
            });

            if (reapplyingApplication) {
                await reapplyingApplication.update({
                    title: req.body.title,
                    description: req.body.description,
                    status: 'pending'
                });
            } else {
                const preThesisRegistration = await models.PreThesisRegistration.create({
                    studentId: s.id,
                    topicId: topic.id,
                    title: req.body.title || null,
                    description: req.body.description || null,
                    status: 'pending'
                });
            }

            const teacher = await models.Teacher.findOne({
                where: { id: topic.supervisorId }
            });

            const notiTeacher = await createNotification({
                recipientId: teacher.userId,
                type: 'alert',
                title: 'Topic Application',
                message: `You have recieved a new application for the topic ${topic.topic}`,
            });
            return res.status(200).json({ message: "Applied for the topic successfully" });
        } catch (error) {
            console.error('Error applying for topic:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getAppliedTopic(req, res) {
        const userId = req.user.id;
        try {
            const s = await share.getStudentById(userId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            if (s.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const approvedTopic = await models.PreThesisRegistration.findOne({
                where: {
                    studentId: s.id,
                    status: 'approved'
                },
            });
            let topic = null;
            if (approvedTopic) {
                topic = await models.Topic.findOne({
                    where: {
                        id: approvedTopic.topicId,
                        semesterId: semester.id
                    },
                    include: [
                        {
                            model: models.Teacher,
                            as: 'supervisor',
                            attributes: ['id', 'fullName', 'email', 'phone'],
                        }
                    ]
                });
                return res.status(200).json({ message: "Applied topic fetched successfully", approvedTopic: { approvedTopic, topic } });
            }
            
            const appliedTopics = await models.PreThesisRegistration.findAll({
                where: {
                    studentId: s.id,
                    status: 'pending'
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'topic',
                        include: [
                            {
                                model: models.Teacher,
                                as: 'supervisor',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                            }
                        ],
                        where: {
                            status: 'open',
                            semesterId: semester.id
                        }
                    }
                ]
            });
            if (!appliedTopics) return res.status(404).json({ message: "No applied topic found" });

            return res.status(200).json({ message: "Applied topic fetched successfully", appliedTopics });
        } catch (error) {
            console.error('Error fetching applied topic:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getPreThesis(req, res) {
        const userId = req.user.id;
        const semesterId = req.params.semesterId;
        try {
            const s = await share.getStudentById(userId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            if (s.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const preThesis = await models.PreThesis.findOne({
                where: {
                    studentId: s.id,
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        where: {
                            semesterId: semesterId,
                        },
                        include: [
                            {
                                model: models.Teacher,
                                as: 'supervisor',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                            }
                        ],
                    },
                    {
                        model: models.PreThesisSubmission,
                        as: 'submissions',
                        required: false,
                        order: [['submittedAt', 'DESC']],
                    },
                    {
                        model: models.PreThesisGrade,
                        as: 'grades',
                        required: false,
                        include: [
                            {
                                model: models.Teacher,
                                as: 'teacher',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                            }
                        ],
                        order: [['createdAt', 'DESC']],
                    }
                ]
            });
            if (!preThesis) return res.status(404).json({ message: "No pre-thesis found" });

                        const latestGrade = await models.PreThesisGrade.findOne({
                where: {
                    preThesisId: preThesis.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'teacher',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            // Get submission deadline
            const submissionDeadlineConfig = await Configuration.findOne({
                key: `pre_thesis_submission_deadline_${semesterId}`,
                semesterId: parseInt(semesterId),
                scope: 'semester'
            });

            const submissionDeadline = submissionDeadlineConfig ? submissionDeadlineConfig.value : null;
            const isSubmissionAllowed = submissionDeadline ? new Date() <= new Date(submissionDeadline) : true;

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
                // Include submission counts for display
                reportSubmissionCount: reportSubmissions.length,
                projectSubmissionCount: projectSubmissions.length,
                // Include grade information from PreThesisGrade table
                grade: latestGrade ? latestGrade.grade : null,
                feedback: latestGrade ? latestGrade.feedback : null,
                gradedAt: latestGrade ? latestGrade.createdAt : null,
                // Include deadline information
                submissionDeadline: submissionDeadline,
                isSubmissionAllowed: isSubmissionAllowed
            }

            return res.status(200).json({ message: "Pre-thesis fetched successfully", preThesis: preThesisWithSubmissions });
        } catch (error) {
            console.error('Error fetching pre-thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async cancelTopic(req, res) {
        const userId = req.user.id;
        const topicId = req.params.topicId;
        try {
            const s = await share.getStudentById(userId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            if (s.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const topic = await models.Topic.findOne({
                where: { id: topicId }
            });
            if (!topic) return res.status(404).json({ message: "Topic not found" });
            if (topic.status !== 'open') return res.status(404).json({ message: "Topic not open" });
            if (topic.remainingSlots <= 0) return res.status(404).json({ message: "No slots available" });

            const existingApplication = await models.PreThesisRegistration.findOne({
                where: {
                    studentId: s.id,
                    topicId: topicId,
                    status: 'pending'
                }
            });
            if (!existingApplication) return res.status(404).json({ message: "No registration found" });

            await existingApplication.destroy();

            return res.status(200).json({ message: "Cancelled the topic successfully" });
        } catch (error) {
            console.error('Error cancelling topic:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    getThesisContacts = async (req, res) => {
        const userId = req.user.id;
        try {
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const teacher = await models.TeacherSemester.findAll({
                where: {
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'teacher',
                        attributes: ['userId', 'fullName', 'email', 'phone'],
                    }
                ],
                attributes: ['teacherId', 'semesterId', 'remainingThesisSlots'],
            })

            return res.status(200).json({ message: "Active semester fetched successfully", teacher });
        } catch (error) {
            console.error('Error fetching active semester:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getThesis(req, res) {
        const userId = req.user.id;
        const semesterId = req.params.semesterId;
        try {
            const s = await share.getStudentById(userId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            if (s.status !== 'active') return res.status(404).json({ message: "Student not active" });

            const thesis = await models.Thesis.findOne({
                where: {
                    studentId: s.id,
                    semesterId: semesterId,
                },
                attributes: ['id', 'studentId', 'supervisorId', 'semesterId', 'title', 'description', 'videoUrl', 'finalGrade', 'status'],
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'phone'],
                    },
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['userId', 'fullName', 'email', 'phone'],
                    },
                    {
                        model: models.ThesisSubmission,
                        as: 'submissions',
                        required: false,
                        order: [['submittedAt', 'DESC']],
                    },
                    {
                        model: models.ThesisGrade,
                        as: 'grades',
                        required: false,
                        include: [
                            {
                                model: models.Teacher,
                                as: 'teacher',
                                attributes: ['id', 'fullName', 'email', 'phone'],
                            }
                        ],
                        order: [['createdAt', 'DESC']],
                    }
                ]
            });
            if (!thesis) return res.status(404).json({ message: "No thesis found" });

            const latestGrade = await models.ThesisGrade.findOne({
                where: {
                    thesisId: thesis.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'teacher',
                        attributes: ['id', 'fullName', 'email', 'phone'],
                    }
                ],
                order: [['createdAt', 'DESC']],
            });

            // Get submission deadline
            const submissionDeadlineConfig = await Configuration.findOne({
                key: `thesis_submission_deadline_${semesterId}`,
                semesterId: parseInt(semesterId),
                scope: 'semester'
            });

            const submissionDeadline = submissionDeadlineConfig ? submissionDeadlineConfig.value : null;
            const isSubmissionAllowed = submissionDeadline ? new Date() <= new Date(submissionDeadline) : true;

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

            const thesisWithSubmissions = {
                ...thesis.toJSON(),
                report: latestReportSubmission ? latestReportSubmission.fileUrl : null,
                project: latestProjectSubmission ? latestProjectSubmission.fileUrl : null,
                presentation: latestPresentationSubmission ? latestPresentationSubmission.fileUrl : null,
                demo: thesis.videoUrl, // Map videoUrl to demo for frontend compatibility
                reportSubmittedAt: latestReportSubmission ? latestReportSubmission.submittedAt : null,
                projectSubmittedAt: latestProjectSubmission ? latestProjectSubmission.submittedAt : null,
                presentationSubmittedAt: latestPresentationSubmission ? latestPresentationSubmission.submittedAt : null,
                // Include submission counts for display
                reportSubmissionCount: reportSubmissions.length,
                projectSubmissionCount: projectSubmissions.length,
                presentationSubmissionCount: presentationSubmissions.length,
                // Include grade information from ThesisGrade table
                finalGrade: latestGrade ? latestGrade.grade : null,
                feedback: latestGrade ? latestGrade.feedback : null,
                gradedAt: latestGrade ? latestGrade.createdAt : null,
                // Include deadline information
                submissionDeadline: submissionDeadline,
                isSubmissionAllowed: isSubmissionAllowed
            }

            return res.status(200).json({ message: "Thesis fetched successfully", thesis: thesisWithSubmissions });
        } catch (error) {
            console.error('Error fetching thesis:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new StudentController();