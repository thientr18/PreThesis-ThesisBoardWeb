const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Semester = require('./Semester');
const Student = require('./Student');
const Teacher = require('./Teacher');

class Thesis extends Model {}
Thesis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        references: {
            model: Student,
            key: 'id'
        },
        allowNull: false,
        unique: false
    },
    supervisorId: {
        type: DataTypes.INTEGER,
        references: {
            model: Teacher,
            key: 'id'
        },
        allowNull: false,
        unique: false
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    report: {
        type: DataTypes.STRING,
        allowNull: true
    },
    presentation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    demo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    finalGrade: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    documentDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true,
            isBeforeDensfeDate(value) {
                if (value && this.defenseDate && value >= this.defenseDate) {
                    throw new Error('Document deadline must be before defense date');
                }
            }
        }
    },
    defenseDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'draft', 'submitted', 'pending defense', 'rejected', 'defended', 'complete', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'draft', 'submitted', 'pending defense', 'rejected', 'defended', 'complete', 'failed']]
        }
    },
}, {
    sequelize,
    modelName: 'Thesis',
    tableName: 'theses',
    timestamps: true,
    indexes: [{
        unique: true,
        fields: ['semesterId', 'studentId']
    }],
});

module.exports = Thesis;