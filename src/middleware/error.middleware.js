const errorMiddleware = (err, req, res, next) => {
    console.error('🔥 Global Error Handler:', err);

    // Differentiate between Operational Errors (known) and Programming Errors (unknown)
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.';

    // If request accepts JSON (API), return JSON
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(statusCode).json({
            status: 'error',
            message: message
        });
    }

    // Otherwise, use Flash and Redirect
    // If it's a 404, we might want to render a 404 page directly
    if (statusCode === 404) {
        return res.status(404).render('pages/public/404', {
            title: 'الصفحة غير موجودة',
            user: req.user || null
        });
    }

    // For other errors, redirect back with flash message
    req.flash('error', message);

    // If we can't redirect back (e.g. headers already sent), just end it
    if (res.headersSent) {
        return next(err);
    }

    // Try to redirect back, otherwise to home
    try {
        res.redirect(req.get('Referrer') || '/');
    } catch (redirectError) {
        res.redirect('/');
    }
};

module.exports = errorMiddleware;
