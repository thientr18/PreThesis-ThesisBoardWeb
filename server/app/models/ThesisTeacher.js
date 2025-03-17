const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');

class ThesisTeacher extends Model {}
ThesisTeacher.init({
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
        allowNull: false,
        validate: {
            isIn: [['supervisor', 'reviewer', 'committee']]
        }
    }
}, {
    sequelize,
    modelName: 'ThesisTeacher',
    tableName: 'thesis_teachers',
    timestamps: true
});

module.exports = ThesisTeacher;