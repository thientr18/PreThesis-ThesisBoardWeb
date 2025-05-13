const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

module.exports = {
    authenticateToken: (req, res, next) => {
        const token =
            req.headers['authorization']?.split(' ')[1] ||
            req.cookies?.jwt;
    
        if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Token expired' });
                }
                return res.status(403).json({ message: 'Forbidden' });
            }
            req.user = user;
            next();
        });
    },

    authorizeRoles: (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        };
    },

    comparePassword: async (password, hash) => {
        return await bcrypt.compare(password, hash);
    },

    generateAccessToken: (user) => {
        if (!user.role) {
            console.warn('Warning: user.role is missing when generating access token!');
        }
        return jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
        });
    },

    generateRefreshToken: (user) => {
        return jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
        });
    }
};