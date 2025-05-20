const { models, sequelize } = require('../models');
const share = require('../utils/share');
const { Op } = require('sequelize');

class StudentController {
    async getProfile(req, res) {
        const studentId = req.user.id;
        try {
            const s = await share.getStudentById(studentId);
            if (!s) return res.status(404).json({ message: "Student not found" });
            
            const semester = await models.Semester.findOne({
                where: { isActive: true }
            });
            if (!semester) return res.status(404).json({ message: "Active semester not found" });

            const studentSemester = await models.StudentSemester.findOne({
                where: {
                    studentId: s.id,
                    semesterId: semester.id
                },
                include: [
                    {
                        model: models.Student,
                        as: 'student',
                        attributes: ['userId', 'fullName', 'email', 'phone', 'birthDate', 'address', 'credits', 'gpa', 'status'],
                    }
                ],
                attributes: ['studentId', 'semesterId', 'type', 'isRegistered'],
            });
            return res.status(200).json({
                message: "Student profile fetched successfully",
                student: studentSemester
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
            const topic = await models.Topic.findOne({
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
            if (approvedTopic) return res.status(200).json({ message: "Applied topic fetched successfully", approvedTopic: { approvedTopic, topic } });
            
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

    getThesisContact = async (req, res) => {
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
}

module.exports = new StudentController(); 