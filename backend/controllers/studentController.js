const db = require('../database/connection');
const { validationResult } = require('express-validator');

const studentController = {
    // 获取学生列表
    async getStudents(req, res) {
        try {
            const { page = 1, limit = 10, class_id, status, search } = req.query;
            
            let conditions = {};
            let baseQuery = `
                SELECT 
                    s.id, s.student_code, s.name, s.gender, s.birth_date,
                    s.class_id, s.enrollment_date, s.phone, s.email,
                    s.total_credits, s.gpa, s.status,
                    c.class_name, c.class_code, c.major, c.department
                FROM students s
                JOIN classes c ON s.class_id = c.id
            `;
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;

            if (class_id) {
                paramCount++;
                whereConditions.push(`s.class_id = $${paramCount}`);
                queryParams.push(class_id);
            }

            if (status) {
                paramCount++;
                whereConditions.push(`s.status = $${paramCount}`);
                queryParams.push(status);
            }

            if (search) {
                paramCount++;
                whereConditions.push(`(s.name ILIKE $${paramCount} OR s.student_code ILIKE $${paramCount})`);
                queryParams.push(`%${search}%`);
            }

            if (whereConditions.length > 0) {
                baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            baseQuery += ` ORDER BY s.student_code`;

            // 分页
            const offset = (page - 1) * limit;
            const dataQuery = baseQuery + ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            // 计算总数
            const countQuery = `
                SELECT COUNT(*) as total
                FROM students s
                JOIN classes c ON s.class_id = c.id
                ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
            `;

            const [studentsResult, countResult] = await Promise.all([
                db.query(dataQuery, queryParams),
                db.query(countQuery, queryParams.slice(0, paramCount))
            ]);

            const total = parseInt(countResult.rows[0].total);

            res.json({
                success: true,
                data: studentsResult.rows,
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
            console.error('获取学生列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取学生列表失败',
                error: error.message
            });
        }
    },

    // 获取学生详细信息
    async getStudentById(req, res) {
        try {
            const { id } = req.params;

            const studentQuery = `
                SELECT 
                    s.id, s.student_code, s.name, s.gender, s.birth_date, s.id_card,
                    s.class_id, s.enrollment_date, s.graduation_date, s.phone, s.email,
                    s.home_address, s.emergency_contact, s.emergency_phone,
                    s.total_credits, s.gpa, s.status, s.created_at, s.updated_at,
                    c.class_name, c.class_code, c.major, c.department,
                    u.username, u.last_login
                FROM students s
                JOIN classes c ON s.class_id = c.id
                JOIN users u ON s.id = u.id
                WHERE s.id = $1
            `;

            const studentResult = await db.query(studentQuery, [id]);
            
            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '学生不存在'
                });
            }

            const student = studentResult.rows[0];

            // 获取学生成绩统计
            const gradeStatsQuery = `
                SELECT * FROM v_student_grade_summary 
                WHERE student_id = $1
            `;
            const gradeStatsResult = await db.query(gradeStatsQuery, [id]);

            // 获取考勤统计
            const attendanceStatsQuery = `
                SELECT * FROM v_attendance_statistics 
                WHERE student_id = $1
            `;
            const attendanceStatsResult = await db.query(attendanceStatsQuery, [id]);

            res.json({
                success: true,
                data: {
                    student,
                    gradeStats: gradeStatsResult.rows[0] || null,
                    attendanceStats: attendanceStatsResult.rows[0] || null
                }
            });
        } catch (error) {
            console.error('获取学生详细信息失败:', error);
            res.status(500).json({
                success: false,
                message: '获取学生详细信息失败',
                error: error.message
            });
        }
    },

    // 获取学生成绩单
    async getStudentTranscript(req, res) {
        try {
            const { id } = req.params;

            // 使用存储函数获取成绩单
            const transcriptResult = await db.executeFunction('generate_student_transcript', [id]);

            if (transcriptResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '未找到学生成绩记录'
                });
            }

            // 按学期分组成绩
            const groupedGrades = transcriptResult.reduce((acc, grade) => {
                const key = `${grade.academic_year}-${grade.semester}`;
                if (!acc[key]) {
                    acc[key] = {
                        academic_year: grade.academic_year,
                        semester: grade.semester,
                        courses: []
                    };
                }
                acc[key].courses.push({
                    course_code: grade.course_code,
                    course_name: grade.course_name,
                    credits: grade.credits,
                    total_score: grade.total_score,
                    letter_grade: grade.letter_grade,
                    grade_point: grade.grade_point,
                    is_pass: grade.is_pass,
                    is_retake: grade.is_retake
                });
                return acc;
            }, {});

            res.json({
                success: true,
                data: Object.values(groupedGrades)
            });
        } catch (error) {
            console.error('获取学生成绩单失败:', error);
            res.status(500).json({
                success: false,
                message: '获取学生成绩单失败',
                error: error.message
            });
        }
    },

    // 获取学生考勤记录
    async getStudentAttendance(req, res) {
        try {
            const { id } = req.params;
            const { start_date, end_date, attendance_type } = req.query;

            let attendanceQuery = `
                SELECT 
                    a.id, a.attendance_date, a.attendance_type, a.status,
                    a.check_in_time, a.check_out_time, a.notes,
                    cs.id as course_schedule_id,
                    c.course_name, c.course_code,
                    ca.activity_name,
                    t.name as teacher_name
                FROM attendance a
                LEFT JOIN course_schedule cs ON a.course_schedule_id = cs.id
                LEFT JOIN courses c ON cs.course_id = c.id
                LEFT JOIN teachers t ON cs.teacher_id = t.id
                LEFT JOIN class_activities ca ON a.activity_id = ca.id
                WHERE a.student_id = $1
            `;

            let queryParams = [id];
            let paramCount = 1;

            if (start_date) {
                paramCount++;
                attendanceQuery += ` AND a.attendance_date >= $${paramCount}`;
                queryParams.push(start_date);
            }

            if (end_date) {
                paramCount++;
                attendanceQuery += ` AND a.attendance_date <= $${paramCount}`;
                queryParams.push(end_date);
            }

            if (attendance_type) {
                paramCount++;
                attendanceQuery += ` AND a.attendance_type = $${paramCount}`;
                queryParams.push(attendance_type);
            }

            attendanceQuery += ` ORDER BY a.attendance_date DESC, a.check_in_time DESC`;

            const attendanceResult = await db.query(attendanceQuery, queryParams);

            // 获取考勤统计
            const statsResult = await db.executeFunction('get_student_attendance_rate', [
                id, 
                start_date || null, 
                end_date || null
            ]);

            res.json({
                success: true,
                data: {
                    records: attendanceResult.rows,
                    statistics: {
                        attendance_rate: statsResult[0]?.get_student_attendance_rate || 0
                    }
                }
            });
        } catch (error) {
            console.error('获取学生考勤记录失败:', error);
            res.status(500).json({
                success: false,
                message: '获取学生考勤记录失败',
                error: error.message
            });
        }
    },

    // 更新学生信息
    async updateStudent(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '输入数据验证失败',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const updateData = req.body;

            // 移除不允许更新的字段
            delete updateData.id;
            delete updateData.student_code;
            delete updateData.total_credits;
            delete updateData.gpa;
            delete updateData.created_at;

            updateData.updated_at = new Date();

            const updatedStudent = await db.update('students', updateData, { id });

            if (!updatedStudent) {
                return res.status(404).json({
                    success: false,
                    message: '学生不存在'
                });
            }

            res.json({
                success: true,
                message: '学生信息更新成功',
                data: updatedStudent
            });
        } catch (error) {
            console.error('更新学生信息失败:', error);
            res.status(500).json({
                success: false,
                message: '更新学生信息失败',
                error: error.message
            });
        }
    },

    // 获取班级学生排名
    async getClassRanking(req, res) {
        try {
            const { class_id } = req.params;

            const rankingQuery = `
                SELECT 
                    student_id, student_code, student_name, gpa, class_rank,
                    total_courses, earned_credits, excellent_count, good_count,
                    average_count, below_average_count, fail_count
                FROM v_student_grade_summary
                WHERE class_id = (SELECT id FROM classes WHERE id = $1)
                ORDER BY class_rank ASC, gpa DESC NULLS LAST
            `;

            const rankingResult = await db.query(rankingQuery, [class_id]);

            if (rankingResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '该班级暂无学生成绩数据'
                });
            }

            res.json({
                success: true,
                data: rankingResult.rows
            });
        } catch (error) {
            console.error('获取班级排名失败:', error);
            res.status(500).json({
                success: false,
                message: '获取班级排名失败',
                error: error.message
            });
        }
    },

    // 批量导入学生
    async importStudents(req, res) {
        try {
            const { students } = req.body;

            if (!Array.isArray(students) || students.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '学生数据不能为空'
                });
            }

            const results = await db.transaction(async (client) => {
                const successes = [];
                const failures = [];

                for (const student of students) {
                    try {
                        // 首先创建用户
                        const userResult = await client.query(`
                            INSERT INTO users (username, password_hash, email, phone, user_type, status)
                            VALUES ($1, $2, $3, $4, 'student', 'active')
                            RETURNING id
                        `, [
                            student.student_code,
                            student.password_hash,
                            student.email,
                            student.phone
                        ]);

                        const userId = userResult.rows[0].id;

                        // 然后创建学生记录
                        const studentResult = await client.query(`
                            INSERT INTO students (
                                id, student_code, name, gender, birth_date, 
                                id_card, class_id, enrollment_date, phone, email,
                                home_address, emergency_contact, emergency_phone
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                            RETURNING *
                        `, [
                            userId, student.student_code, student.name, student.gender,
                            student.birth_date, student.id_card, student.class_id,
                            student.enrollment_date, student.phone, student.email,
                            student.home_address, student.emergency_contact, student.emergency_phone
                        ]);

                        successes.push(studentResult.rows[0]);
                    } catch (error) {
                        failures.push({
                            student: student.student_code,
                            error: error.message
                        });
                    }
                }

                return { successes, failures };
            });

            res.json({
                success: true,
                message: `成功导入 ${results.successes.length} 个学生，失败 ${results.failures.length} 个`,
                data: {
                    successes: results.successes,
                    failures: results.failures
                }
            });
        } catch (error) {
            console.error('批量导入学生失败:', error);
            res.status(500).json({
                success: false,
                message: '批量导入学生失败',
                error: error.message
            });
        }
    }
};

module.exports = studentController;