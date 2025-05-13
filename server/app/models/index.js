const sequelize = require('../configs/dbConfig');
const User = require('./User');
const Admin = require('./Admin');
const Announcement = require('./Announcement');
const AnnouncementRecipients = require('./AnnouncementRecipients');
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
  Announcement,
  AnnouncementRecipients,
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
User.hasOne(Admin, { foreignKey: 'userId', as: 'admin' });
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Moderator, { foreignKey: 'userId', as: 'moderator' });
Moderator.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacher' });
Teacher.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sender relationship
User.hasMany(Announcement, { foreignKey: 'senderId', as: 'SentAnnouncements' });
Announcement.belongsTo(User, { foreignKey: 'senderId', as: 'Sender' });

// Semester ↔ Student (M:N)
StudentSemester.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(StudentSemester, { foreignKey: 'studentId', as: 'studentSemesters' });

StudentSemester.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(StudentSemester, { foreignKey: 'semesterId', as: 'studentSemesters' });

// Semester ↔ Teacher (M:N)
TeacherSemester.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(TeacherSemester, { foreignKey: 'teacherId', as: 'teacherSemesters' });
TeacherSemester.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(TeacherSemester, { foreignKey: 'semesterId', as: 'teacherSemesters' });

// Semester → PreThesisTopic, StudentPreThesis, Thesis
Semester.hasMany(PreThesisTopic, { foreignKey: 'semesterId', as: 'preThesisTopics' });
PreThesisTopic.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });

Semester.hasMany(StudentPreThesis, { foreignKey: 'semesterId', as: 'studentPreTheses' });
StudentPreThesis.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });

Semester.hasMany(Thesis, { foreignKey: 'semesterId', as: 'theses' });
Thesis.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });

// Teacher → PreThesisTopic, StudentPreThesis, Grade
Teacher.hasMany(PreThesisTopic, { foreignKey: 'supervisorId', as: 'supervisedTopics' });
PreThesisTopic.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });

Teacher.hasMany(StudentPreThesis, { foreignKey: 'supervisorId', as: 'supervisedPreTheses' });
StudentPreThesis.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });

Teacher.hasMany(Grade, { foreignKey: 'teacherId', as: 'gradesGiven' });
Grade.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'grader' });

// Thesis ↔ Teacher (M:N)
Teacher.belongsToMany(Thesis, { through: ThesisTeacher, foreignKey: 'teacherId', as: 'theses' });
Thesis.belongsToMany(Teacher, { through: ThesisTeacher, foreignKey: 'thesisId', as: 'reviewers' });

// Student → StudentPreThesis, Thesis
Student.hasMany(StudentPreThesis, { foreignKey: 'studentId', as: 'preTheses' });
StudentPreThesis.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Thesis, { foreignKey: 'studentId', as: 'theses' });
Thesis.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// PreThesisTopic → StudentPreThesis
PreThesisTopic.hasMany(StudentPreThesis, { foreignKey: 'preThesisTopicId', as: 'applications' });
StudentPreThesis.belongsTo(PreThesisTopic, { foreignKey: 'preThesisTopicId', as: 'preThesisTopic' });

// Thesis → Grade
Thesis.hasMany(Grade, { foreignKey: 'thesisId', as: 'grades' });
Grade.belongsTo(Thesis, { foreignKey: 'thesisId', as: 'thesis' });

// Announcement ↔ AnnouncementRecipients (M:N)
Announcement.hasMany(AnnouncementRecipients, { foreignKey: 'announcementId' });
AnnouncementRecipients.belongsTo(Announcement, { foreignKey: 'announcementId' });

// AnnouncementRecipients ↔ User (M:N)
User.hasMany(AnnouncementRecipients, { foreignKey: 'userId' });
AnnouncementRecipients.belongsTo(User, { foreignKey: 'userId' });
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

module.exports = { models, syncModels, sequelize };