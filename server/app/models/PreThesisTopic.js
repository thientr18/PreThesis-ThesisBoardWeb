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
        primaryKey: true,
        references: {
            model: Teacher,
            key: 'id'
        }
    },
    semesterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
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
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            isIn: {
                args: [['active', 'inactive', 'deleted']],
                msg: "Status must be one of 'active', 'inactive', or 'deleted'"
            }
        }
    },
}, {
    sequelize,
    modelName: 'PreThesisTopic',
    tableName: 'pre_thesis_topics',
    timestamps: true,
});

module.exports = PreThesisTopic;