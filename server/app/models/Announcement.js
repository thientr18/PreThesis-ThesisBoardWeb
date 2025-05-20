const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const User = require('./User');

class Announcement extends Model {}
Announcement.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    senderId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        unique: false,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
}, {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    timestamps: true,
});

module.exports = Announcement;