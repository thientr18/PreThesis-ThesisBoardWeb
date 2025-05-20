const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Topic = require('./Topic');
const Student = require('./Student');
const StudentSemester = require('./StudentSemester');

<<<<<<< Updated upstream:server/app/models/StudentPreThesis.js
class StudentPreThesis extends Model {}
StudentPreThesis.init({
=======
// Pre thesis projects of students
class PreThesis extends Model {}
PreThesis.init({
>>>>>>> Stashed changes:server/app/models/PreThesis.js
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
<<<<<<< Updated upstream:server/app/models/StudentPreThesis.js
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
=======
    studentId: {
        type: DataTypes.INTEGER,
>>>>>>> Stashed changes:server/app/models/PreThesis.js
        references: {
            model: StudentSemester,
            key: 'studentId'
        }
    },
    topicId: {
        type: DataTypes.INTEGER,
<<<<<<< Updated upstream:server/app/models/StudentPreThesis.js
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
=======
        references: {
            model: Topic,
>>>>>>> Stashed changes:server/app/models/PreThesis.js
            key: 'id'
        }
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
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
        allowNull: true,
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
    modelName: 'PreThesis',
    tableName: 'pre_theses',
    timestamps: true,
    indexes: [{
        unique: true,
<<<<<<< Updated upstream:server/app/models/StudentPreThesis.js
        fields: ['semesterId', 'studentId']
=======
        fields: ['topicId', 'studentId']
>>>>>>> Stashed changes:server/app/models/PreThesis.js
    }]
});

module.exports = PreThesis;