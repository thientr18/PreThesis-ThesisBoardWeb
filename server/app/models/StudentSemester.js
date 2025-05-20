const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Student = require('./Student');
const Semester = require('./Semester');

class StudentSemester extends Model {}
StudentSemester.init({
    studentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Student,
            key: 'id'
        }
    },
    semesterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Semester,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('pre-thesis', 'thesis'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['pre-thesis', 'thesis']],
                msg: "Type must be one of 'pre-thesis' or 'thesis'"
            }
        }
    },
    isRegistered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    type: {
        type: DataTypes.ENUM('null', 'pre-thesis', 'thesis', 'failed-pre-thesis', 'failed-thesis'),
        allowNull: false,
        defaultValue: 'null',
        validate: {
            isIn: {
                args: [['null', 'pre-thesis', 'thesis', 'failed-pre-thesis', 'failed-thesis']],
                msg: "Type must be one of 'null', 'pre-thesis', 'thesis', 'failed-pre-thesis', or 'failed-thesis'"
            }
        }
    },
}, {
    sequelize,
    modelName: 'StudentSemester',
    tableName: 'student_semesters',
    timestamps: true,
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'semesterId']
        }
    ]
});

module.exports = StudentSemester;