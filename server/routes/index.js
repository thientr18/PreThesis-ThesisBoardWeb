const auth = require('./auth');
<<<<<<< Updated upstream
const site = require('./site');
const { authenticateToken } = require('../app/middlewares/auth');
=======
const admin = require('./admin');
const teacher = require('./teacher');
const student = require('./student');
const site = require('./site');
const { authenticateToken, authorizeRoles } = require('../app/middlewares/auth');
const Student = require('../app/models/Student');
>>>>>>> Stashed changes

function router (app) {
  app.use('/api/auth', auth);
<<<<<<< Updated upstream
  app.use('/', authenticateToken, site)
=======
  app.use('/admin', authenticateToken, authorizeRoles(['admin']), admin);

  app.use('/teacher', authenticateToken, authorizeRoles(['teacher']), teacher);
  app.use('/student', authenticateToken, authorizeRoles(['student']), student);
  app.use('/', site);

  // 404
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });
>>>>>>> Stashed changes
}

module.exports = router;