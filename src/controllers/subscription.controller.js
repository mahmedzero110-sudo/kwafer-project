const db = require('../database/db');

// Get all salons with subscription info for admin
exports.getSubscriptions = async (req, res) => {
    try {
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
            salons,
            stats,
            user: req.user,
            siteSettings: req.app.locals.siteSettings || {}
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).send('حدث خطأ في تحميل الاشتراكات');
    }
};

// Gift days to a salon
exports.giftDays = async (req, res) => {
    try {
        const { salon_id, days, note } = req.body;
        const daysToAdd = parseInt(days);

        if (!salon_id || !daysToAdd || daysToAdd < 1) {
            req.session.error = 'بيانات غير صحيحة';
            return res.redirect('/dashboard/admin/subscriptions');
        }

        // Get current salon data
        const salonResult = await db.query(
            'SELECT subscription_end, bonus_days FROM salons WHERE id = $1',
            [salon_id]
        );

        if (salonResult.rows.length === 0) {
            req.session.error = 'الصالون غير موجود';
            return res.redirect('/dashboard/admin/subscriptions');
        }

        const salon = salonResult.rows[0];
        const currentEnd = new Date(salon.subscription_end);
        const newEnd = new Date(currentEnd.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        const newBonusDays = (salon.bonus_days || 0) + daysToAdd;

        // Update subscription
        await db.query(
            `UPDATE salons 
             SET subscription_end = $1, 
                 bonus_days = $2,
                 subscription_status = CASE 
                     WHEN $1 > CURRENT_DATE THEN 'active'
                     ELSE subscription_status
                 END
             WHERE id = $3`,
            [newEnd, newBonusDays, salon_id]
        );

        // Log the gift (optional - you can create a gifts table if needed)
        // await db.query(
        //     'INSERT INTO subscription_gifts (salon_id, admin_id, days, note) VALUES ($1, $2, $3, $4)',
        //     [salon_id, req.session.user.id, daysToAdd, note]
        // );

        req.session.success = `تم إهداء ${daysToAdd} يوم بنجاح!`;
        res.redirect('/dashboard/admin/subscriptions');
    } catch (error) {
        console.error('Error gifting days:', error);
        req.session.error = 'حدث خطأ أثناء إهداء الأيام';
        res.redirect('/dashboard/admin/subscriptions');
    }
};

// Get subscription info for salon owner
exports.getOwnerSubscription = async (req, res) => {
    try {
        const salonResult = await db.query(
            'SELECT * FROM salons WHERE owner_id = $1',
            [req.user.id]
        );

        if (salonResult.rows.length === 0) {
            req.flash('error', 'املاء بيانات الصالون لتستطيع تجديد الاشتراك');
            return res.redirect('/dashboard/owner');
        }

        const salon = salonResult.rows[0];

        // Check for pending request directly
        const pendingResult = await db.query(
            'SELECT * FROM subscription_requests WHERE user_id = $1 AND status = \'pending\' ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        res.render('pages/dashboard/owner/subscription', {
            salon,
            user: req.user,
            siteSettings: req.app.locals.siteSettings || {},
            pendingRequest: pendingResult.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).send('حدث خطأ في تحميل معلومات الاشتراك');
    }
};

// Request a subscription plan
exports.requestSubscription = async (req, res) => {
    try {
        const { plan_type } = req.body;

        if (!plan_type) {
            req.session.error = 'الرجاء اختيار خطة اشتراك';
            return res.redirect('/dashboard/owner/subscription');
        }

        // Check if there is already a pending request
        const existingRequest = await db.query(
            'SELECT * FROM subscription_requests WHERE user_id = $1 AND status = \'pending\'',
            [req.user.id]
        );

        if (existingRequest.rows.length > 0) {
            req.session.error = 'لديك طلب اشتراك قيد الانتظار بالفعل';
            return res.redirect('/dashboard/owner/subscription');
        }

        const SubscriptionRequest = require('../models/SubscriptionRequest');
        await SubscriptionRequest.create({
            user_id: req.user.id,
            plan_type
        });

        req.flash('success', 'تم استلام طلب الاشتراك بنجاح! 🚀\nلقد تم إرسال طلبك إلى إدارة الموقع للمراجعة. سيتم التواصل معكِ فور الدفع أو الموافقة على الطلب لتفعيل الباقة المختارة.');
        res.redirect('/dashboard/owner/subscription');
    } catch (error) {
        console.error('Error requesting subscription:', error);
        req.session.error = 'حدث خطأ أثناء إرسال الطلب';
        res.redirect('/dashboard/owner/subscription');
    }
};

// Get requests for admin
exports.getSubscriptionRequests = async (req, res) => {
    try {
        const SubscriptionRequest = require('../models/SubscriptionRequest');
        const requests = await SubscriptionRequest.getAllPending();

        // Use existing method logic to get the full dashboard data if needed, or just render the partial view
        // For now, let's reuse the admin subscriptions page but pass requests

        // This likely needs to be integrated into homeController.getAdminSubscriptions 
        // OR we create a new page. Let's create a new route/page for clarity or add to existing.
        // User asked to approve from control panel.

        res.render('pages/dashboard/admin/subscription_requests', {
            requests,
            user: req.user,
            siteSettings: req.app.locals.siteSettings || {}
        });
    } catch (error) {
        console.error('Error fetching subscription requests:', error);
        res.status(500).send('خطأ في الخادم');
    }
};

// Approve subscription request
exports.approveSubscription = async (req, res) => {
    try {
        const { requestId } = req.params;
        const SubscriptionRequest = require('../models/SubscriptionRequest');

        const request = await SubscriptionRequest.getById(requestId);
        if (!request) {
            req.session.error = 'الطلب غير موجود';
            return res.redirect('/dashboard/admin/subscriptions');
        }

        // Update User/Salon subscription
        // We need to find the salon associated with the user
        const salonResult = await db.query('SELECT * FROM salons WHERE owner_id = $1', [request.user_id]);

        if (salonResult.rows.length === 0) {
            req.session.error = 'لم يتم العثور على صالون لهذا المستخدم';
            // Mark as rejected or handle error?
            return res.redirect('/dashboard/admin/subscriptions');
        }

        const salon = salonResult.rows[0];

        // Calculate new end date based on plan_type
        let daysToAdd = 30;
        if (request.plan_type === '3months') daysToAdd = 90;
        if (request.plan_type === '6months') daysToAdd = 180;
        if (request.plan_type === 'yearly') daysToAdd = 365;

        // Don't forget checking current end date.
        // If current date < subscription_end, add to subscription_end.
        // Else add to NOW()

        const currentEnd = new Date(salon.subscription_end || Date.now());
        const baseDate = currentEnd > new Date() ? currentEnd : new Date();
        const newEnd = new Date(baseDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

        // Update Salon
        await db.query(
            `UPDATE salons 
             SET subscription_end = $1, 
                 subscription_status = 'active',
                 subscription_plan = $2
             WHERE id = $3`,
            [newEnd, request.plan_type, salon.id]
        );

        // Update Request Status
        await SubscriptionRequest.updateStatus(requestId, 'approved');

        req.session.success = 'تم تفعيل الاشتراك بنجاح';
        res.redirect('/dashboard/admin/subscriptions'); // or back to requests
    } catch (error) {
        console.error('Error approving subscription:', error);
        req.session.error = 'حدث خطأ أثناء تفعيل الاشتراك';
        res.redirect('/dashboard/admin/subscriptions');
    }
};

// Reject subscription request
exports.rejectSubscription = async (req, res) => {
    try {
        const { requestId } = req.params;
        const SubscriptionRequest = require('../models/SubscriptionRequest');

        await SubscriptionRequest.updateStatus(requestId, 'rejected');

        req.session.success = 'تم رفض الطلب';
        res.redirect('/dashboard/admin/subscriptions');
    } catch (error) {
        console.error('Error rejecting subscription:', error);
        req.session.error = 'حدث خطأ أثناء رفض الطلب';
        res.redirect('/dashboard/admin/subscriptions');
    }
};

module.exports = exports;
