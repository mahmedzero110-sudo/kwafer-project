const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home.controller');
const authController = require('../controllers/auth.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { checkSubscription } = require('../middleware/subscription.middleware');

// Public Routes
router.get('/', homeController.getHomePage);
router.get('/salons', homeController.getSalonsPage);
router.get('/salon/:id', homeController.getSalonDetails);
router.get('/offers', homeController.getOffersPage);

// CMS Dynamic Pages
router.get('/p/:slug', homeController.getDynamicPage);

// Static Legal & Info Pages
router.get('/privacy', homeController.getPrivacyPage);
router.get('/terms', homeController.getTermsPage);
router.get('/about-us', homeController.getAboutPage);
router.get('/contact', homeController.getContactPage);

// Auth Routes
router.get('/login', authController.getLoginPage);
router.get('/register', authController.getRegisterPage);
router.get('/forgot-password', authController.getForgotPasswordPage);
router.get('/reset-password/:token', authController.getResetPasswordPage);

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/recovery-reset', authController.resetByRecoveryKey);
router.get('/logout', authController.logout);

// Social Auth Routes
const passport = require('passport');
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: req.user.id, role: req.user.role }, process.env.JWT_SECRET || 'kwafer_super_secret_key_123', { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/');
});

// Phone Verification Routes
router.get('/verify-phone', authController.getVerifyPhonePage);
router.post('/verify-phone', authController.verifyPhone);
router.post('/resend-otp', authController.resendOTP);

const bookingController = require('../controllers/booking.controller');
const reviewController = require('../controllers/review.controller');

// Protected User Routes
router.get('/bookings', protect, homeController.getBookingsPage);
router.post('/bookings', protect, bookingController.createBooking);
router.post('/bookings/cancel/:id', protect, bookingController.cancelBooking);
router.post('/bookings/delete/:id', protect, bookingController.deleteBooking);
router.post('/bookings/clear', protect, bookingController.clearHistory);
router.post('/reviews', protect, reviewController.addReview);

const dashboardController = require('../controllers/dashboard.controller');
const notificationController = require('../controllers/notification.controller');
const upload = require('../config/multer');

// Notification Routes
router.post('/notifications/mark-all-read', protect, notificationController.markAllRead);
router.post('/notifications/mark-read/:id', protect, notificationController.markRead);
router.post('/notifications/delete/:id', protect, notificationController.deleteNotification);

// Dashboard Routes - Owner
router.get('/dashboard/owner', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerDashboard);
router.post('/dashboard/owner/profile', protect, restrictTo('owner', 'admin'), checkSubscription, upload.fields([{ name: 'salon_image', maxCount: 1 }, { name: 'avatar_image', maxCount: 1 }]), dashboardController.updateSalonProfile);
router.get('/dashboard/owner/services', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerServices);
router.post('/dashboard/owner/services', protect, restrictTo('owner', 'admin'), checkSubscription, upload.single('service_image'), dashboardController.addService);
router.post('/dashboard/owner/services/update/:id', protect, restrictTo('owner', 'admin'), checkSubscription, upload.single('service_image'), dashboardController.updateService);
router.post('/dashboard/owner/services/delete/:id', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.deleteService);

router.get('/dashboard/owner/bookings', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerBookings);
router.post('/dashboard/owner/bookings/status/:id', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.updateBookingStatus);

router.get('/dashboard/owner/offers', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerOffers);
router.post('/dashboard/owner/offers', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.addOffer);
router.post('/dashboard/owner/offers/delete/:id', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.deleteOffer);

router.post('/dashboard/owner/bookings/delete/:id', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.deleteHistoryItem);
router.post('/dashboard/owner/bookings/clear', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.clearSalonHistory);

router.get('/dashboard/owner/reviews', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerReviews);
router.post('/dashboard/owner/reviews/reply/:id', protect, restrictTo('owner', 'admin'), checkSubscription, reviewController.replyToReview);
router.post('/dashboard/owner/reviews/delete/:id', protect, restrictTo('owner', 'admin'), checkSubscription, reviewController.deleteReview);
router.post('/dashboard/owner/reviews/status/:id', protect, restrictTo('owner', 'admin'), checkSubscription, reviewController.updateStatus);

router.get('/dashboard/owner/gallery', protect, restrictTo('owner', 'admin'), checkSubscription, homeController.getOwnerGallery);
router.post('/dashboard/owner/gallery', protect, restrictTo('owner', 'admin'), checkSubscription, upload.single('gallery_image'), dashboardController.addGalleryImage);
router.post('/dashboard/owner/gallery/delete/:id', protect, restrictTo('owner', 'admin'), checkSubscription, dashboardController.deleteGalleryImage);

// Dashboard Routes - Admin
router.get('/dashboard/admin', protect, restrictTo('admin'), homeController.getAdminDashboard);
router.get('/dashboard/admin/salons', protect, restrictTo('admin'), homeController.getAdminSalons);
router.get('/dashboard/admin/history', protect, restrictTo('admin'), homeController.getAdminHistory);
router.post('/dashboard/admin/history/delete/:id', protect, restrictTo('admin'), dashboardController.deleteHistoryItem);
router.post('/dashboard/admin/history/clear', protect, restrictTo('admin'), dashboardController.clearAllHistory);
router.post('/dashboard/admin/salons/status/:id', protect, restrictTo('admin'), dashboardController.toggleSalonStatus);
router.post('/dashboard/admin/salons/featured/:id', protect, restrictTo('admin'), dashboardController.toggleSalonFeatured);
router.post('/dashboard/admin/salons/delete/:id', protect, restrictTo('admin'), dashboardController.deleteSalon);
router.get('/dashboard/admin/users', protect, restrictTo('admin'), homeController.getAdminUsers);
router.get('/dashboard/admin/subscriptions', protect, restrictTo('admin'), homeController.getAdminSubscriptions);
router.post('/dashboard/admin/subscriptions/gift', protect, restrictTo('admin'), dashboardController.giftSubscriptionDays);
router.post('/dashboard/admin/subscriptions/cancel', protect, restrictTo('admin'), dashboardController.cancelSubscription);
router.post('/dashboard/admin/subscriptions/extend', protect, restrictTo('admin'), dashboardController.extendSubscription);
router.post('/dashboard/admin/users/delete/:id', protect, restrictTo('admin'), dashboardController.deleteUser);
router.post('/dashboard/admin/impersonate/:userId', protect, restrictTo('admin'), authController.impersonateUser);
// Use subscriptionController for request/approval
const subscriptionController = require('../controllers/subscription.controller');
router.get('/dashboard/admin/subscription/requests', protect, restrictTo('admin'), subscriptionController.getSubscriptionRequests);
router.post('/dashboard/admin/subscription/approve/:requestId', protect, restrictTo('admin'), subscriptionController.approveSubscription);
router.post('/dashboard/admin/subscription/reject/:requestId', protect, restrictTo('admin'), subscriptionController.rejectSubscription);

// Subscription Requests Owner
router.get('/dashboard/owner/subscription', protect, restrictTo('owner', 'admin'), subscriptionController.getOwnerSubscription);
router.post('/dashboard/owner/subscription/request', protect, restrictTo('owner', 'admin'), subscriptionController.requestSubscription);

// Admin Settings & CMS
router.get('/dashboard/admin/settings', protect, restrictTo('admin'), dashboardController.getAdminSettings);
router.post('/dashboard/admin/settings', protect, restrictTo('admin'), dashboardController.updateAdminSettings);
router.get('/dashboard/admin/pages/edit/:slug', protect, restrictTo('admin'), dashboardController.getAdminEditPage);
router.post('/dashboard/admin/pages/edit/:slug', protect, restrictTo('admin'), dashboardController.updateAdminPage);

// Default redirect
router.get('/dashboard', protect, (req, res) => {
    if (req.user.role === 'admin') return res.redirect('/dashboard/admin');
    if (req.user.role === 'owner') return res.redirect('/dashboard/owner');
    res.redirect('/');
});

module.exports = router;
