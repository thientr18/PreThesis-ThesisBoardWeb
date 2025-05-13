const express = require('express');
const router = express.Router();

const AuthController = require("../app/controllers/AuthController");

// Auth
router.get('/user', AuthController.getUser);
router.post('/login', AuthController.postLogin);
router.post('/logout', AuthController.postLogout);
router.post('/token', AuthController.newAccessToken);
module.exports = router;