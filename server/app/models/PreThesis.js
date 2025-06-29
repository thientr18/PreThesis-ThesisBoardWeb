const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Topic = require('./Topic');
const Student = require('./Student');

class PreThesis extends Model {}
PreThesis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'id'
        }
    },
    topicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Topic,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gradedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    videoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'Must be a valid URL'
            },
            isYouTubeUrl(value) {
                if (value && value.trim()) {
                    const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/i;
                    if (!youtubePattern.test(value)) {
                        throw new Error('Must be a valid YouTube URL');
                    }
                }
            }
        }
    },
    grade: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    gradeAt: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'submitted', 'approved', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'submitted', 'approved', 'failed']]
        }
    }
}, {
    sequelize,
    modelName: 'PreThesis',
    tableName: 'pre_theses',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'topicId']
        }
    ],
    hooks: {
        beforeCreate: (preThesis, options) => {
            if (preThesis.grade < 0 || preThesis.grade > 100) {
                throw new Error('Grade must be between 0 and 100');
            } else if (preThesis.status === 'approved' && preThesis.grade < 50) {
                throw new Error('Approved pre-thesis must have a grade of at least 50');
            }
            if (preThesis.videoUrl) {
                const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/i;
                if (!youtubePattern.test(preThesis.videoUrl)) {
                    throw new Error('Must be a valid YouTube URL');
                }
            }
        },
        beforeUpdate: (preThesis, options) => {
            if (preThesis.grade < 0 || preThesis.grade > 100) {
                throw new Error('Grade must be between 0 and 100');
            } else if (preThesis.status === 'approved' && preThesis.grade < 50) {
                throw new Error('Approved pre-thesis must have a grade of at least 50');
            }
            if (preThesis.videoUrl) {
                const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/i;
                if (!youtubePattern.test(preThesis.videoUrl)) {
                    throw new Error('Must be a valid YouTube URL');
                }
            }
            if (preThesis.status === 'approved' && preThesis.grade < 50) {
                throw new Error('Approved pre-thesis must have a grade of at least 50');
            }
            if (preThesis.status === 'failed' && preThesis.grade >= 50) {
                throw new Error('Failed pre-thesis must have a grade less than 50');
            }
            if (preThesis.grade > 50) {
                preThesis.status = 'approved';
            }
            if (preThesis.grade < 50) {
                preThesis.status = 'failed';
            }
        }
    }
});

module.exports = PreThesis;
