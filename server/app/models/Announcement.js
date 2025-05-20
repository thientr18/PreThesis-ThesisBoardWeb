const { Model, DataTypes } = require('sequelize');
<<<<<<< Updated upstream
const sequelize = require('../configs/dbConfig');

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
}, {
    sequelize,
    modelName: 'Announcement',
    tableName: 'announcements',
    timestamps: true,
});

module.exports = Announcement;