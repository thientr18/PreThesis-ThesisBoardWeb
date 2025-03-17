const auth = require('./auth');
const site = require('./site');
const { authenticateToken } = require('../app/middlewares/auth');

function route (app) {
  app.use('/api/auth', auth);
  app.use('/', authenticateToken, site)
}

module.exports = route;