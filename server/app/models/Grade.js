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
    grade: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
            min: 0,
            max: 100,
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
            fields: ['thesisId', 'teacherId']
        }
    ]
});

module.exports = Grade;