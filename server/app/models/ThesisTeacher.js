const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');

class ThesisTeacher extends Model {}
ThesisTeacher.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thesisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Thesis,
            key: 'id'
        }
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    role: {
        type: DataTypes.ENUM('supervisor', 'reviewer', 'committee'),
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'ThesisTeachers',
    timestamps: true
});

module.exports = ThesisTeacher;