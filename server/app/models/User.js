const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const bcrypt = require('bcrypt');

class User extends Model {
    static async login(email, password) {
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) throw new Error("Incorrect email");
            console.log(`[USER LOGIN] ${user.email}`);
        
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw new Error("Incorrect password");
        
            return user;
        } catch (error) {
            throw error;
        }
    };
}
User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'moderator', 'teacher', 'student'),
        allowNull: false,
        defaultValue: 'student'
    }
}, {
    sequelize,
    modelName: 'Users',
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

module.exports = User;