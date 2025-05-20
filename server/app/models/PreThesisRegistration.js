const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Student = require('./Student');
const Topic = require('./Topic');
const Semester = require('./Semester');

class PreThesisRegistration extends Model {}

PreThesisRegistration.init({
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
        unique: false,
        allowNull: false
    },
    topicId: {
        type: DataTypes.INTEGER,
        references: {
            model: Topic,
            key: 'id'
        },
        unique: false,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending'
    },
}, {
    sequelize,
    modelName: 'PreThesisRegistration',
    tableName: 'pre_thesis_registrations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['studentId', 'topicId', 'status'],
        }
    ]
});

module.exports = PreThesisRegistration;