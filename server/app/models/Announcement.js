const { Model, DataTypes } = require('sequelize');
<<<<<<< Updated upstream
const sequelize = require('../configs/dbConfig');
=======
const sequelize = require('../configs/userDB');
const User = require('./User');
>>>>>>> Stashed changes

class Announcement extends Model {}
Announcement.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
<<<<<<< Updated upstream
=======
    senderId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        unique: false,
        allowNull: false
    },
>>>>>>> Stashed changes
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    receiver: {
        type: DataTypes.STRING,
        allowNull: false
    },
    publishedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    timestamps: true
});