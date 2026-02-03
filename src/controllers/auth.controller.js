const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');

const JWT_SECRET = process.env.JWT_SECRET || 'kwafer_super_secret_key_123';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTP = async (phone, code) => {
    // In a production app, integrate with an SMS gateway like Twilio or Vonage
    console.log(`[OTP] Sending code ${code} to ${phone}`);
    return true;
};

exports.register = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(50).required().messages({
                'string.min': 'الاسم يجب أن يكون 3 أحرف على الأقل',
                'any.required': 'الاسم مطلوب'
            }),
            email: Joi.string().email().required().messages({
                'string.email': 'البريد الإلكتروني غير صالح',
                'any.required': 'البريد الإلكتروني مطلوب'
            }),
            password: Joi.string().min(6).required().messages({
                'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                'any.required': 'كلمة المرور مطلوبة'
            }),
            phone: Joi.string().min(8).required().messages({
                'string.min': 'رقم الهاتف غير صحيح',
                'any.required': 'رقم الهاتف مطلوب'
            }),
            phone_input: Joi.any().optional(),
            role: Joi.string().valid('customer', 'owner').required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/register');
        }

        const { name, email, password, phone, role } = req.body;

        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            req.flash('error', 'هذا البريد الإلكتروني مسجل بالفعل');
            return res.redirect('/register');
        }

        const existingPhone = await User.findByPhone(phone);
        if (existingPhone) {
            req.flash('error', 'رقم الهاتف هذا مسجل بالفعل بحساب آخر');
            return res.redirect('/register');
        }

        const user = await User.create({ name, email, password, phone, role });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Show recovery key to user
        req.flash('success', `تم إنشاء الحساب بنجاح! مفتاح الاستعادة الخاص بكِ هو: [ ${user.recovery_key} ]. يرجى الاحتفاظ به لاستخدامه في حال نسيان كلمة السر.`);

        if (role === 'owner') return res.redirect('/dashboard/owner');
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'حدث خطأ أثناء التسجيل، يرجى المحاولة لاحقاً');
        res.redirect('/register');
    }
};

exports.login = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required().messages({
                'string.email': 'البريد الإلكتروني غير صالح',
                'any.required': 'البريد الإلكتروني مطلوب'
            }),
            password: Joi.string().required().messages({
                'any.required': 'كلمة المرور مطلوبة'
            }),
            returnTo: Joi.string().allow('').optional()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/login');
        }

        const { email, password } = req.body;
        const user = await User.findByEmail(email);

        if (!user || !(await User.verifyPassword(password, user.password))) {
            req.flash('error', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
            return res.redirect('/login');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Skip phone verification check as requested

        req.flash('success', `مرحباً بكِ مرة أخرى، ${user.name}`);

        // Handle Return To URL
        if (req.body.returnTo && req.body.returnTo.startsWith('/')) {
            return res.redirect(req.body.returnTo);
        }

        if (user.role === 'admin') return res.redirect('/dashboard/admin');
        if (user.role === 'owner') return res.redirect('/dashboard/owner');
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'حدث خطأ أثناء تسجيل الدخول');
        res.redirect('/login');
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);

        if (!user) {
            req.flash('error', 'هذا البريد الإلكتروني غير مسجل لدينا');
            return res.redirect('/forgot-password');
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await User.setResetToken(email, token, expires);

        // In a real app, you would send an email here.
        // For now, we'll just show the link in a flash message for testing
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
        req.flash('success', `رابط استعادة كلمة السر (لأغراض التطوير): ${resetUrl}`);

        res.redirect('/forgot-password');
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).send('Error during password reset request');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            req.flash('error', 'كلمات السر غير متطابقة');
            return res.redirect(`/reset-password/${token}`);
        }

        const user = await User.findByResetToken(token);
        if (!user) {
            req.flash('error', 'رابط الاستعادة منتهي الصلاحية أو غير صالح');
            return res.redirect('/forgot-password');
        }

        await User.updatePassword(user.id, password);
        req.flash('success', 'تم تغيير كلمة السر بنجاح، يمكنك الآن تسجيل الدخول');
        res.redirect('/login');
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error', 'حدث خطأ أثناء تغيير كلمة السر');
        res.redirect('back');
    }
};

exports.resetByRecoveryKey = async (req, res) => {
    try {
        const { phone, recoveryKey, newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) {
            req.flash('error', 'كلمات السر غير متطابقة');
            return res.redirect('/forgot-password');
        }

        const user = await User.findByRecoveryKey(phone, recoveryKey);
        if (!user) {
            req.flash('error', 'رقم الهاتف أو مفتاح الاستعادة غير صحيح');
            return res.redirect('/forgot-password');
        }

        await User.updatePassword(user.id, newPassword);
        req.flash('success', 'تم إعادة تعيين كلمة السر بنجاح، يمكنكِ تسجيل الدخول الآن');
        res.redirect('/login');
    } catch (error) {
        console.error('Recovery Reset Error:', error);
        req.flash('error', 'حدث خطأ أثناء استعادة الحساب');
        res.redirect('/forgot-password');
    }
};

exports.getLoginPage = (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('pages/public/login', {
        title: 'تسجيل الدخول',
        returnTo: req.query.returnTo || ''
    });
};

exports.getRegisterPage = (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('pages/public/register', { title: 'إنشاء حساب جديد' });
};

exports.getForgotPasswordPage = (req, res) => {
    res.render('pages/public/forgot-password', { title: 'نسيت كلمة المرور' });
};

exports.getResetPasswordPage = (req, res) => {
    res.render('pages/public/reset-password', { title: 'إعادة تعيين كلمة المرور', token: req.params.token });
};

exports.getVerifyPhonePage = (req, res) => {
    if (!req.user) return res.redirect('/login');
    if (req.user.is_phone_verified) return res.redirect('/');
    res.render('pages/public/verify-phone', { title: 'تأكيد رقم الهاتف', phone: req.user.phone });
};

exports.verifyPhone = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user.id);

        if (user.phone_verification_code !== code) {
            req.flash('error', 'كود التحقق غير صحيح');
            return res.redirect('/verify-phone');
        }

        // Check if expired
        if (new Date() > new Date(user.phone_verification_expires)) {
            req.flash('error', 'كود التحقق منتهي الصلاحية، اطلب كوداً جديداً');
            return res.redirect('/verify-phone');
        }

        await User.verifyPhone(user.id);
        req.flash('success', 'تم تأكيد رقم الهاتف بنجاح! أهلاً بكِ');

        if (user.role === 'owner') return res.redirect('/dashboard/owner');
        res.redirect('/');
    } catch (error) {
        console.error('Phone Verification Error:', error);
        req.flash('error', 'حدث خطأ أثناء التأكيد');
        res.redirect('/verify-phone');
    }
};

exports.resendOTP = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const otp = generateOTP();
        const expires = new Date(Date.now() + 10 * 60000);
        await User.setPhoneVerificationCode(req.user.id, otp, expires);
        await sendOTP(req.user.phone, otp);

        req.flash('success', 'تم إرسال كود جديد');
        res.redirect('/verify-phone');
    } catch (error) {
        console.error('Resend OTP Error:', error);
        res.redirect('/verify-phone');
    }
};

exports.impersonateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure requester is admin (Double check though middleware handles it)
        if (req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized');
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            req.flash('error', 'المستخدم غير موجود');
            return res.redirect('back');
        }

        // Generate token for TARGET user
        const token = jwt.sign({ id: targetUser.id, role: targetUser.role }, JWT_SECRET, { expiresIn: '1h' });

        // Set Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        req.flash('success', `تم تسجيل الدخول بصلاحيات: ${targetUser.name}`);

        if (targetUser.role === 'owner') return res.redirect('/dashboard/owner');
        if (targetUser.role === 'admin') return res.redirect('/dashboard/admin');
        res.redirect('/');

    } catch (error) {
        console.error('Impersonation Error:', error);
        req.flash('error', 'حدث خطأ أثناء محاولة الدخول');
        res.redirect('back');
    }
};
