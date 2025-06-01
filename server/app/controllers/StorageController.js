const { models, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const { createNotification } = require('../services/notificationService');
const Configuration = require('../models/monongoDB/Configuration');

class StorageController {
    checkPreThesisDeadline = async (semesterId) => {
        try {
            const submissionDeadlineConfig = await Configuration.findOne({
                key: `pre_thesis_submission_deadline_${semesterId}`,
                semesterId: semesterId,
                scope: 'semester'
            });

            console.log('Submission deadline config:', submissionDeadlineConfig);

            if (!submissionDeadlineConfig || !submissionDeadlineConfig.value) {
                // If no deadline is set, allow submission
                return { allowed: true, deadline: null };
            }

            const deadline = new Date(submissionDeadlineConfig.value);
            const now = new Date();

            return {
                allowed: now <= deadline,
                deadline: deadline,
                deadlineString: deadline.toLocaleString()
            };
        } catch (error) {
            console.error('Error checking submission deadline:', error);
            // In case of error, allow submission to prevent blocking students
            return { allowed: true, deadline: null };
        }
    }
    
    submitPreThesisDemoUrl = async (req, res) => {
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;
        const { videoUrl } = req.body;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Validate video URL
            if (!videoUrl || !videoUrl.trim()) {
                return res.status(400).json({ message: "Video URL is required" });
            }

            // Find pre-thesis and verify ownership
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        include: [
                            {
                                model: models.Teacher,
                                as: 'supervisor',
                                attributes: ['id', 'fullName']
                            }
                        ]
                    }
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found or access denied" });
            }

            // Check submission deadline
            const deadlineCheck = await this.checkPreThesisDeadline(preThesis.preThesisTopic.semesterId);
            if (!deadlineCheck.allowed) {
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Update PreThesis with video URL
            await preThesis.update({ videoUrl: videoUrl.trim() });

            const teacher = await models.Teacher.findOne({
                where: { id: preThesis.preThesisTopic.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Video Submission',
                message: `Student ${student.fullName} has submitted a video for pre-thesis ${preThesis.title}`,
            });

            return res.status(200).json({ 
                message: "Video URL submitted successfully",
                videoUrl: videoUrl.trim()
            });

        } catch (error) {
            console.error('Error submitting video URL:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    submitPreThesisReport = async (req, res) => {
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Check if report file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: "Report file is required" });
            }

            const reportFile = req.file;

            // Find pre-thesis and verify ownership
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        include: [
                            {
                                model: models.Teacher,
                                as: 'supervisor',
                                attributes: ['id', 'fullName']
                            }
                        ]
                    }
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found or access denied" });
            }

            console.log('PreThesis found:', preThesis.preThesisTopic.semesterId);

            const deadlineCheck = await this.checkPreThesisDeadline(preThesis.preThesisTopic.semesterId);
            if (!deadlineCheck.allowed) {
                // Delete the uploaded file since submission is not allowed
                if (fs.existsSync(reportFile.path)) {
                    fs.unlinkSync(reportFile.path);
                }
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Update PreThesis with report file path
            const reportPath = `/uploads/pre-thesis/${reportFile.filename}`;

            await models.PreThesisSubmission.upsert({
                preThesisId: preThesis.id,
                type: 'report',
                fileUrl: reportPath,
                submittedAt: new Date()
            });

            const teacher = await models.Teacher.findOne({
                where: { id: preThesis.preThesisTopic.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Report Submission',
                message: `Student ${student.fullName} has submitted a report for pre-thesis ${preThesis.title}`,
            });

            return res.status(200).json({ 
                message: "Report submitted successfully",
                reportPath: reportPath
            });

        } catch (error) {
            console.error('Error submitting report:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    submitPreThesisProject = async (req, res) => {
        const userId = req.user.id;
        const preThesisId = req.params.preThesisId;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Check if project file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: "Project file is required" });
            }

            const projectFile = req.file;

            // Find pre-thesis and verify ownership
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: preThesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        include: [
                            {
                                model: models.Teacher,
                                as: 'supervisor',
                                attributes: ['id', 'fullName']
                            }
                        ]
                    }
                ]
            });

            if (!preThesis) {
                return res.status(404).json({ message: "Pre-thesis not found or access denied" });
            }

            const deadlineCheck = await this.checkPreThesisDeadline(preThesis.preThesisTopic.semesterId);
            if (!deadlineCheck.allowed) {
                // Delete the uploaded file since submission is not allowed
                if (fs.existsSync(projectFile.path)) {
                    fs.unlinkSync(projectFile.path);
                }
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Update PreThesis with project file path
            const projectPath = `/uploads/pre-thesis/${projectFile.filename}`;
            
            await models.PreThesisSubmission.upsert({
                preThesisId: preThesis.id,
                type: 'project',
                fileUrl: projectPath,
                submittedAt: new Date()
            });

            const teacher = await models.Teacher.findOne({
                where: { id: preThesis.preThesisTopic.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Project Submission',
                message: `Student ${student.fullName} has submitted a project file for pre-thesis ${preThesis.title}`,
            });

            return res.status(200).json({ 
                message: "Project submitted successfully",
                projectPath: projectPath
            });

        } catch (error) {
            console.error('Error submitting project:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async downloadFilePreThesisTeacher(req, res) {
        const { filename } = req.params;
        const userId = req.user.id;
        
        try {
            // Get teacher for basic authentication
            const teacher = await models.Teacher.findOne({
                where: { userId: userId }
            });
            
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });
            if (teacher.status !== 'active') return res.status(400).json({ message: "Teacher not active" });
            
            if (!filename) {
                console.error('Filename parameter is missing');
                return res.status(400).json({ message: 'Filename parameter is required' });
            }

            const filePath = path.join(__dirname, '../../uploads/pre-thesis', filename);
            console.log('Constructed file path:', filePath);
            
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist at path:', filePath);
                return res.status(404).json({ message: 'File not found' });
            }

            // Verify the teacher has access to this file (supervises the pre-thesis)
            const submission = await models.PreThesisSubmission.findOne({
                where: {
                    fileUrl: `/uploads/pre-thesis/${filename}`
                }
            });

            if (!submission) {
                console.error('File submission not found in database');
                return res.status(404).json({ message: 'File not found in database' });
            }

            // Verify the teacher supervises the pre-thesis associated with this submission
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: submission.preThesisId
                },
                include: [
                    {
                        model: models.Topic,
                        as: 'preThesisTopic',
                        where: {
                            supervisorId: teacher.id
                        }
                    }
                ]
            });

            if (!preThesis) {
                console.error('Teacher does not have access to this file');
                return res.status(403).json({ message: 'Access denied to this file' });
            }

            // Extract original filename for download (remove timestamp prefix)
            const originalFileName = filename.replace(/^prethesis-.*?-\d+-/, '').replace(/^prethesis-\d+-\d+-/, '');
            
            // Set headers for download with original filename
            res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            console.log('Serving file:', filePath, 'as:', originalFileName);
            res.download(filePath, originalFileName);
            
        } catch (error) {
            console.error('Error downloading file:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async downloadFilePreThesis(req, res) {
        const { filename } = req.params;
        const userId = req.user.id;
        
        try {
            // Get student for basic authentication
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });
            
            if (!filename) {
                console.error('Filename parameter is missing');
                return res.status(400).json({ message: 'Filename parameter is required' });
            }

            const filePath = path.join(__dirname, '../../uploads/pre-thesis', filename);
            console.log('Constructed file path:', filePath);
            
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist at path:', filePath);
                return res.status(404).json({ message: 'File not found' });
            }

            // Verify the student has access to this file
            const submission = await models.PreThesisSubmission.findOne({
                where: {
                    fileUrl: `/uploads/pre-thesis/${filename}`
                }
            });

            if (!submission) {
                console.error('File submission not found in database');
                return res.status(404).json({ message: 'File not found in database' });
            }

            // Verify the student owns the pre-thesis associated with this submission
            const preThesis = await models.PreThesis.findOne({
                where: {
                    id: submission.preThesisId,
                    studentId: student.id
                }
            });

            if (!preThesis) {
                console.error('Student does not have access to this file');
                return res.status(403).json({ message: 'Access denied to this file' });
            }

            // Extract original filename for download (remove timestamp prefix)
            // Pattern: prethesis-{timestamp}-{originalName}.{extension}
            const originalFileName = filename.replace(/^prethesis-\d+-\d+-/, '');
            
            // Set headers for download with original filename
            res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            console.log('Serving file:', filePath, 'as:', originalFileName);
            res.download(filePath, originalFileName);
            
        } catch (error) {
            console.error('Error downloading file:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    checkThesisDeadline = async (semesterId) => {
        try {
            const submissionDeadlineConfig = await Configuration.findOne({
                key: `thesis_submission_deadline_${semesterId}`,
                semesterId: semesterId,
                scope: 'semester'
            });

            console.log('Thesis submission deadline config:', submissionDeadlineConfig);

            if (!submissionDeadlineConfig || !submissionDeadlineConfig.value) {
                // If no deadline is set, allow submission
                return { allowed: true, deadline: null };
            }

            const deadline = new Date(submissionDeadlineConfig.value);
            const now = new Date();

            return {
                allowed: now <= deadline,
                deadline: deadline,
                deadlineString: deadline.toLocaleString()
            };
        } catch (error) {
            console.error('Error checking thesis submission deadline:', error);
            // In case of error, allow submission to prevent blocking students
            return { allowed: true, deadline: null };
        }
    }

    submitThesisDemoUrl = async (req, res) => {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        const { demoUrl } = req.body;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Validate demo URL
            if (!demoUrl || !demoUrl.trim()) {
                return res.status(400).json({ message: "Demo URL is required" });
            }

            // Find thesis and verify ownership
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['id', 'fullName']
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            // Check submission deadline
            const deadlineCheck = await this.checkThesisDeadline(thesis.semesterId);
            if (!deadlineCheck.allowed) {
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Update Thesis with video URL
            await thesis.update({ videoUrl: demoUrl.trim() });

            const teacher = await models.Teacher.findOne({
                where: { id: thesis.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Demo Submission',
                message: `Student ${student.fullName} has submitted a demo for thesis ${thesis.title}`,
            });

            return res.status(200).json({ 
                message: "Demo URL submitted successfully",
                demoUrl: demoUrl.trim()
            });

        } catch (error) {
            console.error('Error submitting demo URL:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    submitThesisReport = async (req, res) => {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Check if report file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: "Report file is required" });
            }

            const reportFile = req.file;

            // Find thesis and verify ownership
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['id', 'fullName']
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            const deadlineCheck = await this.checkThesisDeadline(thesis.semesterId);
            if (!deadlineCheck.allowed) {
                // Delete the uploaded file since submission is not allowed
                if (fs.existsSync(reportFile.path)) {
                    fs.unlinkSync(reportFile.path);
                }
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Create new submission record instead of upsert
            const reportPath = `/uploads/thesis/${reportFile.filename}`;

            await models.ThesisSubmission.upsert({
                thesisId: thesis.id,
                type: 'report',
                fileUrl: reportPath,
                submittedAt: new Date()
            });

            const teacher = await models.Teacher.findOne({
                where: { id: thesis.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Thesis Report Submission',
                message: `Student ${student.fullName} has submitted a report for thesis ${thesis.title}`,
            });

            return res.status(200).json({ 
                message: "Report submitted successfully",
                reportPath: reportPath
            });

        } catch (error) {
            console.error('Error submitting thesis report:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    submitThesisProject = async (req, res) => {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Check if project file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: "Project file is required" });
            }

            const projectFile = req.file;

            // Find thesis and verify ownership
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['id', 'fullName']
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            const deadlineCheck = await this.checkThesisDeadline(thesis.semesterId);
            if (!deadlineCheck.allowed) {
                // Delete the uploaded file since submission is not allowed
                if (fs.existsSync(projectFile.path)) {
                    fs.unlinkSync(projectFile.path);
                }
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Create new submission record instead of upsert
            const projectPath = `/uploads/thesis/${projectFile.filename}`;

            await models.ThesisSubmission.upsert({
                thesisId: thesis.id,
                type: 'project',
                fileUrl: projectPath,
                submittedAt: new Date()
            });

            const teacher = await models.Teacher.findOne({
                where: { id: thesis.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Thesis Project Submission',
                message: `Student ${student.fullName} has submitted a project file for thesis ${thesis.title}`,
            });

            return res.status(200).json({ 
                message: "Project submitted successfully",
                projectPath: projectPath
            });

        } catch (error) {
            console.error('Error submitting thesis project:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    submitThesisPresentation = async (req, res) => {
        const userId = req.user.id;
        const thesisId = req.params.thesisId;
        
        try {
            // Get student
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });

            // Check if presentation file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: "Presentation file is required" });
            }

            const presentationFile = req.file;

            // Find thesis and verify ownership
            const thesis = await models.Thesis.findOne({
                where: {
                    id: thesisId,
                    studentId: student.id
                },
                include: [
                    {
                        model: models.Teacher,
                        as: 'supervisor',
                        attributes: ['id', 'fullName']
                    }
                ]
            });

            if (!thesis) {
                return res.status(404).json({ message: "Thesis not found or access denied" });
            }

            const deadlineCheck = await this.checkThesisDeadline(thesis.semesterId);
            if (!deadlineCheck.allowed) {
                // Delete the uploaded file since submission is not allowed
                if (fs.existsSync(presentationFile.path)) {
                    fs.unlinkSync(presentationFile.path);
                }
                return res.status(400).json({ 
                    message: `Submission deadline has passed. Deadline was: ${deadlineCheck.deadlineString}`,
                    deadline: deadlineCheck.deadlineString
                });
            }

            // Create new submission record instead of upsert
            const presentationPath = `/uploads/thesis/${presentationFile.filename}`;

            await models.ThesisSubmission.upsert({
                thesisId: thesis.id,
                type: 'presentation',
                fileUrl: presentationPath,
                submittedAt: new Date()
            });

            const teacher = await models.Teacher.findOne({
                where: { id: thesis.supervisor.id }
            });

            // Create notification for supervisor
            await createNotification({
                recipientId: teacher.userId,
                type: 'message',
                title: 'Thesis Presentation Submission',
                message: `Student ${student.fullName} has submitted a presentation for thesis ${thesis.title}`,
            });

            return res.status(200).json({ 
                message: "Presentation submitted successfully",
                presentationPath: presentationPath
            });

        } catch (error) {
            console.error('Error submitting thesis presentation:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async downloadFileThesis(req, res) {
        const { filename } = req.params;
        const userId = req.user.id;
        
        try {
            // Get student for basic authentication
            const student = await models.Student.findOne({
                where: { userId: userId }
            });
            
            if (!student) return res.status(404).json({ message: "Student not found" });
            if (student.status !== 'active') return res.status(400).json({ message: "Student not active" });
            
            if (!filename) {
                console.error('Filename parameter is missing');
                return res.status(400).json({ message: 'Filename parameter is required' });
            }

            const filePath = path.join(__dirname, '../../uploads/thesis', filename);
            console.log('Constructed file path:', filePath);
            
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist at path:', filePath);
                return res.status(404).json({ message: 'File not found' });
            }

            // Verify the student has access to this file
            const submission = await models.ThesisSubmission.findOne({
                where: {
                    fileUrl: `/uploads/thesis/${filename}`
                }
            });

            if (!submission) {
                console.error('File submission not found in database');
                return res.status(404).json({ message: 'File not found in database' });
            }

            // Verify the student owns the thesis associated with this submission
            const thesis = await models.Thesis.findOne({
                where: {
                    id: submission.thesisId,
                    studentId: student.id
                }
            });

            if (!thesis) {
                console.error('Student does not have access to this file');
                return res.status(403).json({ message: 'Access denied to this file' });
            }

            // Extract original filename for download (remove timestamp prefix)
            // Pattern: thesis-{timestamp}-{originalName}.{extension}
            const originalFileName = filename.replace(/^thesis-\d+-\d+-/, '');
            
            // Set headers for download with original filename
            res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            console.log('Serving file:', filePath, 'as:', originalFileName);
            res.download(filePath, originalFileName);
            
        } catch (error) {
            console.error('Error downloading thesis file:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async downloadFileThesisTeacher(req, res) {
        const { filename } = req.params;
        const userId = req.user.id;
        
        try {
            // Get teacher for basic authentication
            const teacher = await models.Teacher.findOne({
                where: { userId: userId }
            });
            
            if (!teacher) return res.status(404).json({ message: "Teacher not found" });
            if (teacher.status !== 'active') return res.status(400).json({ message: "Teacher not active" });
            
            if (!filename) {
                console.error('Filename parameter is missing');
                return res.status(400).json({ message: 'Filename parameter is required' });
            }

            const filePath = path.join(__dirname, '../../uploads/thesis', filename);
            console.log('Constructed file path:', filePath);
            
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist at path:', filePath);
                return res.status(404).json({ message: 'File not found' });
            }

            // Verify the teacher has access to this file (supervises the thesis)
            const submission = await models.ThesisSubmission.findOne({
                where: {
                    fileUrl: `/uploads/thesis/${filename}`
                }
            });

            if (!submission) {
                console.error('File submission not found in database');
                return res.status(404).json({ message: 'File not found in database' });
            }

            // Verify the teacher supervises the thesis associated with this submission
            const thesis = await models.Thesis.findOne({
                where: {
                    id: submission.thesisId,
                    supervisorId: teacher.id
                }
            });

            if (!thesis) {
                console.error('Teacher does not have access to this file');
                return res.status(403).json({ message: 'Access denied to this file' });
            }

            // Extract original filename for download (remove timestamp prefix)
            const originalFileName = filename.replace(/^thesis-.*?-\d+-/, '').replace(/^thesis-\d+-\d+-/, '');
            
            // Set headers for download with original filename
            res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            console.log('Serving file:', filePath, 'as:', originalFileName);
            res.download(filePath, originalFileName);
            
        } catch (error) {
            console.error('Error downloading thesis file:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async deleteFile(req, res) { }
}

module.exports = new StorageController();