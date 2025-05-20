const { hash } = require('bcrypt');
const { models } = require('../models');
const sequelize = require('./dbConfig');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Drops and recreates tables
    console.log('Database synced!');

    // Insert Users (update fields if schema changed)
    const accounts = [
      { username: 'admin1', password: 'admin1', role: 'admin', status: 'active' },
      { username: 'teacher1', password: 'teacher1', role: 'teacher', status: 'active' },
      { username: 'teacher2', password: 'teacher2', role: 'teacher', status: 'active' },
      { username: 'student1', password: 'student1', role: 'student', status: 'active' },
      { username: 'student2', password: 'student2', role: 'student', status: 'active' },
      { username: 'student3', password: 'student3', role: 'student', status: 'active' },
      { username: 'student4', password: 'student4', role: 'student', status: 'active' },
      { username: 'student5', password: 'student5', role: 'student', status: 'active' },
      { username: 'student6', password: 'student6', role: 'student', status: 'active' },
      { username: 'student7', password: 'student7', role: 'student', status: 'active' },
      { username: 'student8', password: 'student8', role: 'student', status: 'active' },
      { username: 'student9', password: 'student9', role: 'student', status: 'active' },
      { username: 'student10', password: 'student10', role: 'student', status: 'active' },
      { username: 'student11', password: 'student11', role: 'student', status: 'active' },
      { username: 'student12', password: 'student12', role: 'student', status: 'active' },
      { username: 'student13', password: 'student13', role: 'student', status: 'active' },
      { username: 'student14', password: 'student14', role: 'student', status: 'active' },
      { username: 'student15', password: 'student15', role: 'student', status: 'active' },
      { username: 'student16', password: 'student16', role: 'student', status: 'active' },
      { username: 'student17', password: 'student17', role: 'student', status: 'active' },
      { username: 'student18', password: 'student18', role: 'student', status: 'active' },
      { username: 'student19', password: 'student19', role: 'student', status: 'active' },
      { username: 'student20', password: 'student20', role: 'student', status: 'active' },
      { username: 'moderator1', password: 'moderator1', role: 'moderator' },
    ];
    const hashedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const hashedPassword = await hash(account.password, 10);
        return { ...account, password: hashedPassword };
      })
    );

    const users = await models.User.bulkCreate(
      hashedAccounts.map((account) => ({
        username: account.username,
        password: account.password,
        role: account.role,
        // Add or remove fields as per new schema
      })),
      { returning: true }
    );

    // Insert Admins (update fields if schema changed)
    const admins = await models.Admin.bulkCreate([
      { userId: users[0].id, fullName: 'Admin User', email: 'admin@example.com', phone: '1234567890', status: 'active' },
    ]);

    // Insert Teachers
    const teachers = await models.Teacher.bulkCreate([
      { userId: users[1].id, fullName: 'Teacher One', email: 'teacher1@example.com', phone: '0987654321', status: 'active' },
      { userId: users[2].id, fullName: 'Teacher Two', email: 'teacher2@example.com', phone: '0987654322', status: 'active' },
    ]);

    // Insert Students
    const students = await models.Student.bulkCreate([
      { userId: users[3].id, fullName: 'Student One', email: 'student1@example.com', phone: '1122334455', gpa: 3.5, credits: 100, status: 'active' },
      { userId: users[4].id, fullName: 'Student Two', email: 'student2@example.com', phone: '1122334456', gpa: 3.0, credits: 90, status: 'active' },
      { userId: users[5].id, fullName: 'Student Three', email: 'student3@example.com', phone: '1122334457', gpa: 3.2, credits: 85, status: 'active' },
      { userId: users[6].id, fullName: 'Student Four', email: 'student4@example.com', phone: '1122334458', gpa: 3.8, credits: 95, status: 'active' },
      { userId: users[7].id, fullName: 'Student Five', email: 'student5@example.com', phone: '1122334459', gpa: 3.6, credits: 90, status: 'active' },
      { userId: users[8].id, fullName: 'Student Six', email: 'student6@example.com', phone: '1122334460', gpa: 3.4, credits: 85, status: 'active' },
      { userId: users[9].id, fullName: 'Student Seven', email: 'student7@example.com', phone: '1122334461', gpa: 3.1, credits: 80, status: 'active' },
      { userId: users[10].id, fullName: 'Student Eight', email: 'student8@example.com', phone: '1122334462', gpa: 3.7, credits: 90, status: 'active' },
      { userId: users[11].id, fullName: 'Student Nine', email: 'student9@example.com', phone: '1122334463', gpa: 3.0, credits: 75, status: 'active' },
      { userId: users[12].id, fullName: 'Student Ten', email: 'student10@example.com', phone: '1122334464', gpa: 3.9, credits: 100, status: 'active' },
      { userId: users[13].id, fullName: 'Student Eleven', email: 'student11@example.com', phone: '1122334465', gpa: 3.1, credits: 80, status: 'active' },
      { userId: users[14].id, fullName: 'Student Twelve', email: 'student12@example.com', phone: '1122334466', gpa: 3.4, credits: 85, status: 'active' },
      { userId: users[15].id, fullName: 'Student Thirteen', email: 'student13@example.com', phone: '1122334467', gpa: 3.2, credits: 80, status: 'active' },
      { userId: users[16].id, fullName: 'Student Fourteen', email: 'student14@example.com', phone: '1122334468', gpa: 3.5, credits: 90, status: 'active' },
      { userId: users[17].id, fullName: 'Student Fifteen', email: 'student15@example.com', phone: '1122334469', gpa: 3.4, credits: 85, status: 'active' },
      { userId: users[18].id, fullName: 'Student Sixteen', email: 'student16@example.com', phone: '1122334470', gpa: 3.6, credits: 80, status: 'active' },
      { userId: users[19].id, fullName: 'Student Seventeen', email: 'student17@example.com', phone: '1122334471', gpa: 3.5, credits: 90, status: 'active' },
      { userId: users[20].id, fullName: 'Student Eighteen', email: 'student18@example.com', phone: '1122334472', gpa: 3.4, credits: 85, status: 'active' },
      { userId: users[21].id, fullName: 'Student Nineteen', email: 'student19@example.com', phone: '1122334473', gpa: 3.3, credits: 80, status: 'active' },
      { userId: users[22].id, fullName: 'Student Twenty', email: 'student20@example.com', phone: '1122334474', gpa: 3.5, credits: 90, status: 'active' }
    ]);

    // Insert Moderators
    const moderators = await models.Moderator.bulkCreate([
      { userId: users[5].id, fullName: 'Moderator One', email: 'moderator1@example.com', phone: '1231231234' },
    ]);

    // Insert Semesters
    const semesters = await models.Semester.bulkCreate([
      { name: 'Spring 2025', startDate: '2025-01-01', endDate: '2025-06-01', isCurrent: true },
      { name: 'Fall 2025', startDate: '2025-08-01', endDate: '2025-12-31', isActive: true },
    ]);

    // Mod assigning semesters to teachers and students
    const teacherSemesters = await models.TeacherSemester.bulkCreate([
      { teacherId: teachers[0].id, semesterId: semesters[0].id, maxPreThesisSlots: 5, maxThesisSlots: 5, remainingPreThesisSlots: 0, remainingThesisSlots: 5 },
      { teacherId: teachers[0].id, semesterId: semesters[1].id, maxPreThesisSlots: 10, maxThesisSlots: 10, remainingPreThesisSlots: 10, remainingThesisSlots: 10 },
      { teacherId: teachers[1].id, semesterId: semesters[0].id, maxPreThesisSlots: 3, maxThesisSlots: 6, remainingPreThesisSlots: 0, remainingThesisSlots: 5 },
      { teacherId: teachers[1].id, semesterId: semesters[1].id, maxPreThesisSlots: 10, maxThesisSlots: 10, remainingPreThesisSlots: 10, remainingThesisSlots: 10 },
    ]);
    const studentSemesters = await models.StudentSemester.bulkCreate([
      { studentId: students[0].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[1].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[2].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[3].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[4].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[5].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[6].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[7].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[8].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[9].id, semesterId: semesters[1].id, type: 'pre-thesis', isRegistered: false },
      { studentId: students[10].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[11].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[12].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[13].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[14].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[15].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[16].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[17].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[18].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
      { studentId: students[19].id, semesterId: semesters[1].id, type: 'thesis', isRegistered: false },
    ]);

    // Insert Announcements
    const announcements = await models.Announcement.bulkCreate([
      { senderId: users[1].id, title: 'Welcome', content: 'Welcome to the system' },
      { senderId: users[3].id, title: 'Semester Start', content: 'Fall 2025 semester starts soon' },
    ]);

    // Insert AnnouncementRecipients (use actual announcement IDs if auto-incremented)
    const announcementRecipients = await models.AnnouncementRecipients.bulkCreate([
      { announcementId: announcements[0].id, userId: users[0].id, isRead: false },
      { announcementId: announcements[1].id, userId: users[0].id, isRead: false },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();