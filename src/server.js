const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mainRoutes = require('./routes/index');

dotenv.config();

const cookieParser = require('cookie-parser');
const i18n = require('./config/i18n');

const session = require('express-session');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Configuration (Strong & Isolated User Sessions)
app.use(session({
    name: 'kwafer_session_id', // Unique name to prevent fingerprinting
    secret: process.env.JWT_SECRET || 'kwafer-super-secret-key-2024',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Only create session when something is stored
    cookie: {
        httpOnly: true, // Prevents client-side JS from reading the cookie
        secure: process.env.NODE_ENV === 'production', // true in production (requires HTTPS)
        sameSite: 'lax', // Protects against CSRF
        maxAge: 60000 * 60 * 24 // 24 hours
    }
}));

app.use(flash());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.JWT_SECRET || 'kwafer-fallback-secret')); // Use secret for signed cookies

// Manual Security Headers (Protection against common attacks)
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY'); // Prevent Clickjacking
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME Sniffing
    res.setHeader('X-XSS-Protection', '1; mode=block'); // Basic XSS Protection
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // Force HTTPS (for production)
    next();
});

app.use(i18n.init);

// Passport Middleware
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

const { getUser } = require('./middleware/auth.middleware');
const Notification = require('./models/Notification');
const Settings = require('./models/Settings');

// Global User Identification (Soft Check)
app.use(getUser);

// Global Locals for Flash Messages & User
app.use(async (req, res, next) => {
    // Basic helpers available always
    res.locals.timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'الآن';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `منذ ${hours} ساعة`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `منذ ${days} يوم`;
        return new Date(date).toLocaleDateString('ar-EG');
    };

    try {
        res.locals.success = req.flash('success');
        res.locals.error = req.flash('error');
        res.locals.user = req.user || null;
        // Force Arabic Locale
        res.locals.locale = 'ar';
        if (req.setLocale) req.setLocale('ar'); // Ensure i18n knows it too

        // Fetch Notifications for Logged In Users
        if (req.user) {
            res.locals.notifications = await Notification.getByUser(req.user.id);
            res.locals.unreadNotificationsCount = await Notification.getUnreadCount(req.user.id);
        } else {
            res.locals.notifications = [];
            res.locals.unreadNotificationsCount = 0;
        }

        // Fetch site settings and pages for footer
        res.locals.siteSettings = await Settings.getAll();
        res.locals.footerPages = await Settings.getAllPages();
        res.locals.currentPath = req.path;

        next();
    } catch (error) {
        console.error('Core Middleware Error:', error);
        res.locals.siteSettings = res.locals.siteSettings || {};
        res.locals.footerPages = res.locals.footerPages || [];
        next();
    }
});

// Routes
app.use('/', mainRoutes);

// Global Error Handler
const errorMiddleware = require('./middleware/error.middleware');
app.use(errorMiddleware);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
