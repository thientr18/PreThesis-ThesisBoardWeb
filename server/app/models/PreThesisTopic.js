const { Model, DataTypes } = require('sequelize');
const sequelize = require('../configs/dbConfig');
const Teacher = require('./Teacher');
const Semester = require('./Semester');

class PreThesisTopic extends Model {
    static async createPreThesisTopic(teacherId, semesterId, topic) {
        try {
            const preThesisTopic = await PreThesisTopic.create({
                teacherId,
                semesterId,
                topic
            });
            console.log(`[PRE-THESIS TOPIC CREATED] ${preThesisTopic.topic}`);
            return preThesisTopic;
        } catch (error) {
            throw error;
        }
    };
}
PreThesisTopic.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    supervisorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Teacher,
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
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    totalSlots: {
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
        validate: {
            min: 0,
        }
    },
    otherRequirements: {
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    sequelize,
    modelName: 'PreThesisTopics',
    timestamps: true
});

module.exports = PreThesisTopic;