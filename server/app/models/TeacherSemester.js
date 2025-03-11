const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Teacher = require('./Teacher');
const Semester = require('./Semester');

class TeacherSemester extends Model {}
TeacherSemester.init({
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Teacher,
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
    modelName: 'TeacherSemesters',
    tableName: 'TeacherSemesters',
    timestamps: false
});

module.exports = TeacherSemester;