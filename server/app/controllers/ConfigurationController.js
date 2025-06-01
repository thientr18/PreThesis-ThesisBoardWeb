const Configuration = require('../models/monongoDB/Configuration');
const { models } = require('../models');
const sequelize = require('../configs/userDB');

class ConfigurationController {
    async getConfigurationsBySemester(req, res) {
        const { semesterId } = req.params;
        if (!semesterId) {
            return res.status(400).json({ error: 'Semester ID is required' });
        }

        try {
            const configurations = await Configuration.find({ 
                semesterId: parseInt(semesterId),
                scope: 'semester'
            });

            res.status(200).json(configurations);
        } catch (error) {
            console.error('Error fetching configurations:', error);
            res.status(500).json({ error: 'Failed to fetch configurations' });
        }
    }

    async addSemester(req, res) {
        const { name, startDate, endDate, preThesisRegistrationDeadline, preThesisSubmissionDeadline, thesisRegistrationDeadline, thesisSubmissionDeadline } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ error: 'Name, start date, and end date are required' });
        }

        try {
            const semester = await models.Semester.create({
                name,
                isCurrent: false,
                isActive: false,
                allowView: false,
            });
            
            if (!semester) {
                return res.status(500).json({ error: 'Failed to create semester' });
            }

            const semesterId = semester.id;

            // Make keys unique by including semesterId
            const configurations = [
                { key: `semester_name_${semesterId}`, name: 'Semester Name', value: name, scope: 'semester', semesterId },
                { key: `start_date_${semesterId}`, name: 'Start Date', value: startDate, scope: 'semester', semesterId },
                { key: `end_date_${semesterId}`, name: 'End Date', value: endDate, scope: 'semester', semesterId },
                { key: `pre_thesis_registration_deadline_${semesterId}`, name: 'Pre-Thesis Registration Deadline', value: preThesisRegistrationDeadline || '', scope: 'semester', semesterId },
                { key: `pre_thesis_submission_deadline_${semesterId}`, name: 'Pre-Thesis Submission Deadline', value: preThesisSubmissionDeadline || '', scope: 'semester', semesterId },
                { key: `thesis_registration_deadline_${semesterId}`, name: 'Thesis Registration Deadline', value: thesisRegistrationDeadline || '', scope: 'semester', semesterId },
                { key: `thesis_submission_deadline_${semesterId}`, name: 'Thesis Submission Deadline', value: thesisSubmissionDeadline || '', scope: 'semester', semesterId }
            ];

            const savedConfigurations = await Configuration.insertMany(configurations);

            if (!savedConfigurations || savedConfigurations.length === 0) {
                return res.status(500).json({ error: 'Failed to create semester configurations' });
            }

            const semesterData = {
                id: semesterId,
                name,
                startDate,
                endDate,
                isCurrent: false,
                isActive: false,
                allowView: false,
                createdAt: semester.createdAt,
                updatedAt: semester.updatedAt
            };

            res.status(201).json(semesterData);
        } catch (error) {
            console.error('Error adding semester configurations:', error);
            res.status(500).json({ error: 'Failed to add semester configurations' });
        }
    }

    // Enhanced method to get common configurations
    async getCommonConfigurations(req, res) {
        try {

            const semesters = await models.Semester.findAll({
                order: [['createdAt', 'DESC']]
            });

            const activeSemester = await models.Semester.findOne({ 
                where: { isActive: true },
                attributes: ['id', 'name']
            });
            
            const currentSemester = await models.Semester.findOne({ 
                where: { isCurrent: true },
                attributes: ['id', 'name']
            });
            
            const waitingSemesters = await models.Semester.findAll({ 
                where: { allowView: true },
                attributes: ['id', 'name'],
                order: [['createdAt', 'DESC']]
            });

            const response = {
                semesters,
                configurations: {
                    activeSemester: activeSemester ? activeSemester.id : null,
                    currentSemester: currentSemester ? currentSemester.id : null,
                    waitingSemesters: waitingSemesters.map(s => s.id)
                },
                semesterDetails: {
                    activeSemester: activeSemester,
                    currentSemester: currentSemester,
                    waitingSemesters: waitingSemesters
                }
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Error fetching common configurations:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to fetch common configurations',
                details: error.message
            });
        }
    }

    async updateCommonConfigurations(req, res) {
        const { activeSemester, currentSemester, waitingSemesters } = req.body;

        // Add validation to ensure we're in the right method
        if (req.body.hasOwnProperty('length') || Array.isArray(req.body)) {
            return res.status(400).json({ 
                error: 'Invalid request format. Expected object with activeSemester, currentSemester, and waitingSemesters properties.' 
            });
        }

        try {
            // Use the imported sequelize directly
            const transaction = await sequelize.transaction();

            try {
                // Update Active Semester
                if (activeSemester !== undefined) {
                    // Reset all semesters to inactive
                    await models.Semester.update(
                        { isActive: false }, 
                        { where: {}, transaction }
                    );
                    
                    // Set the selected semester as active
                    if (activeSemester && activeSemester !== '' && activeSemester !== 'null') {
                        await models.Semester.update(
                            { isActive: true },
                            { where: { id: parseInt(activeSemester) }, transaction }
                        );
                    }
                }

                // Update Current Semester
                if (currentSemester !== undefined) {
                    // Reset all semesters to not current
                    await models.Semester.update(
                        { isCurrent: false }, 
                        { where: {}, transaction }
                    );
                    
                    // Set the selected semester as current
                    if (currentSemester && currentSemester !== '' && currentSemester !== 'null') {
                        await models.Semester.update(
                            { isCurrent: true },
                            { where: { id: parseInt(currentSemester) }, transaction }
                        );
                    }
                }

                // Update Waiting Semesters (allowView)
                if (waitingSemesters !== undefined) {
                    
                    // First, set all allowView to false
                    await models.Semester.update(
                        { allowView: false },
                        { where: {}, transaction }
                    );
                    
                    // Then set selected semesters to allowView: true
                    if (waitingSemesters && Array.isArray(waitingSemesters) && waitingSemesters.length > 0) {
                        // Filter out invalid values and convert to integers
                        const validSemesterIds = waitingSemesters
                            .filter(id => id !== null && id !== undefined && id !== '' && !isNaN(id))
                            .map(id => parseInt(id));
                        
                        if (validSemesterIds.length > 0) {
                            await models.Semester.update(
                                { allowView: true },
                                { where: { id: validSemesterIds }, transaction }
                            );
                        }
                    }
                }

                // Commit transaction
                await transaction.commit();

                res.status(200).json({ 
                    message: 'Common configurations updated successfully',
                    data: {
                        activeSemester,
                        currentSemester,
                        waitingSemesters
                    }
                });

            } catch (error) {
                await transaction.rollback();
                console.error('Transaction error:', error);
                throw error;
            }

        } catch (error) {
            console.error('Error updating common configurations:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to update common configurations',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async updateSemesterConfigurations(req, res) {
        const { semesterId } = req.params;
        const configurations = req.body;

        if (!semesterId) {
            return res.status(400).json({ error: 'Semester ID is required' });
        }

        if (!configurations || !Array.isArray(configurations)) {
            console.error('Invalid configurations format:', configurations);
            return res.status(400).json({ error: 'Configurations array is required' });
        }

        try {
            const bulkOps = configurations.map(config => ({
                updateOne: {
                    filter: { 
                        key: config.key,
                        semesterId: parseInt(semesterId),
                        scope: 'semester'
                    },
                    update: { 
                        $set: { 
                            name: config.name,
                            value: config.value, // Store as-is
                            scope: 'semester',
                            semesterId: parseInt(semesterId),
                            key: config.key
                        } 
                    },
                    upsert: true
                }
            }));

            const result = await Configuration.bulkWrite(bulkOps);

            // Return updated configurations
            const updatedConfigurations = await Configuration.find({ 
                semesterId: parseInt(semesterId),
                scope: 'semester'
            });

            res.status(200).json({
                message: 'Semester configurations updated successfully',
                configurations: updatedConfigurations
            });

        } catch (error) {
            console.error('Error updating semester configurations:', error);
            res.status(500).json({ 
                error: 'Failed to update semester configurations',
                details: error.message
            });
        }
    }
}

module.exports = new ConfigurationController();