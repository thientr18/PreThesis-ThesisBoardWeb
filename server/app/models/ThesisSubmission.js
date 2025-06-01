const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Thesis = require('./Thesis');

class ThesisSubmission extends Model {}
ThesisSubmission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thesisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Thesis,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    type: {
        type: DataTypes.ENUM('report', 'project', 'presentation'),
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    submittedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'ThesisSubmission',
    tableName: 'thesis_submissions',
    timestamps: true,
});

module.exports = ThesisSubmission;