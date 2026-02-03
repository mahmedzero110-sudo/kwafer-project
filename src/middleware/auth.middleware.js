const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'kwafer_super_secret_key_123';

exports.protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.redirect('/login');

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        // Check if user is banned (not active)
        // Adjust logic based on your User model, assuming 'role' specific checks might happen later
        // But if the User table has an is_active flag, use it here.
        // Or if users are salons owners, we might need to check salon status.

        // Let's assume User model has access to basic user info. 
        // If banning logic is on Salon table, we handle it elsewhere or join.
        // However, usually User table handles login access.

        req.user = user;
        next();
    } catch (error) {
        res.clearCookie('token');
        res.redirect('/login');
    }
};

exports.getUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
                res.locals.user = user;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            req.flash('error', 'عذراً، لا تمتلكين صلاحية للدخول لهذه الصفحة');
            return res.redirect('/');
        }
        next();
    };
};
