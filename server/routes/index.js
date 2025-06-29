const auth = require('./auth');
const admin = require('./admin');
const moderator = require('./moderator');
const teacher = require('./teacher');
const student = require('./student');
const site = require('./site');
const { authenticateToken, authorizeRoles } = require('../app/middlewares/auth');

function router (app) {
  app.use('/api/auth', auth);
  app.use('/admin', authenticateToken, authorizeRoles(['admin']), admin);
  app.use('/moderator', authenticateToken, authorizeRoles(['moderator']), moderator);
  app.use('/teacher', authenticateToken, authorizeRoles(['teacher']), teacher);
  app.use('/student', authenticateToken, authorizeRoles(['student']), student);
  app.use('/', site);

  // 404
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });
}

module.exports = router;