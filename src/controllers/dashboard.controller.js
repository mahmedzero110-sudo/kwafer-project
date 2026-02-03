const Service = require('../models/Service');
const Offer = require('../models/Offer');
const Booking = require('../models/Booking');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Gallery = require('../models/Gallery');
const Notification = require('../models/Notification');

// ... (existing code checks)

exports.toggleSalonStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const salon = await Salon.getById(id);

        if (!salon) return res.status(404).send('Salon not found');

        const newStatus = !salon.is_active;
        await Salon.toggleStatus(id);

        // If salon is being deactivated (banned), send notification
        if (newStatus === false) {
            const Notification = require('../models/Notification');
            await Notification.create({
                user_id: salon.owner_id,
                title: 'تنبيه: تم إيقاف حساب الصالون',
                message: 'تم إيقاف ظهور الصالون في البحث مؤقتاً من قبل الإدارة. يرجى مراجعة سياسات الاستخدام أو التواصل مع الدعم الفني.',
                type: 'error'
            });
        }

        req.flash('success', newStatus ? 'تم تفعيل الصالون بنجاح' : 'تم إيقاف (حظر) الصالون بنجاح');
        res.redirect('/dashboard/admin/salons');
    } catch (error) {
        console.error('Toggle Status Error:', error);
        res.status(500).send('Error updating salon status');
    }
};

exports.toggleSalonFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        await Salon.toggleFeatured(id);
        res.redirect('/dashboard/admin/salons');
    } catch (error) {
        res.status(500).send('Error updating salon featured status');
    }
};

exports.deleteSalon = async (req, res) => {
    try {
        const { id } = req.params;
        await Salon.delete(id);
        req.flash('success', 'تم حذف الصالون وجميع بياناته بنجاح');
        res.redirect('/dashboard/admin/salons');
    } catch (error) {
        console.error('Delete Salon Error:', error);
        res.status(500).send('حدث خطأ أثناء حذف الصالون');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (req.user.id === id) {
            req.flash('error', 'لا يمكنك حذف حسابك الشخصي!');
            return res.redirect('/dashboard/admin/users');
        }

        await User.delete(id);
        req.flash('success', 'تم حذف المستخدم بنجاح');
        res.redirect('/dashboard/admin/users');
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).send('Error deleting user');
    }
};

// Service Actions
exports.addService = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) {
            req.flash('error', 'الصالون غير موجود');
            return res.redirect('back');
        }

        const { name, description, price, duration, icon } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        await Service.create({
            salon_id: salon.id,
            name,
            description,
            price,
            duration,
            icon,
            image_url
        });

        req.flash('success', 'تم إضافة الخدمة بنجاح');
        res.redirect('/dashboard/owner/services');
    } catch (error) {
        console.error('Add Service Error:', error);
        req.flash('error', 'حدث خطأ أثناء إضافة الخدمة');
        res.redirect('back');
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await Service.delete(id);
        req.flash('success', 'تم حذف الخدمة بنجاح');
        res.redirect('/dashboard/owner/services');
    } catch (error) {
        console.error('Delete Service Error:', error);
        res.status(500).send('Error deleting service');
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, duration, icon } = req.body;
        const updateData = { name, description, price, duration, icon };

        if (req.file) {
            updateData.image_url = `/uploads/${req.file.filename}`;
        }

        await Service.update(id, updateData);
        req.flash('success', 'تم تحديث الخدمة بنجاح');
        res.redirect('/dashboard/owner/services');
    } catch (error) {
        console.error('Update Service Error:', error);
        req.flash('error', 'حدث خطأ أثناء تحديث الخدمة');
        res.redirect('back');
    }
};

// Booking Actions
exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await Booking.updateStatus(id, status);
        res.redirect('/dashboard/owner/bookings');
    } catch (error) {
        res.status(500).send('Error updating booking');
    }
};

// Offer Actions
exports.addOffer = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) return res.status(404).send('Salon not found');

        const { title, description, discount, price, valid_until } = req.body;
        await Offer.create({
            salon_id: salon.id,
            title,
            description,
            discount,
            price,
            valid_until
        });

        req.flash('success', 'تم إضافة العرض بنجاح');
        res.redirect('/dashboard/owner/offers');
    } catch (error) {
        console.error('Add Offer Error:', error);
        res.status(500).send('Error adding offer');
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        await Offer.delete(id);
        req.flash('success', 'تم حذف العرض بنجاح');
        res.redirect('/dashboard/owner/offers');
    } catch (error) {
        console.error('Delete Offer Error:', error);
        res.status(500).send('Error deleting offer');
    }
};

// Gallery Actions
exports.addGalleryImage = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) return res.status(404).send('Salon not found');

        if (!req.file) {
            req.flash('error', 'يرجى اختيار صورة');
            return res.redirect('back');
        }

        const existingGallery = await Gallery.getBySalonId(salon.id);
        if (existingGallery && existingGallery.length >= 4) {
            req.flash('error', 'عذراً، يمكنك رفع 4 صور فقط في معرض الصور حالياً.');
            return res.redirect('back');
        }

        const image_url = `/uploads/${req.file.filename}`;
        const { caption } = req.body;

        await Gallery.addImage({
            salon_id: salon.id,
            image_url,
            caption
        });

        req.flash('success', 'تم إضافة الصورة للمعرض بنجاح');
        res.redirect('/dashboard/owner/gallery');
    } catch (error) {
        console.error('Add Gallery Image Error:', error);
        res.status(500).send('Error adding image');
    }
};

exports.deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) return res.status(404).send('Salon not found');

        await Gallery.delete(id, salon.id);
        req.flash('success', 'تم حذف الصورة من المعرض');
        res.redirect('/dashboard/owner/gallery');
    } catch (error) {
        console.error('Delete Gallery Image Error:', error);
        res.status(500).send('Error deleting image');
    }
};

// Settings & CMS
exports.getAdminSettings = async (req, res) => {
    try {
        const Settings = require('../models/Settings');
        const settings = await Settings.getAll();
        const pages = await Settings.getAllPages();

        res.render('pages/dashboard/admin/settings', {
            title: 'إعدادات المنصة',
            settings,
            pages
        });
    } catch (error) {
        console.error('Settings Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.updateAdminSettings = async (req, res) => {
    try {
        const Settings = require('../models/Settings');
        const updates = req.body;

        for (const [key, value] of Object.entries(updates)) {
            await Settings.update(key, value);
        }

        req.flash('success', 'تم تحديث الإعدادات بنجاح');
        res.redirect('/dashboard/admin/settings');
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.getAdminEditPage = async (req, res) => {
    try {
        const Settings = require('../models/Settings');
        const page = await Settings.getPage(req.params.slug);

        if (!page) return res.status(404).send('Page not found');

        res.render('pages/dashboard/admin/edit-page', {
            title: `تعديل صفحة: ${page.title_ar}`,
            page
        });
    } catch (error) {
        console.error('Edit Page Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.updateAdminPage = async (req, res) => {
    try {
        const Settings = require('../models/Settings');
        const { slug } = req.params;
        await Settings.updatePage(slug, req.body);

        req.flash('success', 'تم تحديث محتوى الصفحة بنجاح');
        res.redirect('/dashboard/admin/settings');
    } catch (error) {
        console.error('Update Page Error:', error);
        res.status(500).send('Server Error');
    }
};

exports.updateSalonProfile = async (req, res) => {
    try {
        const ownerId = req.user.id;
        let salon = await Salon.getByOwnerId(ownerId);

        // If salon doesn't exist, create it first
        if (!salon) {
            const db = require('../database/db');
            const {
                name, description, location, phone, email, booking_policy,
                bridal_title, bridal_desc, bridal_discount, bridal_price, bridal_services,
                google_maps_url, price_start_manual, working_hours
            } = req.body;

            const salonImageUrl = req.files && req.files['salon_image'] ? `/uploads/${req.files['salon_image'][0].filename}` : '/uploads/default-salon.jpg';
            const avatarUrl = req.files && req.files['avatar_image'] ? `/uploads/${req.files['avatar_image'][0].filename}` : null;

            const query = `
                INSERT INTO salons (
                    owner_id, name, description, location, phone, email, image_url, 
                    booking_policy, bridal_title, bridal_desc, bridal_discount, 
                    bridal_price, bridal_services, google_maps_url, price_start_manual,
                    working_hours, 
                    subscription_start, subscription_end, subscription_status
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'trial'
                )
                RETURNING *
            `;
            const { rows } = await db.query(query, [
                ownerId,
                name || 'صالون جديد',
                description || 'صالون تجميل متميز',
                location || 'الأقصر',
                phone || '',
                email || req.user.email,
                salonImageUrl,
                booking_policy || 'نرجو الالتزام بالموعد المحدد. في حالة التأخير لأكثر من 15 دقيقة، يحق للصالون إلغاء الحجز.',
                bridal_title || null,
                bridal_desc || null,
                bridal_discount ? parseFloat(bridal_discount) : 0,
                bridal_price ? parseFloat(bridal_price) : 0,
                bridal_services || null,
                google_maps_url || null,
                price_start_manual ? parseFloat(price_start_manual) : 100,
                working_hours || 'السبت - الخميس: 9ص - 10م'
            ]);
            salon = rows[0];

            if (avatarUrl) {
                await User.updateAvatar(ownerId, avatarUrl);
            }

            // Create Welcome Notification
            await Notification.create({
                user_id: ownerId,
                title: '🎉 مبارك! تم إنشاء صالونك بنجاح',
                message: 'لقد بدأتِ رحلتكِ معنا! يمكنكِ الآن إضافة الخدمات والعروض لجذب العميلات.',
                type: 'success'
            });

            req.flash('success', 'تم إنشاء الصالون وحفظ البيانات بنجاح');
        } else {
            // Update existing salon
            const updateData = { ...req.body };

            if (req.files && req.files['salon_image']) {
                updateData.image_url = `/uploads/${req.files['salon_image'][0].filename}`;
            }

            if (req.files && req.files['avatar_image']) {
                const avatarUrl = `/uploads/${req.files['avatar_image'][0].filename}`;
                await User.updateAvatar(ownerId, avatarUrl);
            }

            await Salon.update(salon.id, updateData);

            req.flash('success', 'تم تحديث البيانات بنجاح');
        }

        res.redirect('/dashboard/owner');
    } catch (error) {
        console.error('Update Salon Error:', error);
        req.flash('error', 'حدث خطأ أثناء حفظ البيانات');
        res.redirect(req.get('Referrer') || '/dashboard/owner');
    }
};

exports.extendSubscription = async (req, res) => {
    try {
        const { userId, days, plan } = req.body;
        let finalDays = parseInt(days) || 0;

        if (plan) {
            switch (plan) {
                case 'month': finalDays = 30; break;
                case '3months': finalDays = 90; break;
                case '6months': finalDays = 180; break;
                case 'year': finalDays = 365; break;
            }
        }

        if (finalDays > 0) {
            await User.addSubscriptionDays(userId, finalDays);
            req.flash('success', `تم تمديد الاشتراك بنجاح لمدة ${finalDays} يوم`);
        } else {
            req.flash('error', 'يرجى اختيار مدة صحيحة');
        }

        res.redirect('back');
    } catch (error) {
        console.error('Extend Subscription Error:', error);
        req.flash('error', 'حدث خطأ أثناء تمديد الاشتراك');
        res.redirect('back');
    }
};

// Gift subscription days to a salon
exports.giftSubscriptionDays = async (req, res) => {
    try {
        const { salon_id, days, note } = req.body;
        const daysToAdd = parseInt(days);

        if (!salon_id || !daysToAdd || daysToAdd < 1) {
            req.flash('error', 'بيانات غير صحيحة');
            return res.redirect('/dashboard/admin/subscriptions');
        }

        const db = require('../database/db');

        // Get current salon data
        const salonResult = await db.query(
            'SELECT subscription_end, bonus_days, owner_id FROM salons WHERE id = $1',
            [salon_id]
        );

        if (salonResult.rows.length === 0) {
            req.flash('error', 'الصالون غير موجود');
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

        // Send notification to salon owner
        await Notification.create({
            user_id: salon.owner_id,
            title: '🎁 هدية اشتراك من الإدارة!',
            message: `تم إضافة ${daysToAdd} يوم إلى اشتراكك كهدية من فريق كوافير. ${note ? 'السبب: ' + note : ''}`,
            type: 'success'
        });

        req.flash('success', `تم إهداء ${daysToAdd} يوم بنجاح!`);
        res.redirect('/dashboard/admin/subscriptions');
    } catch (error) {
        console.error('Error gifting days:', error);
        req.flash('error', 'حدث خطأ أثناء إهداء الأيام');
        res.redirect('/dashboard/admin/subscriptions');
    }
};

// Cancel subscription for a salon
exports.cancelSubscription = async (req, res) => {
    try {
        const { salon_id } = req.body;

        if (!salon_id) {
            req.flash('error', 'بيانات غير صحيحة');
            return res.redirect('/dashboard/admin/subscriptions');
        }

        const db = require('../database/db');

        // Get current salon data
        const salonResult = await db.query(
            'SELECT owner_id, name FROM salons WHERE id = $1',
            [salon_id]
        );

        if (salonResult.rows.length === 0) {
            req.flash('error', 'الصالون غير موجود');
            return res.redirect('/dashboard/admin/subscriptions');
        }

        const salon = salonResult.rows[0];

        // Update subscription to expired (yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await db.query(
            `UPDATE salons 
             SET subscription_end = $1, 
                 subscription_status = 'expired'
             WHERE id = $2`,
            [yesterday, salon_id]
        );

        // Send notification to salon owner
        await Notification.create({
            user_id: salon.owner_id,
            title: '⚠️ تنبيه: إلغاء الاشتراك',
            message: `تم إلغاء اشتراكك بواسطة إدارة الموقع. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.`,
            type: 'error'
        });

        req.flash('success', `تم إلغاء اشتراك صالون ${salon.name} بنجاح`);
        res.redirect('/dashboard/admin/subscriptions');
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        req.flash('error', 'حدث خطأ أثناء إلغاء الاشتراك');
        res.redirect('/dashboard/admin/subscriptions');
    }
};

// Admin History Actions
exports.deleteHistoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        await Booking.softDelete(id, req.user.role);
        req.flash('success', 'تم حذف السجل بنجاح');

        if (req.user.role === 'admin') {
            res.redirect('/dashboard/admin/history');
        } else {
            res.redirect('/dashboard/owner/bookings');
        }
    } catch (error) {
        console.error('Delete History Item Error:', error);
        req.flash('error', 'حدث خطأ أثناء حذف السجل');
        res.redirect('back');
    }
};

exports.clearAllHistory = async (req, res) => {
    try {
        await Booking.deleteAll();
        req.flash('success', 'تم مسح السجل بالكامل بنجاح');
        res.redirect('/dashboard/admin/history');
    } catch (error) {
        console.error('Clear All History Error:', error);
        req.flash('error', 'حدث خطأ أثناء مسح السجل');
        res.redirect('/dashboard/admin/history');
    }
};

exports.clearSalonHistory = async (req, res) => {
    try {
        const salon = await Salon.getByOwnerId(req.user.id);
        if (!salon) return res.status(404).send('Salon not found');

        await Booking.deleteBySalon(salon.id);
        req.flash('success', 'تم مسح سجل الحجوزات بنجاح');
        res.redirect('/dashboard/owner/bookings');
    } catch (error) {
        console.error('Clear Salon History Error:', error);
        req.flash('error', 'حدث خطأ أثناء مسح السجل');
        res.redirect('/dashboard/owner/bookings');
    }
};


