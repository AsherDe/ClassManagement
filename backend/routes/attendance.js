const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

const attendanceValidationRules = () => {
    return [
        body('student_id').isInt({ min: 1 }).withMessage('学生ID必须是正整数'),
        body('attendance_date').isISO8601().withMessage('考勤日期格式不正确'),
        body('attendance_type').isIn(['course', 'activity', 'meeting']).withMessage('考勤类型不正确'),
        body('status').isIn(['present', 'absent', 'late', 'leave']).withMessage('考勤状态不正确')
    ];
};

/**
 * @route GET /api/attendance
 * @desc 获取考勤记录列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            student_id, 
            class_id, 
            attendance_type, 
            status,
            start_date,
            end_date
        } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        // 构建查询条件
        if (student_id) {
            whereConditions.push(`a.student_id = $${paramIndex++}`);
            params.push(student_id);
        }

        if (class_id) {
            whereConditions.push(`s.class_id = $${paramIndex++}`);
            params.push(class_id);
        }

        if (attendance_type) {
            whereConditions.push(`a.attendance_type = $${paramIndex++}`);
            params.push(attendance_type);
        }

        if (status) {
            whereConditions.push(`a.status = $${paramIndex++}`);
            params.push(status);
        }

        if (start_date) {
            whereConditions.push(`a.attendance_date >= $${paramIndex++}`);
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push(`a.attendance_date <= $${paramIndex++}`);
            params.push(end_date);
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // 查询考勤记录
        const query = `
            SELECT 
                a.*,
                s.name as student_name,
                s.student_code,
                c.class_name,
                c.class_code,
                CASE 
                    WHEN a.course_schedule_id IS NOT NULL THEN co.course_name
                    WHEN a.activity_id IS NOT NULL THEN ca.activity_name
                    ELSE NULL
                END as event_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN course_schedule cs ON a.course_schedule_id = cs.id
            LEFT JOIN courses co ON cs.course_id = co.id
            LEFT JOIN class_activities ca ON a.activity_id = ca.id
            ${whereClause}
            ORDER BY a.attendance_date DESC, a.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `
            SELECT COUNT(*) as total
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            ${whereClause}
        `;

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
        console.error('获取考勤记录错误:', error);
        res.status(500).json({
            success: false,
            message: '获取考勤记录失败'
        });
    }
});

/**
 * @route POST /api/attendance
 * @desc 创建考勤记录
 * @access Private
 */
router.post('/', attendanceValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const attendanceData = req.body;
        const attendance = await db.create('attendance', attendanceData);

        res.status(201).json({
            success: true,
            message: '考勤记录创建成功',
            data: attendance
        });

    } catch (error) {
        console.error('创建考勤记录错误:', error);
        res.status(500).json({
            success: false,
            message: '创建考勤记录失败'
        });
    }
});

/**
 * @route POST /api/attendance/batch
 * @desc 批量创建考勤记录
 * @access Private
 */
router.post('/batch', async (req, res) => {
    try {
        const { records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: '考勤记录数组不能为空'
            });
        }

        const results = [];
        for (const record of records) {
            try {
                const attendance = await db.create('attendance', record);
                results.push(attendance);
            } catch (error) {
                console.error('批量创建考勤记录失败:', error);
                results.push({ error: error.message, record });
            }
        }

        res.json({
            success: true,
            message: '批量考勤记录处理完成',
            data: results
        });

    } catch (error) {
        console.error('批量创建考勤记录错误:', error);
        res.status(500).json({
            success: false,
            message: '批量创建考勤记录失败'
        });
    }
});

/**
 * @route GET /api/attendance/statistics
 * @desc 获取考勤统计
 * @access Private
 */
router.get('/statistics', async (req, res) => {
    try {
        const { class_id, student_id, start_date, end_date } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (class_id) {
            whereConditions.push(`s.class_id = $${paramIndex++}`);
            params.push(class_id);
        }

        if (student_id) {
            whereConditions.push(`a.student_id = $${paramIndex++}`);
            params.push(student_id);
        }

        if (start_date) {
            whereConditions.push(`a.attendance_date >= $${paramIndex++}`);
            params.push(start_date);
        }

        if (end_date) {
            whereConditions.push(`a.attendance_date <= $${paramIndex++}`);
            params.push(end_date);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const query = `
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.student_code,
                c.class_name,
                COUNT(*) as total_records,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
                COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
                ROUND(
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2
                ) as attendance_rate
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            ${whereClause}
            GROUP BY s.id, s.name, s.student_code, c.class_name
            ORDER BY attendance_rate DESC, s.student_code
        `;

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('获取考勤统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取考勤统计失败'
        });
    }
});

module.exports = router;