const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');

class ThesisGrade extends Model {}
ThesisGrade.init({
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
        },
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Teacher,
            key: 'id'
        },
    },
    gradeType: {
        type: DataTypes.ENUM('supervisor', 'reviewer', 'committee'),
        allowNull: false
    },
    grade: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'ThesisGrade',
    tableName: 'thesis_grades',
    timestamps: true
});

module.exports = ThesisGrade;