const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

const notificationValidationRules = () => {
    return [
        body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 200 }).withMessage('标题长度不能超过200字符'),
        body('content').notEmpty().withMessage('内容不能为空'),
        body('notification_type').notEmpty().withMessage('通知类型不能为空'),
        body('target_type').isIn(['all', 'class', 'student', 'teacher']).withMessage('目标类型不正确'),
        body('sender_id').isInt({ min: 1 }).withMessage('发送者ID必须是正整数')
    ];
};

/**
 * @route GET /api/notifications
 * @desc 获取通知列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            target_type, 
            target_id, 
            notification_type,
            priority,
            is_published
        } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (target_type) {
            whereConditions.push(`n.target_type = $${paramIndex++}`);
            params.push(target_type);
        }

        if (target_id) {
            whereConditions.push(`n.target_id = $${paramIndex++}`);
            params.push(target_id);
        }

        if (notification_type) {
            whereConditions.push(`n.notification_type = $${paramIndex++}`);
            params.push(notification_type);
        }

        if (priority) {
            whereConditions.push(`n.priority = $${paramIndex++}`);
            params.push(priority);
        }

        if (is_published !== undefined) {
            whereConditions.push(`n.is_published = $${paramIndex++}`);
            params.push(is_published === 'true');
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                n.*,
                u.username as sender_name,
                CASE 
                    WHEN n.target_type = 'class' AND n.target_id IS NOT NULL THEN c.class_name
                    ELSE NULL
                END as target_name
            FROM notifications n
            JOIN users u ON n.sender_id = u.id
            LEFT JOIN classes c ON n.target_type = 'class' AND n.target_id = c.id
            ${whereClause}
            ORDER BY n.priority DESC, n.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `SELECT COUNT(*) as total FROM notifications n ${whereClause}`;
        const countResult = await db.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('获取通知列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取通知列表失败'
        });
    }
});

/**
 * @route GET /api/notifications/:id
 * @desc 获取通知详细信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                n.*,
                u.username as sender_name,
                CASE 
                    WHEN n.target_type = 'class' AND n.target_id IS NOT NULL THEN c.class_name
                    ELSE NULL
                END as target_name
            FROM notifications n
            JOIN users u ON n.sender_id = u.id
            LEFT JOIN classes c ON n.target_type = 'class' AND n.target_id = c.id
            WHERE n.id = $1
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '通知不存在'
            });
        }

        // 增加阅读计数
        await db.query(`
            UPDATE notifications 
            SET read_count = read_count + 1 
            WHERE id = $1
        `, [id]);

        const notification = result.rows[0];
        notification.read_count += 1;

        res.json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('获取通知详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取通知详情失败'
        });
    }
});

/**
 * @route POST /api/notifications
 * @desc 创建通知
 * @access Private
 */
router.post('/', notificationValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const notificationData = req.body;
        const notification = await db.create('notifications', notificationData);

        res.status(201).json({
            success: true,
            message: '通知创建成功',
            data: notification
        });

    } catch (error) {
        console.error('创建通知错误:', error);
        res.status(500).json({
            success: false,
            message: '创建通知失败'
        });
    }
});

/**
 * @route PUT /api/notifications/:id/publish
 * @desc 发布通知
 * @access Private
 */
router.put('/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { publish_time, expire_time } = req.body;

        const updateData = {
            is_published: true,
            publish_time: publish_time || new Date(),
            ...(expire_time && { expire_time })
        };

        const notification = await db.update('notifications', updateData, { id });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: '通知不存在'
            });
        }

        res.json({
            success: true,
            message: '通知发布成功',
            data: notification
        });

    } catch (error) {
        console.error('发布通知错误:', error);
        res.status(500).json({
            success: false,
            message: '发布通知失败'
        });
    }
});

/**
 * @route GET /api/notifications/user/:user_id
 * @desc 获取用户相关通知
 * @access Private
 */
router.get('/user/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // 首先获取用户信息确定目标类型
        const userQuery = `
            SELECT u.user_type, s.class_id
            FROM users u
            LEFT JOIN students s ON u.id = s.id
            WHERE u.id = $1
        `;

        const userResult = await db.query(userQuery, [user_id]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const user = userResult.rows[0];
        const offset = (page - 1) * limit;

        // 构建查询条件
        let whereConditions = [`n.is_published = true`];
        let params = [];
        let paramIndex = 1;

        // 添加时间过滤条件
        whereConditions.push(`(n.expire_time IS NULL OR n.expire_time > CURRENT_TIMESTAMP)`);
        whereConditions.push(`n.publish_time <= CURRENT_TIMESTAMP`);

        // 添加目标过滤条件
        const targetConditions = [];
        
        // 全局通知
        targetConditions.push(`n.target_type = 'all'`);
        
        // 用户类型通知
        targetConditions.push(`(n.target_type = $${paramIndex++} AND n.target_id IS NULL)`);
        params.push(user.user_type);

        // 如果是学生，添加班级通知
        if (user.user_type === 'student' && user.class_id) {
            targetConditions.push(`(n.target_type = 'class' AND n.target_id = $${paramIndex++})`);
            params.push(user.class_id);
        }

        // 个人通知
        targetConditions.push(`(n.target_type = $${paramIndex++} AND n.target_id = $${paramIndex++})`);
        params.push(user.user_type, user_id);

        whereConditions.push(`(${targetConditions.join(' OR ')})`);

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                n.*,
                u.username as sender_name
            FROM notifications n
            JOIN users u ON n.sender_id = u.id
            WHERE ${whereClause}
            ORDER BY n.priority DESC, n.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `SELECT COUNT(*) as total FROM notifications n WHERE ${whereClause}`;
        const countResult = await db.query(countQuery, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('获取用户通知错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户通知失败'
        });
    }
});

module.exports = router;