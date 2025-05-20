const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const Thesis = require('./Thesis');
const PreThesis = require('./PreThesis');

class Grade extends Model {}
Grade.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    preThesisId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: PreThesis,
            key: 'id'
        },
    },
    thesisId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
        allowNull: false
    },
    phase: {
        type: DataTypes.ENUM('pre-thesis', 'thesis'),
        allowNull: false
    },
    role: {
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
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('waiting', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'waiting',
        validate: {
            isIn: {
                args: [['waiting', 'approved', 'rejected']],
                msg: "Status must be one of 'waiting', 'approved', or 'rejected'"
            }
        }
    },
    isFinal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
}, {
    sequelize,
    modelName: 'Grade',
    tableName: 'grades',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['thesisId', 'teacherId'],
            fields: ['preThesisId', 'teacherId']
        }
    ]
});

module.exports = Grade;