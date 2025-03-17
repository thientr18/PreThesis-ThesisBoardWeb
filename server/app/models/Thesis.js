const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Semester = require('./Semester');
const Student = require('./Student');

class Thesis extends Model {}
Thesis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    topic: {
        type: DataTypes.STRING,
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
    }
}, {
    sequelize,
    modelName: 'Thesis',
    tableName: 'theses',
    timestamps: true,
    indexes: [{
        unique: true,
        fields: ['semesterId', 'studentId']
    }],
    hooks: {
        
    }
});

module.exports = Thesis;