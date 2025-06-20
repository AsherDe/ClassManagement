const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/connection');

const loginValidationRules = () => {
    return [
        body('username').notEmpty().withMessage('用户名不能为空'),
        body('password').notEmpty().withMessage('密码不能为空')
    ];
};

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login', loginValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await db.findOne('users', { username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 检查用户状态
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: '账户已被禁用或暂停'
            });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                userType: user.user_type 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 更新最后登录时间
        await db.update('users', 
            { last_login: new Date() },
            { id: user.id }
        );

        // 返回用户信息和令牌
        const { password_hash, ...userInfo } = user;
        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: userInfo,
                token
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: '登出成功'
    });
});

/**
 * @route GET /api/auth/profile
 * @desc 获取用户信息
 * @access Private
 */
router.get('/profile', async (req, res) => {
    try {
        // 这里需要从JWT中获取用户ID，暂时使用请求头中的用户ID
        const userId = req.headers['user-id'];
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '未提供用户身份信息'
            });
        }

        const user = await db.findOne('users', { id: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 获取用户详细信息
        let userDetails = null;
        if (user.user_type === 'student') {
            userDetails = await db.query(`
                SELECT s.*, c.class_name, c.class_code 
                FROM students s 
                LEFT JOIN classes c ON s.class_id = c.id 
                WHERE s.id = $1
            `, [userId]);
        } else if (user.user_type === 'teacher') {
            userDetails = await db.query(`
                SELECT * FROM teachers WHERE id = $1
            `, [userId]);
        }

        const { password_hash, ...userInfo } = user;
        res.json({
            success: true,
            data: {
                user: userInfo,
                details: userDetails?.rows[0] || null
            }
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
});

module.exports = router;