const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');

class Semester extends Model {}
Semester.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true
        }
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            notEmpty: true,
            isAfterStartDate(value) {
                if (value <= this.startDate) {
                    throw new Error('End date must be after start date');
                }
            }
        }
    },
    isCurrent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
}, {
    sequelize,
    modelName: 'Semester',
    tableName: 'semesters',
<<<<<<< Updated upstream
    timestamps: true
=======
    timestamps: true,
    hooks: {
        beforeCreate: async (semester, options) => {
            if (semester.isCurrent) {
                await Semester.update({ isCurrent: false }, { where: { isCurrent: true } });
            }
            if (semester.isActive) {
                await Semester.update({ isActive: false }, { where: { isActive: true } });
            }
        },
        beforeUpdate: async (semester, options) => {
            if (semester.isCurrent) {
                await Semester.update({ isCurrent: false }, { where: { isCurrent: true } });
            }
            if (semester.isActive) {
                await Semester.update({ isActive: false }, { where: { isActive: true } });
            }
        }
    }
>>>>>>> Stashed changes
});

module.exports = Semester;