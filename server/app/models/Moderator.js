const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const User = require('./User');

class Moderator extends Model {}
Moderator.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        unique: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        lowercase: true,
        validate: {
            isEmail: true,
        }
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            len: [10, 11],
            isNumeric: {
                args: true,
                msg: "Phone number must contain only numbers"
            }
        }
    },
    birthDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
            isDate: true
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'inactive']],
                msg: "Status must be one of 'active' or 'inactive'"
            }
        }
    },
}, {
    sequelize,
    modelName: 'Moderator',
    tableName: 'moderators',
    timestamps: true,
    hooks: {
        beforeCreate: (moderator, options) => {
            if (moderator.email) {
                moderator.email = moderator.email.toLowerCase();
            }
        },
        beforeUpdate: (moderator, options) => {
            if (moderator.email) {
                moderator.email = moderator.email.toLowerCase();
            }
        }
    }
});

module.exports = Moderator;