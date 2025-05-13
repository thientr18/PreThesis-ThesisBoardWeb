const auth = require('./auth');
const admin = require('./admin');
const site = require('./site');
const { authenticateToken, authorizeRoles } = require('../app/middlewares/auth');

function router (app) {
  app.use('/api/auth', auth);
  app.use('/admin', authenticateToken, authorizeRoles(['admin']), admin);
  // app.use('/moderator',  moderator);
  app.use('/', site);

  // 404
  app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });
}

module.exports = router;