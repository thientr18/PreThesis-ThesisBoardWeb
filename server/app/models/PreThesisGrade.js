const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const PreThesis = require('./PreThesis');

class PreThesisGrade extends Model {}
PreThesisGrade.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    preThesisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PreThesis,
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
    modelName: 'PreThesisGrade',
    tableName: 'pre_thesis_grades',
    timestamps: true
});

module.exports = PreThesisGrade;