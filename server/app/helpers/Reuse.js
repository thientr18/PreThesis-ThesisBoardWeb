const models = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class Reuse {
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    generateAccessToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    }

    generateRefreshToken(user) {
        return jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
    }

    async findUserByEmail(email) {
        return await models.User.findOne({ where: { email } });
    }
}

module.exports = new Reuse();