const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const PreThesis = require('./PreThesis');

class PreThesisDocument extends Model {}
PreThesisDocument.init({
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
        }
    },
    documentUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isLatest: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    type: {
        type: DataTypes.ENUM('slide', 'report', 'demo'),
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'PreThesisDocument',
    tableName: 'pre_thesis_documents',
    timestamps: true
});