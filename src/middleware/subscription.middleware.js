const db = require('../database/db');

exports.checkSubscription = async (req, res, next) => {
    // Admin is exempt
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Only check for owners
    if (req.user && req.user.role === 'owner') {
        try {
            const result = await db.query(
                `SELECT subscription_end, is_active FROM salons WHERE owner_id = $1`,
                [req.user.id]
            );

            if (result.rows.length === 0) {
                // User has no salon yet? Allow them to proceed to create one or handle elsewhere
                return next();
            }

            const salon = result.rows[0];

            // 1. Check for Active Status (Ban check)
            if (salon.is_active === false) {
                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    return res.status(403).json({
                        error: 'account_banned',
                        message: 'تم إيقاف حساب الصالون الخاص بك. يرجى التواصل مع الإدارة.'
                    });
                }
                // Render a Banned page or logout
                return res.render('pages/dashboard/owner/banned', {
                    user: req.user,
                    title: 'الحساب موقوف'
                });
            }

            // 2. Check Subscription
            const expiry = salon.subscription_end;
            if (!expiry || new Date(expiry) < new Date()) {
                // Subscription expired
                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    return res.status(403).json({
                        error: 'subscription_expired',
                        message: 'انتهت فترة الاشتراك الخاصة بك. يرجى التواصل مع الإدارة للتجديد.'
                    });
                }
                return res.render('pages/dashboard/owner/subscription-expired', {
                    user: req.user,
                    title: 'انتهى الاشتراك'
                });
            }

            // Pass salon info to request if needed later
            req.salon = salon;

        } catch (error) {
            console.error('Subscription Check Error:', error);
            // In case of error, maybe let them pass or show 500? Safest is to let pass or log.
            // But for security/billing, maybe block. Let's log and block for now to be safe.
            return res.status(500).send('خطأ في التحقق من الاشتراك');
        }
    }

    next();
};
