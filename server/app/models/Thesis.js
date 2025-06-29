const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Semester = require('./Semester');
const Student = require('./Student');
const Teacher = require('./Teacher');

class Thesis extends Model {}
Thesis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        references: {
            model: Student,
            key: 'id'
        },
        allowNull: false,
        unique: false
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
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
    finalGrade: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    defenseDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'submitted', 'pending defense', 'rejected', 'defended', 'complete', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'submitted', 'pending defense', 'rejected', 'defended', 'complete', 'failed']]
        }
    },
}, {
    sequelize,
    modelName: 'Thesis',
    tableName: 'theses',
    timestamps: true,
    indexes: [{
        unique: true,
        fields: ['semesterId', 'studentId']
    }],
});

module.exports = Thesis;