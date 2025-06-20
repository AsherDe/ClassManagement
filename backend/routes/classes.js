const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

const classValidationRules = () => {
    return [
        body('class_name').notEmpty().withMessage('班级名称不能为空').isLength({ max: 100 }).withMessage('班级名称长度不能超过100字符'),
        body('class_code').notEmpty().withMessage('班级代码不能为空').isLength({ max: 20 }).withMessage('班级代码长度不能超过20字符'),
        body('grade_level').isInt({ min: 1, max: 4 }).withMessage('年级必须是1-4之间的整数'),
        body('major').notEmpty().withMessage('专业不能为空'),
        body('department').notEmpty().withMessage('院系不能为空'),
        body('enrollment_year').isInt({ min: 2000 }).withMessage('入学年份格式不正确')
    ];
};

/**
 * @route GET /api/classes
 * @desc 获取班级列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, department, grade_level, status, search } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (department) {
            whereConditions.push(`c.department = $${paramIndex++}`);
            params.push(department);
        }

        if (grade_level) {
            whereConditions.push(`c.grade_level = $${paramIndex++}`);
            params.push(grade_level);
        }

        if (status) {
            whereConditions.push(`c.status = $${paramIndex++}`);
            params.push(status);
        }

        if (search) {
            whereConditions.push(`(c.class_name ILIKE $${paramIndex++} OR c.class_code ILIKE $${paramIndex} OR c.major ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // 查询班级列表，包含班主任和班长信息
        const query = `
            SELECT 
                c.*,
                t.name as class_teacher_name,
                m.name as monitor_name,
                m.student_code as monitor_code,
                vm.name as vice_monitor_name,
                vm.student_code as vice_monitor_code
            FROM classes c
            LEFT JOIN teachers t ON c.class_teacher_id = t.id
            LEFT JOIN students m ON c.monitor_id = m.id
            LEFT JOIN students vm ON c.vice_monitor_id = vm.id
            ${whereClause}
            ORDER BY c.enrollment_year DESC, c.grade_level, c.class_code
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `SELECT COUNT(*) as total FROM classes c ${whereClause}`;
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
        console.error('获取班级列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级列表失败'
        });
    }
});

/**
 * @route GET /api/classes/:id
 * @desc 获取班级详细信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 获取班级基本信息
        const classQuery = `
            SELECT 
                c.*,
                t.name as class_teacher_name,
                t.phone as class_teacher_phone,
                t.email as class_teacher_email,
                m.name as monitor_name,
                m.student_code as monitor_code,
                m.phone as monitor_phone,
                vm.name as vice_monitor_name,
                vm.student_code as vice_monitor_code,
                vm.phone as vice_monitor_phone
            FROM classes c
            LEFT JOIN teachers t ON c.class_teacher_id = t.id
            LEFT JOIN students m ON c.monitor_id = m.id
            LEFT JOIN students vm ON c.vice_monitor_id = vm.id
            WHERE c.id = $1
        `;

        const classResult = await db.query(classQuery, [id]);
        
        if (classResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '班级不存在'
            });
        }

        const classData = classResult.rows[0];

        // 获取班级统计信息
        const statsQuery = `
            SELECT 
                COUNT(s.id) as total_students,
                COUNT(CASE WHEN s.status = 'enrolled' THEN 1 END) as enrolled_students,
                COUNT(CASE WHEN s.gender = 'male' THEN 1 END) as male_students,
                COUNT(CASE WHEN s.gender = 'female' THEN 1 END) as female_students,
                ROUND(AVG(s.gpa), 2) as average_gpa
            FROM students s
            WHERE s.class_id = $1
        `;

        const statsResult = await db.query(statsQuery, [id]);
        classData.statistics = statsResult.rows[0];

        // 获取最近活动
        const activitiesQuery = `
            SELECT id, activity_name, activity_type, start_time, status
            FROM class_activities
            WHERE class_id = $1
            ORDER BY start_time DESC
            LIMIT 5
        `;

        const activitiesResult = await db.query(activitiesQuery, [id]);
        classData.recent_activities = activitiesResult.rows;

        res.json({
            success: true,
            data: classData
        });

    } catch (error) {
        console.error('获取班级详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级详情失败'
        });
    }
});

/**
 * @route POST /api/classes
 * @desc 创建班级
 * @access Private
 */
router.post('/', classValidationRules(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
        }

        const classData = req.body;
        const newClass = await db.create('classes', classData);

        res.status(201).json({
            success: true,
            message: '班级创建成功',
            data: newClass
        });

    } catch (error) {
        console.error('创建班级错误:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: '班级代码已存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '创建班级失败'
        });
    }
});

/**
 * @route PUT /api/classes/:id
 * @desc 更新班级信息
 * @access Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedClass = await db.update('classes', updateData, { id });
        
        if (!updatedClass) {
            return res.status(404).json({
                success: false,
                message: '班级不存在'
            });
        }

        res.json({
            success: true,
            message: '班级更新成功',
            data: updatedClass
        });

    } catch (error) {
        console.error('更新班级错误:', error);
        res.status(500).json({
            success: false,
            message: '更新班级失败'
        });
    }
});

/**
 * @route GET /api/classes/:id/students
 * @desc 获取班级学生列表
 * @access Private
 */
router.get('/:id/students', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, status } = req.query;

        let whereConditions = [`s.class_id = $1`];
        let params = [id];
        let paramIndex = 2;

        if (status) {
            whereConditions.push(`s.status = $${paramIndex++}`);
            params.push(status);
        }

        const offset = (page - 1) * limit;
        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                s.*,
                ROUND(AVG(g.total_score), 2) as average_score
            FROM students s
            LEFT JOIN grades g ON s.id = g.student_id
            WHERE ${whereClause}
            GROUP BY s.id
            ORDER BY s.student_code
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        params.push(limit, offset);

        const result = await db.query(query, params);

        // 获取总数
        const countQuery = `SELECT COUNT(*) as total FROM students s WHERE ${whereClause}`;
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
        console.error('获取班级学生列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级学生列表失败'
        });
    }
});

module.exports = router;