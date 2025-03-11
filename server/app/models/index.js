const sequelize = require('../configs/dbConfig');
const User = require('./User');
const Admin = require('./Admin');
const Grade = require('./Grade');
const Moderator = require('./Moderator');
const PreThesisTopic = require('./PreThesisTopic');
const Semester = require('./Semester');
const Student = require('./Student');
const StudentPreThesis = require('./StudentPreThesis');
const StudentSemester = require('./StudentSemester');
const Teacher = require('./Teacher');
const TeacherSemester = require('./TeacherSemester');
const Thesis = require('./Thesis');
const ThesisTeacher = require('./ThesisTeacher');

const models = {
  User,
  Admin,
  Grade,
  Moderator,
  PreThesisTopic,
  Semester,
  Student,
  StudentPreThesis,
  StudentSemester,
  Teacher,
  TeacherSemester,
  Thesis,
  ThesisTeacher,
};

// Define associations for User
User.hasOne(Admin, { foreignKey: 'userId' });
Admin.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Moderator, { foreignKey: 'userId' });
Moderator.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Student, { foreignKey: 'userId' });
Student.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Teacher, { foreignKey: 'userId' });
Teacher.belongsTo(User, { foreignKey: 'userId' });

// Define associations
Semester.belongsToMany(Student, { through: StudentSemester, foreignKey: 'semesterId' });
Student.belongsToMany(Semester, { through: StudentSemester, foreignKey: 'studentId' });
Semester.belongsToMany(Teacher, { through: TeacherSemester, foreignKey: 'semesterId' });
Teacher.belongsToMany(Semester, { through: TeacherSemester, foreignKey: 'teacherId' });

Semester.hasMany(PreThesisTopic, { foreignKey: 'semesterId' });
PreThesisTopic.belongsTo(Semester, { foreignKey: 'semesterId' });
Semester.hasMany(StudentPreThesis, { foreignKey: 'semesterId' });
StudentPreThesis.belongsTo(Semester, { foreignKey: 'semesterId' });
Semester.hasMany(Thesis, { foreignKey: 'semesterId' });
Thesis.belongsTo(Semester, { foreignKey: 'semesterId' });

Teacher.hasMany(PreThesisTopic, { foreignKey: 'supervisorId' });
PreThesisTopic.belongsTo(Teacher, { foreignKey: 'supervisorId' });
Teacher.hasMany(StudentPreThesis, { foreignKey: 'supervisorId' });
StudentPreThesis.belongsTo(Teacher, { foreignKey: 'supervisorId' });
Teacher.hasMany(Grade, { foreignKey: 'teacherId' });
Grade.belongsTo(Teacher, { foreignKey: 'teacherId' });

Teacher.belongsToMany(Thesis, { through: ThesisTeacher, foreignKey: 'teacherId' });
Thesis.belongsToMany(Teacher, { through: ThesisTeacher, foreignKey: 'thesisId' });

Student.hasMany(StudentPreThesis, { foreignKey: 'studentId' });
StudentPreThesis.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Thesis, { foreignKey: 'studentId' });
Thesis.belongsTo(Student, { foreignKey: 'studentId' });

PreThesisTopic.hasMany(StudentPreThesis, { foreignKey: 'preThesisTopicId' });
StudentPreThesis.belongsTo(PreThesisTopic, { foreignKey: 'preThesisTopicId' });

Thesis.hasMany(Grade, { foreignKey: 'thesisId' });
Grade.belongsTo(Thesis, { foreignKey: 'thesisId' });

// sync models
const syncModels = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync();
    console.log('Database synced!');
  } catch (err) {
    console.error('Database connection or sync failed:', err);
  }
};

module.exports = { models, syncModels };