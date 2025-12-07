const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Tạo JWT token
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
}

// POST /auth/register - Đăng ký
async function register(req, res) {
    const { name, email, password, phone, role } = req.body;

    try {
        // Kiểm tra email đã tồn tại chưa
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'USER',
            },
        });

        // Tạo token
        const { accessToken, refreshToken } = generateToken(user);

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            success: true,
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            },
            message: 'User registered successfully',
        });
    } catch (error) {
        logger.error(`Error registering user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /auth/login - Đăng nhập
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // Tìm user theo email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Kiểm tra password (nếu user có password)
        if (user.password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                });
            }
        } else {
            // User đăng nhập bằng Google (không có password)
            return res.status(401).json({
                success: false,
                message: 'Please login with Google',
            });
        }

        // Tạo token
        const { accessToken, refreshToken } = generateToken(user);

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            },
            message: 'Login successful',
        });
    } catch (error) {
        logger.error(`Error logging in: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// POST /auth/refresh - Refresh token
async function refreshToken(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            message: 'Refresh token is required',
        });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
        );

        // Tìm user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        // Tạo token mới
        const tokens = generateToken(user);

        res.json({
            success: true,
            data: tokens,
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired',
            });
        }
        logger.error(`Error refreshing token: ${error}`);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        });
    }
}

// POST /auth/logout - Đăng xuất (optional, có thể xử lý ở client)
async function logout(req, res) {
    // Với JWT stateless, logout thường được xử lý ở client (xóa token)
    // Nếu cần blacklist token, có thể lưu vào Redis hoặc database
    res.json({
        success: true,
        message: 'Logout successful',
    });
}

// POST /auth/social-login - Đăng nhập bằng mạng xã hội (Google, Facebook, Apple)
async function socialLogin(req, res) {
    const { provider, providerId, email, name, avatarUrl, phone } = req.body;

    try {
        // Validate provider
        const validProviders = ['google', 'facebook', 'apple'];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid provider. Must be google, facebook, or apple',
            });
        }

        if (!providerId || !email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Provider ID, email, and name are required',
            });
        }

        // Tìm user theo provider ID hoặc email
        let user = null;
        
        // Tìm theo provider ID
        const providerField = `${provider}Id`;
        user = await prisma.user.findFirst({
            where: {
                OR: [
                    { [providerField]: providerId },
                    { email: email },
                ],
            },
        });

        if (user) {
            // User đã tồn tại - cập nhật thông tin nếu cần
            const updateData = {};
            if (!user[providerField]) {
                updateData[providerField] = providerId;
            }
            if (avatarUrl && !user.avatarUrl) {
                updateData.avatarUrl = avatarUrl;
            }
            if (phone && !user.phone) {
                updateData.phone = phone;
            }

            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
            }
        } else {
            // Tạo user mới
            const createData = {
                name,
                email,
                [providerField]: providerId,
                role: 'USER',
            };

            if (avatarUrl) createData.avatarUrl = avatarUrl;
            if (phone) createData.phone = phone;

            user = await prisma.user.create({
                data: createData,
            });
        }

        // Tạo token
        const { accessToken, refreshToken } = generateToken(user);

        // Loại bỏ password khỏi response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            },
            message: 'Social login successful',
        });
    } catch (error) {
        logger.error(`Error in social login: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

// GET /auth/me - Lấy thông tin user hiện tại
async function getMe(req, res) {
    try {
        // req.user được set bởi authMiddleware
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                addresses: true,
                carts: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Loại bỏ password
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword,
            message: 'User fetched successfully',
        });
    } catch (error) {
        logger.error(`Error getting user: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    socialLogin,
};

