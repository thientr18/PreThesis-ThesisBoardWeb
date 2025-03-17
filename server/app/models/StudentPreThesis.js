const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Semester = require('./Semester');
const Teacher = require('./Teacher');
const Student = require('./Student');
const PreThesisTopics = require('./PreThesisTopic');

class StudentPreThesis extends Model {}
StudentPreThesis.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Semester,
            key: 'id'
        }
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Student,
            key: 'id'
        }
    },
    preThesisTopicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: PreThesisTopics,
            key: 'id'
        }
    },
    supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: false
    },
    report: {
        type: DataTypes.STRING,
        allowNull: true
    },
    demo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    grade: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfter: new Date().toISOString()
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'submitted', 'approved', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'submitted', 'approved', 'failed']]
        }
    }
}, {
    sequelize,
    modelName: 'StudentPreThesis',
    tableName: 'student_pre_theses',
    timestamps: true,
    indexes: [{
        unique: true,
        fields: ['semesterId', 'studentId']
    }]
});

module.exports = StudentPreThesis;