const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');

class ThesisTeacher extends Model {}
ThesisTeacher.init({
    thesisId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Thesis,
            key: 'id'
        }
    },
    teacherId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    role: {
        type: DataTypes.ENUM('supervisor', 'reviewer', 'committee'),
        primaryKey: true,
        allowNull: false,
        validate: {
            isIn: [['supervisor', 'reviewer', 'committee']]
        }
    }
}, {
    sequelize,
    modelName: 'ThesisTeacher',
    tableName: 'thesis_teachers',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['thesisId', 'teacherId', 'role']
        }
    ]
});

module.exports = ThesisTeacher;