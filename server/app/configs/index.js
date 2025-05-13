const { hash } = require('bcrypt');
const { models } = require('../models'); // Import models
const sequelize = require('./dbConfig');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Drops and recreates tables
    console.log('Database synced!');

    // Insert Users
    const accounts = [
      { username: 'admin1', password: 'admin1', role: 'admin' },
      { username: 'teacher1', password: 'teacher1', role: 'teacher' },
      { username: 'teacher2', password: 'teacher2', role: 'teacher' },
      { username: 'student1', password: 'student1', role: 'student' },
      { username: 'student2', password: 'student2', role: 'student' },
      { username: 'moderator1', password: 'moderator1', role: 'moderator' },
    ];
    const hashedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const salt = await hash(account.password, 10);
        return { ...account, password: salt };
      })
    );

    const users = await models.User.bulkCreate(
      hashedAccounts.map((account) => ({
        username: account.username,
        password: account.password,
        role: account.role,
      })),
      { returning: true }
    );

    // Insert Admins
    const admins = await models.Admin.bulkCreate([
      { userId: users[0].id, fullName: 'Admin User', email: 'admin@example.com', phone: '1234567890' },
    ]);

    // Insert Teachers
    const teachers = await models.Teacher.bulkCreate([
      { userId: users[1].id, fullName: 'Teacher One', email: 'teacher1@example.com', phone: '0987654321' },
      { userId: users[2].id, fullName: 'Teacher Two', email: 'teacher2@example.com', phone: '0987654322' },
    ]);

    // Insert Students
    const students = await models.Student.bulkCreate([
      { userId: users[3].id, fullName: 'Student One', email: 'student1@example.com', phone: '1122334455' },
      { userId: users[4].id, fullName: 'Student Two', email: 'student2@example.com', phone: '1122334456' },
    ]);

    // Insert Moderators
    const moderators = await models.Moderator.bulkCreate([
      { userId: users[5].id, fullName: 'Moderator One', email: 'moderator1@example.com', phone: '1231231234' },
    ]);

    // Insert Semesters
    const semesters = await models.Semester.bulkCreate([
      { name: 'Spring 2025', startDate: '2025-01-01', endDate: '2025-06-01', isActive: true },
      { name: 'Fall 2025', startDate: '2025-08-01', endDate: '2025-12-31', isActive: false },
    ]);

    // Insert TeacherSemesters
    const teacherSemesters = await models.TeacherSemester.bulkCreate([
      { teacherId: teachers[0].id, semesterId: semesters[0].id },
      { teacherId: teachers[1].id, semesterId: semesters[1].id },
    ]);

    // Insert StudentSemesters
    const studentSemesters = await models.StudentSemester.bulkCreate([
      { studentId: students[0].id, semesterId: semesters[0].id },
      { studentId: students[1].id, semesterId: semesters[1].id },
    ]);

    // Insert PreThesisTopics
    const preThesisTopics = await models.PreThesisTopic.bulkCreate([
      { supervisorId: teachers[0].id, semesterId: semesters[0].id, topic: 'AI Research', totalSlots: 5, remainingSlots: 4 },
      { supervisorId: teachers[1].id, semesterId: semesters[1].id, topic: 'Blockchain Technology', totalSlots: 3, remainingSlots: 2 },
    ]);

    // Insert StudentPreTheses
    const studentPreTheses = await models.StudentPreThesis.bulkCreate([
      {
        semesterId: semesters[0].id,
        studentId: students[0].id,
        preThesisTopicId: preThesisTopics[0].id,
        supervisorId: teachers[0].id,
        topic: 'AI in Healthcare',
        dueDate: '2025-05-30',
      },
    ]);

    // Insert Theses
    const theses = await models.Thesis.bulkCreate([
      { semesterId: semesters[1].id, studentId: students[1].id, topic: 'Thesis on Blockchain', status: 'pending' },
    ]);

    // Insert ThesisTeachers
    const thesisTeachers = await models.ThesisTeacher.bulkCreate([
      { thesisId: theses[0].id, teacherId: teachers[1].id },
    ]);

    // Insert Grades
    const grades = await models.Grade.bulkCreate([
      { thesisId: theses[0].id, teacherId: teachers[1].id, grade: 90, comment: 'Excellent work', status: 'approved' },
    ]);

    // Insert Announcements
    const announcements = await models.Announcement.bulkCreate([
      { senderId: users[1].id, title: 'Welcome', content: 'Welcome to the system' },
      { senderId: users[3].id, title: 'Semester Start', content: 'Fall 2025 semester starts soon' },
    ]);

    // Insert AnnouncementRecipients
    const announcementRecipients = await models.AnnouncementRecipients.bulkCreate([
      { announcementId: 1, userId: users[0].id, isRead: false },
      { announcementId: 2, userId: users[0].id, isRead: false },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();