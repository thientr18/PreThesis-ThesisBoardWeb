const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Announcement = require('./Announcement');
const User = require('./User');

class AnnouncementRecipients extends Model {}

AnnouncementRecipients.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    announcementId: {
        type: DataTypes.INTEGER,
        references: {
            model: Announcement,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        unique: false,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    readAt: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    deletedAt: {
        type: DataTypes.DATE,
        defaultValue: null
    },
}, {
    sequelize,
    modelName: 'AnnouncementRecipients',
    tableName: 'announcement_recipients',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['announcementId', 'userId']
        }
    ]
});

module.exports = AnnouncementRecipients;