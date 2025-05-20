const jwt = require('jsonwebtoken');
const User = require('../models/User');
const joi = require('joi');
const { comparePassword, generateAccessToken, generateRefreshToken } = require('../middlewares/auth');

class AuthController {
    getUser = async (req, res) => {
        const token = req.cookies.jwt;
        if (!token) return res.sendStatus(401);

        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403);

            let user = await User.findByPk(decoded.id);
            if (!user) return res.sendStatus(403);

            const userData = {
                id: user.id,
                username: user.username,
                role: user.role,
            };

            res.status(200).json({ user: userData });
        });
    }

    postLogin = async (req, res) => {
        try {
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
            
            const userData = {
                id: user.id,
                username: user.username,
                role: user.role,
            };

            req.user = userData;

            res.status(200).json({ user: userData, accessToken, message: 'Login Successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };

    postAccessToken = async (req, res) => {
        try {
            const refreshToken = req.cookies.jwt;
            if (!refreshToken) return res.sendStatus(401);
        
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        return res.status(401).json({ message: 'Refresh token expired' });
                    }
                    return res.sendStatus(403);
                }
                const user = await User.findByPk(decoded.id);
                if (!user) return res.sendStatus(403);
        
                const accessToken = generateAccessToken(user);
                res.json({ accessToken });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
    
    postLogout = (req, res) => {
        res.clearCookie('jwt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });
        res.status(200).json({ message: 'Logout' });
    };

    newAccessToken = async (req, res) => {
        const refreshToken = req.cookies.jwt;
        if (!refreshToken) return res.sendStatus(401);
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.sendStatus(403);
            const user = await User.findByPk(decoded.id);
            if (!user) return res.sendStatus(403);
            const accessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
            res.json({ accessToken });
        });
    }
}
const validateLogin = (user) => {
    const schema = joi.object({
        username: joi.string().min(3).max(20).required().label('Username'),
        password: joi.required().label('Password'),
    });
    return schema.validate(user);
}

module.exports = new AuthController();