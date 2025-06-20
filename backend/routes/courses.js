const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../database/connection');

/**
 * @route GET /api/courses
 * @desc 获取课程列表
 * @access Private
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            department, 
            course_type, 
            status, 
            search 
        } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (department) {
            whereConditions.push(`department = $${paramIndex++}`);
            params.push(department);
        }

        if (course_type) {
            whereConditions.push(`course_type = $${paramIndex++}`);
            params.push(course_type);
        }

        if (status) {
            whereConditions.push(`status = $${paramIndex++}`);
            params.push(status);
        }

        if (search) {
            whereConditions.push(`(course_name ILIKE $${paramIndex++} OR course_code ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const result = await db.paginate('courses', 
            whereConditions.length > 0 ? 
                Object.fromEntries(whereConditions.map((_, i) => [`param${i}`, params[i]])) : {},
            {
                page: parseInt(page),
                limit: parseInt(limit),
                orderBy: 'course_code'
            }
        );

        res.json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('获取课程列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取课程列表失败'
        });
    }
});

/**
 * @route GET /api/courses/:id
 * @desc 获取课程详细信息
 * @access Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await db.findOne('courses', { id });
        if (!course) {
            return res.status(404).json({
                success: false,
                message: '课程不存在'
            });
        }

        // 获取课程安排信息
        const scheduleQuery = `
            SELECT 
                cs.*,
                c.class_name,
                c.class_code,
                t.name as teacher_name
            FROM course_schedule cs
            JOIN classes c ON cs.class_id = c.id
            JOIN teachers t ON cs.teacher_id = t.id
            WHERE cs.course_id = $1
            ORDER BY cs.academic_year DESC, cs.semester DESC
        `;

        const scheduleResult = await db.query(scheduleQuery, [id]);
        course.schedules = scheduleResult.rows;

        // 获取成绩统计
        const gradeStatsQuery = `
            SELECT 
                COUNT(*) as total_students,
                ROUND(AVG(total_score), 2) as average_score,
                COUNT(CASE WHEN is_pass = true THEN 1 END) as pass_count,
                ROUND(COUNT(CASE WHEN is_pass = true THEN 1 END) * 100.0 / COUNT(*), 2) as pass_rate
            FROM grades
            WHERE course_id = $1
        `;

        const gradeStatsResult = await db.query(gradeStatsQuery, [id]);
        course.grade_statistics = gradeStatsResult.rows[0];

        res.json({
            success: true,
            data: course
        });

    } catch (error) {
        console.error('获取课程详情错误:', error);
        res.status(500).json({
            success: false,
            message: '获取课程详情失败'
        });
    }
});

/**
 * @route GET /api/courses/:id/grades
 * @desc 获取课程成绩
 * @access Private
 */
router.get('/:id/grades', async (req, res) => {
    try {
        const { id } = req.params;
        const { semester, academic_year, class_id } = req.query;

        let whereConditions = [`g.course_id = $1`];
        let params = [id];
        let paramIndex = 2;

        if (semester) {
            whereConditions.push(`g.semester = $${paramIndex++}`);
            params.push(semester);
        }

        if (academic_year) {
            whereConditions.push(`g.academic_year = $${paramIndex++}`);
            params.push(academic_year);
        }

        if (class_id) {
            whereConditions.push(`s.class_id = $${paramIndex++}`);
            params.push(class_id);
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT 
                g.*,
                s.name as student_name,
                s.student_code,
                c.class_name,
                c.class_code
            FROM grades g
            JOIN students s ON g.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE ${whereClause}
            ORDER BY s.student_code
        `;

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('获取课程成绩错误:', error);
        res.status(500).json({
            success: false,
            message: '获取课程成绩失败'
        });
    }
});

module.exports = router;