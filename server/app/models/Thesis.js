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
        allowNull: true
    },
    documentDeadline: {
        type: DataTypes.DATE,
        allowNull: true
    },
    defenseDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'DRAFT', 'SUBMITTED', 'PENDING DEFENSE', 'REJECTED', 'DEFENDED', 'COMPLETE', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING'
    }
}, {
    sequelize,
    modelName: 'Thesis',
    timestamps: true,
    indexes: [{
        unique: true,
        fields: ['semesterId', 'studentId']
    }]
});

module.exports = Thesis;