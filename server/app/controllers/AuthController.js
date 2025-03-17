const jwt = require('jsonwebtoken');
const User = require('../models/User');
const joi = require('joi');
const { comparePassword, generateAccessToken, generateRefreshToken } = require('../middlewares/auth');

class AuthController {
    postLogin = async (req, res) => {
        try {
            const { error } = validateLogin(req.body);
            if (error) return res.status(400).json({ error: error.details[0].message });

            const user = await User.findOne({ where: { username: req.body.username } });
            if (!user) return res.status(401).json({ message: "Invalid Username or Password" });

            const validPassword = await comparePassword(req.body.password, user.password);
            if (!validPassword) return res.status(401).json({ message: "Invalid Username or Password" });

            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                maxAge: parseInt(process.env.COOKIE_EXPIRE),
            });

            const userData = user.toJSON();
            delete userData.password;

            res.status(200).json({ user: userData, accessToken, refreshToken, message: 'Login Successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };

    postToken = async (req, res) => {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) return res.sendStatus(401);

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403);

            const user = await User.findByPk(decoded.id);
            if (!user) return res.sendStatus(403);

            const accessToken = generateAccessToken(user);
            res.json({ accessToken });
        });
    };
    
    postLogout = (req, res) => {
        res.cookie('jwt', '', { maxAge: 1 });
        res.status(200).json({ message: 'Logout' });
    };
}

const validateLogin = (user) => {
    const schema = joi.object({
        username: joi.string().min(3).max(20).required().label('Username'),
        password: joi.required().label('Password'),
    });
    return schema.validate(user);
}

module.exports = new AuthController();