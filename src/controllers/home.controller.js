const Salon = require('../models/Salon');
const Service = require('../models/Service');
const Category = require('../models/Category');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Settings = require('../models/Settings');

exports.getHomePage = async (req, res) => {
    try {
        const categories = await Category.getAll();
        const salons = await Salon.getAllActive();
        const settings = await Settings.getAll();

        // Pass social links to locals for footer
        res.locals.siteSettings = settings;

        // Find a salon that has a bridal package configured
        const salonWithBridal = salons.find(s => s.bridal_title && s.bridal_desc);
        const bridalPackage = salonWithBridal ? {
            title: salonWithBridal.bridal_title,
            desc: salonWithBridal.bridal_desc,
            discount: salonWithBridal.bridal_discount,
            salonId: salonWithBridal.id
        } : null;

        res.render('pages/public/home', {
            title: 'الرئيسية',
            categories,
            salons: salons.slice(0, 8),
            searchQuery: req.query.q || '',
            bridalPackage
        });
    } catch (error) {
        console.error('Home Page Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.getSalonsPage = async (req, res) => {
    try {
        const { q, category, sort, bridal } = req.query;
        const salons = await Salon.search({ query: q, category_id: category, sort, bridal: bridal === 'true' });
        const categories = await Category.getAll();

        res.render('pages/public/salons', {
            title: 'اكتشفي الصالونات',
            salons,
            categories,
            searchQuery: q || '',
            currentCategory: category || 'all',
            currentSort: sort || 'default',
            currentBridal: bridal === 'true'
        });
    } catch (error) {
        console.error('Salons Page Error:', error);
        res.status(500).send('Server Error');
    }
};

const Gallery = require('../models/Gallery');

exports.getSalonDetails = async (req, res) => {
    try {
        const salonId = req.params.id;
        const salon = await Salon.getById(salonId);
        if (!salon) return res.status(404).send('Salon not found');

        const services = await Service.getBySalonId(salonId);
        const reviews = await Review.getBySalonId(salonId);
        const gallery = await Gallery.getBySalonId(salonId);

        res.render('pages/public/salon-details', {
            title: salon.name,
            salon,
            services,
            reviews,
            gallery
        });
    } catch (error) {
        console.error('Salon Details Error:', error);
        res.status(500).send('Server Error');
    }
};

// Owner Dashboard Controllers
exports.getOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const salon = await Salon.getByOwnerId(ownerId);
        if (!salon) return res.render('pages/dashboard/owner/index', { title: 'Dashboard', stats: null, recentBookings: [], salon: {} });

        const bookings = await Booking.getByOwnerSalon(ownerId);
        const reviewStats = await Review.getStatsForOwner(ownerId);
        const bookingStats = await Booking.getStats(ownerId);

        const stats = {
            totalBookings: bookingStats.total_bookings || 0,
            totalRevenue: bookingStats.total_revenue || 0,
            completedBookings: bookingStats.completed_bookings || 0,
            pendingBookings: bookingStats.pending_bookings || 0,
            avgRating: reviewStats ? parseFloat(reviewStats.avg_rating).toFixed(1) : '0.0',
            totalReviews: reviewStats ? reviewStats.total_reviews : 0
        };

        res.render('pages/dashboard/owner/index', {
            title: 'لوحة التحكم',
            stats,
            recentBookings: bookings.slice(0, 5),
            salon: salon || {}
        });
    } catch (error) {
        console.error('Owner Dashboard Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getOwnerGallery = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع الوصول لهذه الصفحة');
            return res.redirect('/dashboard/owner');
        }
        const gallery = await Gallery.getBySalonId(salon.id);
        res.render('pages/dashboard/owner/gallery', {
            title: 'معرض الصور',
            gallery
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getOwnerServices = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع الوصول لهذه الصفحة');
            return res.redirect('/dashboard/owner');
        }
        const services = await Service.getBySalonId(salon.id);
        res.render('pages/dashboard/owner/services', {
            title: 'إدارة الخدمات',
            services
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const salon = await Salon.getByOwnerId(ownerId);
        if (!salon) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع الوصول لهذه الصفحة');
            return res.redirect('/dashboard/owner');
        }

        // Extract filters from query params
        const filters = {
            status: req.query.status,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            search: req.query.search
        };

        const bookings = await Booking.getWithFilters(ownerId, filters);
        const stats = await Booking.getStats(ownerId);

        // Helper for date calculations
        const today = new Date().toISOString().split('T')[0];

        res.render('pages/dashboard/owner/bookings', {
            title: 'إدارة الحجوزات',
            bookings,
            filters, // Pass filters back to view
            today, // For date inputs max/min if needed
            stats: {
                total: stats.total_bookings || 0,
                completed: stats.completed_bookings || 0,
                pending: stats.pending_bookings || 0,
                cancelled: bookings.filter(b => b.status === 'cancelled').length
            }
        });
    } catch (error) {
        console.error('getOwnerBookings Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getOwnerOffers = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع الوصول لهذه الصفحة');
            return res.redirect('/dashboard/owner');
        }
        const activeOffers = await Offer.getActiveByOwner(req.user.id);
        const expiredOffers = await Offer.getExpiredByOwner(req.user.id);
        res.render('pages/dashboard/owner/offers', {
            title: 'العروض',
            activeOffers,
            expiredOffers
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getOwnerReviews = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع الوصول لهذه الصفحة');
            return res.redirect('/dashboard/owner');
        }
        const { rating, status } = req.query;
        const reviews = await Review.getByOwner(req.user.id, { rating, status });
        const stats = await Review.getStatsForOwner(req.user.id);

        res.render('pages/dashboard/owner/reviews', {
            title: 'التقييمات',
            reviews,
            stats,
            filters: { rating, status }
        });
    } catch (error) {
        console.error('getOwnerReviews Error:', error);
        res.status(500).send('Server Error');
    }
};

// Admin Dashboard Controllers
exports.getAdminDashboard = async (req, res) => {
    try {
        const salons = await Salon.getAllForAdmin();
        const customers = await User.getAllCustomers();

        // Fetch all bookings for global stats
        const query = 'SELECT b.*, s.name as salon_name, u.name as customer_name FROM bookings b JOIN salons s ON b.salon_id = s.id JOIN users u ON b.customer_id = u.id ORDER BY b.created_at DESC LIMIT 5';
        const { rows: recentActivities } = await (require('../database/db')).query(query);

        const { rows: bookingCountResult } = await (require('../database/db')).query('SELECT COUNT(*) FROM bookings');
        const totalBookings = parseInt(bookingCountResult[0].count);

        res.render('pages/dashboard/admin/index', {
            title: 'لوحة تحكم المسؤول',
            stats: {
                salonsCount: salons.length,
                customersCount: customers.length,
                totalBookings
            },
            recentSalons: salons.slice(0, 5),
            recentActivities
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getAdminSalons = async (req, res) => {
    try {
        const salons = await Salon.getAllForAdmin();
        res.render('pages/dashboard/admin/salons', {
            title: 'إدارة الصالونات',
            salons
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getAdminUsers = async (req, res) => {
    try {
        const users = await User.getAllCustomers();
        res.render('pages/dashboard/admin/users', {
            title: 'المستخدمين',
            users
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getAdminHistory = async (req, res) => {
    try {
        const db = require('../database/db');
        const query = `
            SELECT b.*, s.name as salon_name, u.name as customer_name, u.email as customer_email
            FROM bookings b 
            JOIN salons s ON b.salon_id = s.id 
            JOIN users u ON b.customer_id = u.id 
            WHERE b.visible_to_admin = TRUE
            ORDER BY b.created_at DESC
        `;
        const { rows: history } = await db.query(query);

        res.render('pages/dashboard/admin/history', {
            title: 'سجل العمليات',
            history
        });
    } catch (error) {
        console.error('Admin History Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getAdminSubscriptions = async (req, res) => {
    try {
        const owners = await User.getAllOwners();
        res.render('pages/dashboard/admin/subscriptions', {
            title: 'إدارة الاشتراكات',
            owners
        });
    } catch (error) {
        console.error('getAdminSubscriptions Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getPrivacyPage = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.locals.siteSettings = settings;
        res.render('pages/public/privacy', {
            title: 'سياسة الخصوصية'
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getTermsPage = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.locals.siteSettings = settings;
        res.render('pages/public/terms', {
            title: 'الشروط والأحكام'
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getAboutPage = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.locals.siteSettings = settings;
        res.render('pages/public/about', {
            title: 'عن كوافير'
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.getContactPage = async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.locals.siteSettings = settings;
        res.render('pages/public/contact', {
            title: 'تواصل معنا'
        });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

// Public CMS Pages
exports.getDynamicPage = async (req, res) => {
    try {
        const { slug } = req.params;
        const page = await Settings.getPage(slug);
        const settings = await Settings.getAll();

        if (!page) return res.status(404).render('pages/public/404', { title: 'Not Found' });

        res.locals.siteSettings = settings;

        res.render('pages/public/dynamic-page', {
            title: req.locale === 'ar' ? page.title_ar : (page.title_en || page.title_ar),
            page,
            content: req.locale === 'ar' ? page.content_ar : (page.content_en || page.content_ar)
        });
    } catch (error) {
        console.error('Dynamic Page Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getLoginPage = (req, res) => {
    res.render('pages/public/login', { title: 'Login' });
};

exports.getRegisterPage = (req, res) => {
    res.render('pages/public/register', { title: 'Register' });
};

exports.getForgotPasswordPage = (req, res) => {
    res.render('pages/public/forgot-password', { title: 'Forgot Password' });
};

exports.getResetPasswordPage = (req, res) => {
    res.render('pages/public/reset-password', { title: 'Reset Password', token: req.params.token });
};

exports.getOffersPage = async (req, res) => {
    try {
        const offers = await Offer.getAllActive();
        res.render('pages/public/offers', {
            title: 'العروض الحالية',
            offers
        });
    } catch (error) {
        console.error('Offers Page Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getBookingsPage = async (req, res) => {
    // User personal bookings
    if (!req.user) return res.redirect('/login');
    const bookings = await Booking.getByCustomerId(req.user.id);
    res.render('pages/public/bookings', {
        title: 'حجوزاتي',
        bookings,
        locale: req.locale || 'ar',
        user: req.user
    });
};

// Admin Subscriptions Page
exports.getAdminSubscriptions = async (req, res) => {
    try {
        const db = require('../database/db');

        const result = await db.query(`
            SELECT 
                s.*,
                u.name as owner_name,
                u.email as owner_email
            FROM salons s
            LEFT JOIN users u ON s.owner_id = u.id
            ORDER BY s.subscription_end ASC
        `);

        const salons = result.rows;
        const today = new Date();

        // Calculate stats
        const stats = {
            active: 0,
            expiring: 0,
            expired: 0
        };

        salons.forEach(salon => {
            const subEnd = new Date(salon.subscription_end);
            const daysLeft = Math.ceil((subEnd - today) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 0) {
                stats.expired++;
            } else if (daysLeft <= 7) {
                stats.expiring++;
            } else {
                stats.active++;
            }
        });

        res.render('pages/dashboard/admin/subscriptions', {
            title: 'إدارة الاشتراكات',
            salons,
            stats
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).send('حدث خطأ في تحميل الاشتراكات');
    }
};
