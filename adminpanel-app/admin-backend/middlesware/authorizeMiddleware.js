/**
 * Middleware phân quyền
 * Kiểm tra role của user có được phép truy cập route không
 * 
 * Usage:
 * router.get('/admin-only', authMiddleware, authorize(['ADMIN']), controller);
 * router.get('/admin-or-driver', authMiddleware, authorize(['ADMIN', 'DRIVER']), controller);
 */

function authorize(allowedRoles) {
    return (req, res, next) => {
        // req.user được set bởi authMiddleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please login first.',
            });
        }

        // Kiểm tra role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
            });
        }

        next();
    };
}

module.exports = authorize;

