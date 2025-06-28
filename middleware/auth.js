// Authentication middleware for protected routes

const { requireAuth, redirectIfAuth, guestOnly } = {
    // Middleware to check if user is authenticated
    requireAuth: function (req, res, next) {
        if (req.session && req.session.user) {
            return next(); // User is authenticated, continue
        } else {
            // User is not authenticated, redirect to auth page
            return res.redirect('/auth');
        }
    },

    // Middleware to redirect authenticated users away from auth page
    redirectIfAuth: function (req, res, next) {
        if (req.session && req.session.user) {
            return res.redirect('/dashboard'); // User is already authenticated
        } else {
            return next(); // User is not authenticated, continue
        }
    },

    // Middleware to check if user is guest (not authenticated)
    guestOnly: function (req, res, next) {
        if (!req.session || !req.session.user) {
            return next(); // User is guest, continue
        } else {
            // User is authenticated, redirect to dashboard
            return res.redirect('/dashboard');
        }
    }
};

module.exports = { requireAuth, redirectIfAuth, guestOnly };
