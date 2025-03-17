const express = require('express');
const AuthController = require("../app/controllers/authController");
const router = express.Router();

// Auth
router.post('/login', AuthController.postLogin);
router.post('/logout', AuthController.postLogout);
module.exports = router;