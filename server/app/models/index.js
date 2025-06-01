const sequelize = require('../configs/userDB');
const Admin = require('./Admin');
const Moderator = require('./Moderator');
const PreThesis = require('./PreThesis');
const PreThesisGrade = require('./PreThesisGrade');
const PreThesisRegistration = require('./PreThesisRegistration');
const PreThesisSubmission = require('./PreThesisSubmission');
const Semester = require('./Semester');
const Student = require('./Student');
const StudentSemester = require('./StudentSemester');
const Teacher = require('./Teacher');
const TeacherSemester = require('./TeacherSemester');
const Thesis = require('./Thesis');
const ThesisGrade = require('./ThesisGrade');
const ThesisSubmission = require('./ThesisSubmission');
const Topic = require('./Topic');
const User = require('./User');

const models = {
  Admin,
  Moderator,
  Semester,
  Student,
  PreThesis,
  PreThesisGrade,
  PreThesisRegistration,
  PreThesisSubmission,
  StudentSemester,
  Teacher,
  TeacherSemester,
  Thesis,
  ThesisGrade,
  ThesisSubmission,
  Topic,
  User,
};

// sync models
const syncModels = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync( );
    console.log('Database synced!');
  } catch (err) {
    console.error('Database connection or sync failed:', err);
  }
};

// Define associations
// Admin and User
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Admin, { foreignKey: 'userId', as: 'admin' });

// Moderator and User
Moderator.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Moderator, { foreignKey: 'userId', as: 'moderator' });

// PreThesis and PreThesisGrade
PreThesis.hasMany(PreThesisGrade, { foreignKey: 'preThesisId', as: 'grades' });
PreThesisGrade.belongsTo(PreThesis, { foreignKey: 'preThesisId', as: 'preThesis' });

// PreThesis and PreTheSubmission
PreThesis.hasMany(PreThesisSubmission, { foreignKey: 'preThesisId', as: 'submissions' });
PreThesisSubmission.belongsTo(PreThesis, { foreignKey: 'preThesisId', as: 'preThesis' });

// PreThesis and Student
PreThesis.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(PreThesis, { foreignKey: 'studentId', as: 'preThesis' });

// PreThesis and Topic
PreThesis.belongsTo(Topic, { foreignKey: 'topicId', as: 'preThesisTopic' });
Topic.hasMany(PreThesis, { foreignKey: 'topicId', as: 'preThesis' });

// PreThesisRegistration and Student
PreThesisRegistration.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(PreThesisRegistration, { foreignKey: 'studentId', as: 'preThesisRegistrations' });

// PreThesisRegistration and Topic
PreThesisRegistration.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
Topic.hasMany(PreThesisRegistration, { foreignKey: 'topicId', as: 'preThesisRegistrations' });

// PreThesisGrade and Teacher
PreThesisGrade.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(PreThesisGrade, { foreignKey: 'teacherId', as: 'preThesisGrades' });

// Student and User
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Student, { foreignKey: 'userId', as: 'student' });

// Student and Semester
StudentSemester.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(StudentSemester, { foreignKey: 'studentId', as: 'studentSemesters' });
StudentSemester.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(StudentSemester, { foreignKey: 'semesterId', as: 'studentSemesters' });

// Teacher and User
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacher' });

// Teacher and Semester
TeacherSemester.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(TeacherSemester, { foreignKey: 'teacherId', as: 'teacherSemesters' });
TeacherSemester.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(TeacherSemester, { foreignKey: 'semesterId', as: 'teacherSemesters' });

// Thesis and Grade
Thesis.hasMany(ThesisGrade, { foreignKey: 'thesisId', as: 'grades' });
ThesisGrade.belongsTo(Thesis, { foreignKey: 'thesisId', as: 'thesis' });

// Thesis and Student
Thesis.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(Thesis, { foreignKey: 'studentId', as: 'thesis' });

// Thesis and Teacher
Thesis.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });
Teacher.hasMany(Thesis, { foreignKey: 'supervisorId', as: 'thesis' });

// Thesis and Semester
Thesis.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(Thesis, { foreignKey: 'semesterId', as: 'thesis' });

// ThesisGrade and Teacher
ThesisGrade.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(ThesisGrade, { foreignKey: 'teacherId', as: 'thesisGrades' });

// Thesis and ThesisSubmission
ThesisSubmission.belongsTo(Thesis, { foreignKey: 'thesisId', as: 'thesis' });
Thesis.hasMany(ThesisSubmission, { foreignKey: 'thesisId', as: 'submissions' });

// Topic and Teacher
Topic.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });
Teacher.hasMany(Topic, { foreignKey: 'supervisorId', as: 'topics' });

// Topic and Semester
Topic.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(Topic, { foreignKey: 'semesterId', as: 'topics' });

module.exports = { models, syncModels, sequelize };
