const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/userDB');
const Teacher = require('./Teacher');
const Semester = require('./Semester');

class Topic extends Model { }
Topic.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supervisorId: {
        type: DataTypes.INTEGER,
<<<<<<< Updated upstream:server/app/models/PreThesisTopic.js
        allowNull: false,
=======
>>>>>>> Stashed changes:server/app/models/Topic.js
        references: {
            model: Teacher,
            key: 'id'
        },
        unique: false,
        allowNull: false
    },
    semesterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
<<<<<<< Updated upstream:server/app/models/PreThesisTopic.js
=======
        unique: false,
>>>>>>> Stashed changes:server/app/models/Topic.js
        references: {
            model: Semester,
            key: 'id'
        }
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    maximumSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    remainingSlots: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    minGpa: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
            min: 0,
            max: 100,
        }
    },
    minCredits: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 90,
        validate: {
            min: 0,
        }
    },
    requirements: {
        type: DataTypes.TEXT,
        allowNull: true
    },
<<<<<<< Updated upstream:server/app/models/PreThesisTopic.js
}, {
    sequelize,
    modelName: 'PreThesisTopic',
    tableName: 'pre_thesis_topics',
    timestamps: true
=======
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open'
    },
}, {
    sequelize,
    modelName: 'Topic',
    tableName: 'topics',
    timestamps: true,
    hooks: {
        beforeCreate: (topic, options) => {
            topic.remainingSlots = topic.maximumSlots;
        },
        beforeUpdate: (topic, options) => {
            if (topic.changed('remainingSlots')) {
                topic.status = topic.remainingSlots > 0 ? 'open' : 'closed';
            }
        }
    }
>>>>>>> Stashed changes:server/app/models/Topic.js
});

module.exports = Topic;