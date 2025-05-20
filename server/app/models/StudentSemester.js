const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Student = require('./Student');
const Semester = require('./Semester');

class StudentSemester extends Model {}
StudentSemester.init({
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'id'
        }
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
<<<<<<< Updated upstream
    }
=======
    },
    type: {
        type: DataTypes.ENUM('pre-thesis', 'thesis'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['pre-thesis', 'thesis']],
                msg: "Type must be one of 'pre-thesis' or 'thesis'"
            }
        }
    },
    isRegistered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
>>>>>>> Stashed changes
}, {
    sequelize,
    modelName: 'StudentSemester',
    tableName: 'student_semesters',
<<<<<<< Updated upstream
    timestamps: false
=======
    timestamps: true,
>>>>>>> Stashed changes
});

module.exports = StudentSemester;