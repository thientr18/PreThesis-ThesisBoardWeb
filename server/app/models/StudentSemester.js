const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
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
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'semesterId']
        }
    ]
});

module.exports = StudentSemester;