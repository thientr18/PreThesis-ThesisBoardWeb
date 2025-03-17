const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
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
            len: [3, 20]
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
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
    }
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
                console.log(`[USER CREATED] ${user.userId}`);
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
                console.log(`[USER UPDATED] ${user.userId}`);
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