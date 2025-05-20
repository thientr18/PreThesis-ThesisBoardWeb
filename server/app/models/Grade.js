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
        references: {
            model: PreThesis,
            key: 'id'
        },
        allowNull: true
    },
    thesisId: {
        type: DataTypes.INTEGER,
<<<<<<< Updated upstream
        allowNull: false,
=======
>>>>>>> Stashed changes
        references: {
            model: Thesis,
            key: 'id'
        },
        allowNull: true
    },
    teacherId: {
        type: DataTypes.INTEGER,
<<<<<<< Updated upstream
        allowNull: false,
=======
>>>>>>> Stashed changes
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
}, {
    sequelize,
    modelName: 'Grade',
    tableName: 'grades',
<<<<<<< Updated upstream
    timestamps: true
=======
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['thesisId', 'teacherId']
        },
        {
            unique: true,
            fields: ['preThesisId', 'teacherId']
        }
    ]
>>>>>>> Stashed changes
});

module.exports = Grade;