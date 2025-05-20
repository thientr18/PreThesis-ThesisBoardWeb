const sequelize = require('../configs/userDB');
const Admin = require('./Admin');
const Grade = require('./Grade');
const Moderator = require('./Moderator');
const PreThesis = require('./PreThesis');
const PreThesisRegistration = require('./PreThesisRegistration');
const Semester = require('./Semester');
const Student = require('./Student');
const StudentSemester = require('./StudentSemester');
const Teacher = require('./Teacher');
const TeacherSemester = require('./TeacherSemester');
const Thesis = require('./Thesis');
const Topic = require('./Topic');
const User = require('./User');

const models = {
  Admin,
  Grade,
  Moderator,
  Semester,
  Student,
  PreThesis,
  PreThesisRegistration,
  StudentSemester,
  Teacher,
  TeacherSemester,
  Thesis,
  Topic,
  User,
};

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
module.exports = { models, syncModels };
=======
// Define associations
// Admin and User
Admin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Admin, { foreignKey: 'userId', as: 'admin' });

// Admin and Announcement
Announcement.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(Announcement, { foreignKey: 'senderId', as: 'announcements' });

// AnnouncementRecipients and Announcement
AnnouncementRecipients.belongsTo(Announcement, { foreignKey: 'announcementId', as: 'announcement' });
Announcement.hasMany(AnnouncementRecipients, { foreignKey: 'announcementId', as: 'recipients' });

// AnnouncementRecipients and User
AnnouncementRecipients.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AnnouncementRecipients, { foreignKey: 'userId', as: 'recipients' });

// Grade and PreThesis
Grade.belongsTo(PreThesis, { foreignKey: 'preThesisId', as: 'preThesis' });
PreThesis.hasMany(Grade, { foreignKey: 'preThesisId', as: 'grades' });

// Grade and Thesis
Grade.belongsTo(Thesis, { foreignKey: 'thesisId', as: 'thesis' });
Thesis.hasMany(Grade, { foreignKey: 'thesisId', as: 'grades' });

// Grade and Teacher
Grade.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(Grade, { foreignKey: 'teacherId', as: 'grades' });

// Moderator and User
Moderator.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Moderator, { foreignKey: 'userId', as: 'moderator' });

// PreThesis and Student
PreThesis.belongsTo(StudentSemester, { foreignKey: 'studentId', targetKey: 'studentId', as: 'studentSemester' });
StudentSemester.hasMany(PreThesis, { foreignKey: 'studentId', sourceKey: 'studentId', as: 'preThesis' });

// PreThesis and Topic
PreThesis.belongsTo(Topic, { foreignKey: 'topicId', as: 'preThesisTopic' });
Topic.hasMany(PreThesis, { foreignKey: 'topicId', as: 'preThesis' });

// PreThesisRegistration and Student
PreThesisRegistration.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(PreThesisRegistration, { foreignKey: 'studentId', as: 'preThesisRegistrations' });

// PreThesisRegistration and Topic
PreThesisRegistration.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
Topic.hasMany(PreThesisRegistration, { foreignKey: 'topicId', as: 'preThesisRegistrations' });

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

// Thesis and Student
Thesis.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(Thesis, { foreignKey: 'studentId', as: 'thesis' });

// Thesis and Teacher
Thesis.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });
Teacher.hasMany(Thesis, { foreignKey: 'supervisorId', as: 'thesis' });

// Thesis and Semester
Thesis.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(Thesis, { foreignKey: 'semesterId', as: 'thesis' });

// Topic and Teacher
Topic.belongsTo(Teacher, { foreignKey: 'supervisorId', as: 'supervisor' });
Teacher.hasMany(Topic, { foreignKey: 'supervisorId', as: 'topics' });

// Topic and Semester
Topic.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });
Semester.hasMany(Topic, { foreignKey: 'semesterId', as: 'topics' });

module.exports = { models, syncModels, sequelize };
>>>>>>> Stashed changes
