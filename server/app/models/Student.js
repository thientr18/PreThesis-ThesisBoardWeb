const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const User = require('./User');

class Student extends Model {}
Student.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
        allowNull: true,
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
    credits: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    gpa: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    canDoThesis: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    doingThesis: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'),
        allowNull: false,
        defaultValue: 'inactive',
        validate: {
            isIn: [['active', 'inactive', 'graduated', 'suspended']]
        }
    },
}, {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: true,
    hooks: {
        beforeCreate: (student, options) => {
            if (student.email) {
                student.email = student.email.toLowerCase();
            }
        },
        beforeUpdate: (student, options) => {
            if (student.email) {
                student.email = student.email.toLowerCase();
            }
        }
    }
});

module.exports = Student;