const Booking = require('../models/Booking');
const Joi = require('joi');

exports.createBooking = async (req, res) => {
    try {
        const schema = Joi.object({
            salon_id: Joi.string().uuid().required(),
            service_id: Joi.string().required(),
            booking_date: Joi.date().required(),
            booking_time: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)(:?([0-5]\d))?$/).allow('', null),
            phone: Joi.string().required(),
            customer_name: Joi.string().required(),
            amount: Joi.number().min(0).required(),
            notes: Joi.string().allow('', null)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            console.error('Validation Error:', error.details);
            req.flash('error', 'بيانات الحجز غير صحيحة. يرجى التأكد من التاريخ ورقم الهاتف');
            return res.redirect('back');
        }

        let { salon_id, service_id, booking_date, booking_time, phone, customer_name, amount, notes } = req.body;
        const customer_id = req.user.id;

        // Default time if not provided
        if (!booking_time) booking_time = '00:00:00';

        // Add contact info to notes
        const contactInfo = `الاسم في الحجز: ${customer_name}\nرقم للتواصل: ${phone}`;
        notes = notes ? `${notes}\n${contactInfo}` : contactInfo;

        // Handle Bridal Package
        if (typeof service_id === 'string' && service_id.startsWith('bridal-')) {
            notes = (notes ? notes + '\n' : '') + 'الحجز: باقة العروس';
            service_id = null;
        }

        await Booking.create({
            customer_id,
            salon_id,
            service_id,
            booking_date,
            booking_time,
            amount: parseInt(amount),
            notes
        });

        req.flash('success', 'تم تسجيل طلب الحجز بنجاح! سيتم الاتصال بكِ لتحديد أقرب وقت للحصول على الخدمة');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Create Booking Error:', error);
        req.flash('error', 'عذراً، حدث خطأ أثناء الحجز. يرجى المحاولة لاحقاً');
        res.redirect('back');
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const customer_id = req.user.id;

        // Verify booking ownership
        const query = 'SELECT * FROM bookings WHERE id = $1 AND customer_id = $2';
        const { rows } = await (require('../database/db')).query(query, [id, customer_id]);

        if (rows.length === 0) {
            req.flash('error', 'لا يمكنك إلغاء هذا الحجز');
            return res.redirect('back');
        }

        const booking = rows[0];
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            req.flash('error', 'لا يمكن إلغاء حجز مكتمل أو ملغي بالفعل');
            return res.redirect('back');
        }

        await Booking.updateStatus(id, 'cancelled');

        req.flash('success', 'تم إلغاء الحجز بنجاح');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        req.flash('error', 'حدث خطأ أثناء إلغاء الحجز');
        res.redirect('back');
    }
};
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.getById(id);

        if (!booking || booking.customer_id !== req.user.id) {
            req.flash('error', 'غير مسموح لك بحذف هذا السجل');
            return res.redirect('back');
        }

        await Booking.softDelete(id, 'customer');
        req.flash('success', 'تم حذف السجل بنجاح');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Delete Booking Error:', error);
        req.flash('error', 'حدث خطأ أثناء حذف السجل');
        res.redirect('back');
    }
};

exports.clearHistory = async (req, res) => {
    try {
        await Booking.deleteByCustomer(req.user.id);
        req.flash('success', 'تم مسح السجل بنجاح');
        res.redirect('/bookings');
    } catch (error) {
        console.error('Clear History Error:', error);
        req.flash('error', 'حدث خطأ أثناء مسح السجل');
        res.redirect('back');
    }
};
