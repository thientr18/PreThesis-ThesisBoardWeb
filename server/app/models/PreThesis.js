const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const StudentSemester = require('./StudentSemester');
const Topic = require('./Topic');

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
        primaryKey: true,
        references: {
            model: StudentSemester,
            key: 'studentId'
        }
    },
    topicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
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
    report: {
        type: DataTypes.STRING,
        allowNull: true
    },
    demo: {
        type: DataTypes.STRING,
        allowNull: true
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
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString()
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