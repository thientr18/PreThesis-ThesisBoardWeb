const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const PreThesis = require('./PreThesis');

class PreThesisSubmission extends Model {}
PreThesisSubmission.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    preThesisId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PreThesis,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    type: {
        type: DataTypes.ENUM('report', 'project'),
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
    modelName: 'PreThesisSubmission',
    tableName: 'pre_thesis_submissions',
    timestamps: true
});

module.exports = PreThesisSubmission;
