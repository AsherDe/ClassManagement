const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

const activityValidationRules = () => {
    return [
        body('class_id').isInt({ min: 1 }).withMessage('班级ID必须是正整数'),
        body('activity_name').notEmpty().withMessage('活动名称不能为空').isLength({ max: 200 }).withMessage('活动名称长度不能超过200字符'),
        body('activity_type').notEmpty().withMessage('活动类型不能为空'),
        body('start_time').custom((value) => {
            // 支持多种时间格式：ISO8601、时间戳、或 HH:mm 格式
            if (!value) return false;
            
            // 检查是否为ISO8601格式
            const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
            if (iso8601Regex.test(value)) return true;
            
            // 检查是否为时间戳
            if (!isNaN(Date.parse(value))) return true;
            
            // 检查是否为HH:mm或HH:mm:ss格式
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
            if (timeRegex.test(value)) return true;
            
            throw new Error('开始时间格式不正确，支持ISO8601、时间戳或HH:mm格式');
        }),
        body('end_time').optional().custom((value) => {
            if (!value) return true; // 可选字段
            
            // 检查是否为ISO8601格式
            const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
            if (iso8601Regex.test(value)) return true;
            
            // 检查是否为时间戳
            if (!isNaN(Date.parse(value))) return true;
            
            // 检查是否为HH:mm或HH:mm:ss格式
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
            if (timeRegex.test(value)) return true;
            
            throw new Error('结束时间格式不正确，支持ISO8601、时间戳或HH:mm格式');
        })
    ];
};

/**
 * @route GET /api/activities
 * @desc 获取班级活动列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, class_id, activity_type, status } = req.query;
        
        let conditions = {};
        if (class_id) conditions.class_id = class_id;
        if (activity_type) conditions.activity_type = activity_type;
        if (status) conditions.status = status;

        const result = await db.paginate('class_activities', conditions, {
            page: parseInt(page),
            limit: parseInt(limit),
            orderBy: 'start_time DESC'
        });

        // 获取活动的详细信息，包括组织者信息
        for (let activity of result.data) {
            if (activity.organizer_id) {
                const organizer = await db.query(`
                    SELECT s.name, s.student_code
                    FROM students s
                    WHERE s.id = $1
                `, [activity.organizer_id]);
                activity.organizer = organizer.rows[0] || null;
            }

            // 获取班级信息
            const classInfo = await db.query(`
                SELECT class_name, class_code
                FROM classes
                WHERE id = $1
            `, [activity.class_id]);
            activity.class_info = classInfo.rows[0] || null;
        }

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取活动列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动列表失败'
        });
    }
});

/**
 * @route GET /api/activities/:id
 * @desc 获取活动详细信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await db.findOne('class_activities', { id });
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        // 获取参与统计
        const attendanceCount = await db.query(`
            SELECT 
                COUNT(*) as total_participants,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
            FROM attendance 
            WHERE activity_id = $1
        `, [id]);

        activity.attendance_stats = attendanceCount.rows[0];

        res.json({
            success: true,
            data: activity
        });

    } catch (error) {
        console.error('获取活动详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动详情失败'
        });
    }
});

/**
 * @route POST /api/activities
 * @desc 创建班级活动
 * @access Private
 */
router.post('/', activityValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const activityData = { ...req.body };
        
        // 处理时间格式转换
        if (activityData.start_time && activityData.activity_date) {
            // 如果是HH:mm格式，结合activity_date转换为完整的datetime
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
            if (timeRegex.test(activityData.start_time)) {
                const date = new Date(activityData.activity_date);
                const [hours, minutes] = activityData.start_time.split(':');
                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                activityData.start_time = date.toISOString();
            }
        }
        
        if (activityData.end_time && activityData.activity_date) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
            if (timeRegex.test(activityData.end_time)) {
                const date = new Date(activityData.activity_date);
                const [hours, minutes] = activityData.end_time.split(':');
                date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                activityData.end_time = date.toISOString();
            }
        }
        
        const activity = await db.create('class_activities', activityData);

        res.status(201).json({
            success: true,
            message: '活动创建成功',
            data: activity
        });

    } catch (error) {
        console.error('创建活动错误:', error);
        res.status(500).json({
            success: false,
            message: '创建活动失败'
        });
    }
});

/**
 * @route PUT /api/activities/:id
 * @desc 更新活动信息
 * @access Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const activity = await db.update('class_activities', updateData, { id });
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        res.json({
            success: true,
            message: '活动更新成功',
            data: activity
        });

    } catch (error) {
        console.error('更新活动错误:', error);
        res.status(500).json({
            success: false,
            message: '更新活动失败'
        });
    }
});

/**
 * @route GET /api/activities/:id/attendance
 * @desc 获取活动考勤记录
 * @access Private
 */
router.get('/:id/attendance', async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await db.query(`
            SELECT 
                a.*,
                s.name as student_name,
                s.student_code
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.activity_id = $1
            ORDER BY s.student_code
        `, [id]);

        res.json({
            success: true,
            data: attendance.rows
        });

    } catch (error) {
        console.error('获取活动考勤错误:', error);
        res.status(500).json({
            success: false,
            message: '获取活动考勤失败'
        });
    }
});

/**
 * @route DELETE /api/activities/:id
 * @desc 删除活动
 * @access Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 检查活动是否存在
        const activity = await db.findOne('class_activities', { id });
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: '活动不存在'
            });
        }

        // 检查活动状态，进行中的活动不能删除
        if (activity.status === 'ongoing') {
            return res.status(400).json({
                success: false,
                message: '进行中的活动不能删除'
            });
        }

        // 删除相关的考勤记录
        await db.query('DELETE FROM attendance WHERE activity_id = $1', [id]);

        // 删除活动
        await db.query('DELETE FROM class_activities WHERE id = $1', [id]);

        res.json({
            success: true,
            message: '活动删除成功'
        });

    } catch (error) {
        console.error('删除活动错误:', error);
        res.status(500).json({
            success: false,
            message: '删除活动失败'
        });
    }
});

module.exports = router;