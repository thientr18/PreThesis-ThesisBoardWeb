const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const bcrypt = require('bcrypt');
const joi = require('joi');

class User extends Model { }
User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        lowercase: true,
        validate: {
            len: [6, 20]
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'hcm-iu',
        validate: {
            len: [6, 1024]
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'moderator', 'teacher', 'student'),
        allowNull: false,
        defaultValue: 'student',
        validate: {
            isIn: {
                args: [['admin', 'moderator', 'teacher', 'student']],
                msg: "Role must be one of 'admin', 'moderator', 'teacher', 'student'"
            }
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'inactive']],
                msg: "Status must be one of 'active', 'inactive'"
            }
        }
    },
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            try {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                user.username = user.username.toLowerCase();
                console.log(`[USER CREATED] ${user.username}`);
            } catch (error) {
                throw error;
            }
        },
        beforeUpdate: async (user) => {
            try {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
                if (user.changed('username')) {
                    user.username = user.username.toLowerCase();
                }
                console.log(`[USER UPDATED] ${user.username}`);
            } catch (error) {
                throw error;
            }
        },
    }
});

const validateUser = (user) => {
    const schema = joi.object({
        username: joi.string().min(3).max(20).required().label('Username'),
        password: passwordComplexity().required().label('Password'),
        role: joi.string().valid('admin', 'moderator', 'teacher', 'student').required().label('Role'),
    });
    return schema.validate(user);
}

module.exports = User;
module.exports.validateUser = validateUser;