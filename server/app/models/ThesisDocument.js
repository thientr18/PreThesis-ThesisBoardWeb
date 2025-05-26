const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Thesis = require('./Thesis');

class ThesisDocument extends Model {}
ThesisDocument.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thesisId: {
        type: DataTypes.INTEGER,
        references: {
            model: Thesis,
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
    modelName: 'ThesisDocument',
    tableName: 'thesis_documents',
    timestamps: true
});