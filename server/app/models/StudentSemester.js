const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Student = require('./Student');
const Semester = require('./Semester');

class StudentSemester extends Model {}
StudentSemester.init({
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'id'
        }
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'StudentSemesters',
    tableName: 'StudentSemesters',
    timestamps: false
});

module.exports = StudentSemester;