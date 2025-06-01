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
    ]
});

module.exports = PreThesis;
