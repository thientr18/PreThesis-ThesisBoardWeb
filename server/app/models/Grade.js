const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');

class Grade extends Model {}
Grade.init({
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
    grade: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    sequelize,
    modelName: 'Grades',
    timestamps: true
});

module.exports = Grade;