const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const Semester = require('./Semester');

class TeacherSemester extends Model {}
TeacherSemester.init({
    teacherId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Teacher,
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
    maxPreThesisSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    remainingPreThesisSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    maxThesisSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    remainingThesisSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
}, {
    sequelize,
    modelName: 'TeacherSemester',
    tableName: 'teacher_semesters',
    timestamps: true,
});

module.exports = TeacherSemester;