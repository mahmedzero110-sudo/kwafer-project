const Review = require('../models/Review');
const Joi = require('joi');

exports.addReview = async (req, res) => {
    try {
        const schema = Joi.object({
            salon_id: Joi.string().uuid().required(),
            service_id: Joi.string().uuid().allow(null, ''),
            rating: Joi.number().min(1).max(5).required(),
            comment: Joi.string().allow('', null)
        });

        const { error } = schema.validate(req.body);
        if (error) {
            req.flash('error', 'البيانات المدخلة غير صحيحة. يرجى اختيار التقييم');
            return res.redirect('back');
        }

        const { salon_id, service_id, rating, comment } = req.body;
        const customer_id = req.user.id;

        await Review.create({
            customer_id,
            salon_id,
            service_id: service_id || null,
            rating,
            comment
        });

        req.flash('success', 'شكراً لتقييمك! تم حفظ رأيك بنجاح');
        res.redirect('back');
    } catch (error) {
        console.error('Add Review Error:', error);
        req.flash('error', 'حدث خطأ أثناء إضافة التقييم');
        res.redirect('back');
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user.id;

        await Review.delete(id, ownerId);

        req.flash('success', 'تم حذف التقييم بنجاح');
        res.redirect('back');
    } catch (error) {
        console.error('Delete Review Error:', error);
        req.flash('error', 'حدث خطأ أثناء حذف التقييم');
        res.redirect('back');
    }
};

exports.replyToReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const ownerId = req.user.id;

        await Review.updateReply(id, ownerId, reply);

        req.flash('success', 'تم إرسال الرد بنجاح');
        res.redirect('back');
    } catch (error) {
        console.error('Reply Review Error:', error);
        req.flash('error', 'حدث خطأ أثناء الرد على التقييم');
        res.redirect('back');
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const ownerId = req.user.id;

        await Review.updateStatus(id, ownerId, status);

        req.flash('success', 'تم تحديث حالة التقييم');
        res.redirect('back');
    } catch (error) {
        console.error('Status Update Error:', error);
        req.flash('error', 'حدث خطأ أثناء تحديث الحالة');
        res.redirect('back');
    }
};
