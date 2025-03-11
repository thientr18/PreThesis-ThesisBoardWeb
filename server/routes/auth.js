const express = require('express');
const session = require('express-session');
const AuthController = require("../app/controllers/authController");
const router = express.Router();

// Initialize session middleware
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }));

// Auth
router.get('/login', AuthController.getLogin);
router.post('/login', AuthController.postLogin);
router.post('/logout', AuthController.postLogout);
module.exports = router;