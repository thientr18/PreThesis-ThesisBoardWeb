const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');

class Semester extends Model {
    static async setActiveSemester(id) {
        const t = await sequelize.transaction();
        try {
            // Set all semesters to inactive
            await Semester.update({ isActive: false }, { where: {}, transaction: t });

            const [affectedCount, [updatedSemester]] = await Semester.update(
                { isActive: true },
                {
                    where: { id },
                    returning: true,
                    transaction: t
                }
            );

            await t.commit();
            return updatedSemester;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

}
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
});

module.exports = Semester;