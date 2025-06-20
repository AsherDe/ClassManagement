const express = require('express');
const router = express.Router();
const db = require('../database/connection');

/**
 * @route GET /api/statistics/overview
 * @desc 获取系统概览统计
 * @access Private
 */
router.get('/overview', async (req, res) => {
    try {
        const overviewQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
                (SELECT COUNT(*) FROM students WHERE status = 'enrolled') as enrolled_students,
                (SELECT COUNT(*) FROM teachers WHERE status = 'active') as active_teachers,
                (SELECT COUNT(*) FROM classes WHERE status = 'active') as active_classes,
                (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses,
                (SELECT COUNT(*) FROM class_activities WHERE status IN ('planned', 'ongoing')) as ongoing_activities,
                (SELECT SUM(class_fund_balance) FROM classes) as total_class_funds
        `;

        const result = await db.query(overviewQuery);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('获取概览统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取概览统计失败'
        });
    }
});

/**
 * @route GET /api/statistics/class/:class_id
 * @desc 获取班级统计信息
 * @access Private
 */
router.get('/class/:class_id', async (req, res) => {
    try {
        const { class_id } = req.params;

        // 基本统计
        const basicStatsQuery = `
            SELECT 
                c.class_name,
                c.class_code,
                c.total_students,
                c.class_fund_balance,
                COUNT(DISTINCT s.id) as actual_student_count,
                COUNT(DISTINCT CASE WHEN s.status = 'enrolled' THEN s.id END) as enrolled_count,
                COUNT(DISTINCT CASE WHEN s.gender = 'male' THEN s.id END) as male_count,
                COUNT(DISTINCT CASE WHEN s.gender = 'female' THEN s.id END) as female_count,
                ROUND(AVG(s.gpa), 2) as average_gpa
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id
            WHERE c.id = $1
            GROUP BY c.id, c.class_name, c.class_code, c.total_students, c.class_fund_balance
        `;

        const basicStats = await db.query(basicStatsQuery, [class_id]);

        if (basicStats.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '班级不存在'
            });
        }

        // 成绩统计
        const gradeStatsQuery = `
            SELECT 
                COUNT(*) as total_grades,
                ROUND(AVG(total_score), 2) as average_score,
                COUNT(CASE WHEN is_pass = true THEN 1 END) as pass_count,
                ROUND(COUNT(CASE WHEN is_pass = true THEN 1 END) * 100.0 / COUNT(*), 2) as pass_rate,
                COUNT(CASE WHEN letter_grade = 'A+' THEN 1 END) as excellent_count
            FROM grades g
            JOIN students s ON g.student_id = s.id
            WHERE s.class_id = $1
        `;

        const gradeStats = await db.query(gradeStatsQuery, [class_id]);

        // 考勤统计
        const attendanceStatsQuery = `
            SELECT 
                COUNT(*) as total_attendance_records,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
                ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE s.class_id = $1
        `;

        const attendanceStats = await db.query(attendanceStatsQuery, [class_id]);

        // 活动统计
        const activityStatsQuery = `
            SELECT 
                COUNT(*) as total_activities,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
                COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing_activities,
                SUM(budget_amount) as total_budget,
                SUM(actual_cost) as total_cost
            FROM class_activities
            WHERE class_id = $1
        `;

        const activityStats = await db.query(activityStatsQuery, [class_id]);

        // 班费统计
        const fundStatsQuery = `
            SELECT 
                SUM(CASE WHEN transaction_type = 'income' AND status = 'approved' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN transaction_type = 'expense' AND status = 'approved' THEN amount ELSE 0 END) as total_expense,
                COUNT(*) as total_transactions
            FROM class_funds
            WHERE class_id = $1
        `;

        const fundStats = await db.query(fundStatsQuery, [class_id]);

        res.json({
            success: true,
            data: {
                basic: basicStats.rows[0],
                grades: gradeStats.rows[0],
                attendance: attendanceStats.rows[0],
                activities: activityStats.rows[0],
                funds: fundStats.rows[0]
            }
        });

    } catch (error) {
        console.error('获取班级统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取班级统计失败'
        });
    }
});

/**
 * @route GET /api/statistics/student/:student_id
 * @desc 获取学生个人统计
 * @access Private
 */
router.get('/student/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        // 学生基本信息
        const studentInfoQuery = `
            SELECT 
                s.*,
                c.class_name,
                c.class_code
            FROM students s
            JOIN classes c ON s.class_id = c.id
            WHERE s.id = $1
        `;

        const studentInfo = await db.query(studentInfoQuery, [student_id]);

        if (studentInfo.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 成绩统计
        const gradeStatsQuery = `
            SELECT 
                COUNT(*) as total_courses,
                ROUND(AVG(total_score), 2) as average_score,
                COUNT(CASE WHEN is_pass = true THEN 1 END) as passed_courses,
                COUNT(CASE WHEN is_retake = true THEN 1 END) as retake_courses,
                MAX(total_score) as highest_score,
                MIN(total_score) as lowest_score,
                SUM(CASE WHEN c.credits IS NOT NULL THEN c.credits ELSE 0 END) as total_credits
            FROM grades g
            LEFT JOIN courses c ON g.course_id = c.id
            WHERE g.student_id = $1
        `;

        const gradeStats = await db.query(gradeStatsQuery, [student_id]);

        // 考勤统计
        const attendanceStatsQuery = `
            SELECT 
                COUNT(*) as total_attendance,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
                COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
                COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_count,
                ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
            FROM attendance
            WHERE student_id = $1
        `;

        const attendanceStats = await db.query(attendanceStatsQuery, [student_id]);

        // 活动参与统计
        const activityStatsQuery = `
            SELECT 
                COUNT(DISTINCT a.activity_id) as participated_activities,
                COUNT(CASE WHEN att.status = 'present' THEN 1 END) as attended_activities
            FROM class_activities a
            LEFT JOIN attendance att ON a.id = att.activity_id AND att.student_id = $1
            WHERE a.class_id = (SELECT class_id FROM students WHERE id = $1)
        `;

        const activityStats = await db.query(activityStatsQuery, [student_id]);

        res.json({
            success: true,
            data: {
                student: studentInfo.rows[0],
                grades: gradeStats.rows[0],
                attendance: attendanceStats.rows[0],
                activities: activityStats.rows[0]
            }
        });

    } catch (error) {
        console.error('获取学生统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取学生统计失败'
        });
    }
});

/**
 * @route GET /api/statistics/grade-distribution
 * @desc 获取成绩分布统计
 * @access Private
 */
router.get('/grade-distribution', async (req, res) => {
    try {
        const { class_id, course_id, semester, academic_year } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (class_id) {
            whereConditions.push(`s.class_id = $${paramIndex++}`);
            params.push(class_id);
        }

        if (course_id) {
            whereConditions.push(`g.course_id = $${paramIndex++}`);
            params.push(course_id);
        }

        if (semester) {
            whereConditions.push(`g.semester = $${paramIndex++}`);
            params.push(semester);
        }

        if (academic_year) {
            whereConditions.push(`g.academic_year = $${paramIndex++}`);
            params.push(academic_year);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const distributionQuery = `
            SELECT 
                g.letter_grade,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage,
                ROUND(AVG(g.total_score), 2) as average_score
            FROM grades g
            JOIN students s ON g.student_id = s.id
            ${whereClause}
            GROUP BY g.letter_grade
            ORDER BY 
                CASE g.letter_grade 
                    WHEN 'A+' THEN 1 
                    WHEN 'A' THEN 2 
                    WHEN 'B+' THEN 3 
                    WHEN 'B' THEN 4 
                    WHEN 'C+' THEN 5 
                    WHEN 'C' THEN 6 
                    WHEN 'D' THEN 7 
                    WHEN 'F' THEN 8 
                    ELSE 9 
                END
        `;

        const result = await db.query(distributionQuery, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('获取成绩分布统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取成绩分布统计失败'
        });
    }
});

module.exports = router;