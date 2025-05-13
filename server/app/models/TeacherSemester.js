const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
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
    
}, {
    sequelize,
    modelName: 'TeacherSemester',
    tableName: 'teacher_semesters',
    timestamps: true,
});

module.exports = TeacherSemester;