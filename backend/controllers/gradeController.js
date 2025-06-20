const db = require('../database/connection');
const { validationResult } = require('express-validator');

const gradeController = {
    // 获取成绩列表
    async getGrades(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                course_id, 
                class_id, 
                semester, 
                academic_year,
                student_id 
            } = req.query;

            let gradesQuery = `
                SELECT 
                    g.id, g.student_id, g.course_id, g.semester, g.academic_year,
                    g.regular_score, g.midterm_score, g.final_score, g.total_score,
                    g.letter_grade, g.grade_point, g.is_pass, g.is_retake,
                    g.exam_date, g.recorded_at,
                    s.student_code, s.name as student_name,
                    c.course_code, c.course_name, c.credits,
                    cl.class_name, cl.class_code,
                    t.name as teacher_name
                FROM grades g
                JOIN students s ON g.student_id = s.id
                JOIN courses c ON g.course_id = c.id
                JOIN classes cl ON s.class_id = cl.id
                LEFT JOIN course_schedule cs ON (cs.course_id = c.id AND cs.class_id = cl.id)
                LEFT JOIN teachers t ON cs.teacher_id = t.id
                WHERE 1=1
            `;

            let queryParams = [];
            let paramCount = 0;

            if (course_id) {
                paramCount++;
                gradesQuery += ` AND g.course_id = $${paramCount}`;
                queryParams.push(course_id);
            }

            if (class_id) {
                paramCount++;
                gradesQuery += ` AND s.class_id = $${paramCount}`;
                queryParams.push(class_id);
            }

            if (semester) {
                paramCount++;
                gradesQuery += ` AND g.semester = $${paramCount}`;
                queryParams.push(semester);
            }

            if (academic_year) {
                paramCount++;
                gradesQuery += ` AND g.academic_year = $${paramCount}`;
                queryParams.push(academic_year);
            }

            if (student_id) {
                paramCount++;
                gradesQuery += ` AND g.student_id = $${paramCount}`;
                queryParams.push(student_id);
            }

            gradesQuery += ` ORDER BY g.academic_year DESC, g.semester DESC, cl.class_code, s.student_code`;

            // 分页
            const offset = (page - 1) * limit;
            const dataQuery = gradesQuery + ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            queryParams.push(limit, offset);

            // 计算总数
            const countQuery = gradesQuery.replace(
                /SELECT[\s\S]*?FROM grades g/,
                'SELECT COUNT(*) as total FROM grades g'
            );

            const [gradesResult, countResult] = await Promise.all([
                db.query(dataQuery, queryParams),
                db.query(countQuery, queryParams.slice(0, paramCount))
            ]);

            const total = parseInt(countResult.rows[0].total);

            res.json({
                success: true,
                data: gradesResult.rows,
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
            console.error('获取成绩列表失败:', error);
            res.status(500).json({
                success: false,
                message: '获取成绩列表失败',
                error: error.message
            });
        }
    },

    // 录入单个成绩
    async createGrade(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: '输入数据验证失败',
                    errors: errors.array()
                });
            }

            const gradeData = {
                ...req.body,
                recorder_id: req.user.id,
                recorded_at: new Date()
            };

            // 检查是否已存在该学生该课程的成绩
            const existingGrade = await db.findOne('grades', {
                student_id: gradeData.student_id,
                course_id: gradeData.course_id,
                semester: gradeData.semester,
                academic_year: gradeData.academic_year,
                is_retake: gradeData.is_retake || false
            });

            if (existingGrade) {
                return res.status(400).json({
                    success: false,
                    message: '该学生该课程的成绩已存在'
                });
            }

            const newGrade = await db.create('grades', gradeData);

            res.status(201).json({
                success: true,
                message: '成绩录入成功',
                data: newGrade
            });
        } catch (error) {
            console.error('录入成绩失败:', error);
            res.status(500).json({
                success: false,
                message: '录入成绩失败',
                error: error.message
            });
        }
    },

    // 批量导入成绩
    async batchImportGrades(req, res) {
        try {
            const { course_id, semester, academic_year, grades } = req.body;

            if (!Array.isArray(grades) || grades.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: '成绩数据不能为空'
                });
            }

            // 使用存储过程批量导入
            const gradesArray = grades.map(grade => `(${grade.student_id},${grade.regular_score || 'NULL'},${grade.midterm_score || 'NULL'},${grade.final_score || 'NULL'})`);
            
            const batchImportQuery = `
                CALL batch_import_grades($1, $2, $3, ARRAY[${gradesArray.join(',')}]::grades_data[])
            `;

            await db.query(batchImportQuery, [course_id, semester, academic_year]);

            res.json({
                success: true,
                message: `成功批量导入 ${grades.length} 条成绩记录`
            });
        } catch (error) {
            console.error('批量导入成绩失败:', error);
            res.status(500).json({
                success: false,
                message: '批量导入成绩失败',
                error: error.message
            });
        }
    },

    // 更新成绩
    async updateGrade(req, res) {
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
            const updateData = {
                ...req.body,
                recorder_id: req.user.id,
                updated_at: new Date()
            };

            // 移除不允许更新的字段
            delete updateData.id;
            delete updateData.student_id;
            delete updateData.course_id;
            delete updateData.recorded_at;
            delete updateData.created_at;

            const updatedGrade = await db.update('grades', updateData, { id });

            if (!updatedGrade) {
                return res.status(404).json({
                    success: false,
                    message: '成绩记录不存在'
                });
            }

            res.json({
                success: true,
                message: '成绩更新成功',
                data: updatedGrade
            });
        } catch (error) {
            console.error('更新成绩失败:', error);
            res.status(500).json({
                success: false,
                message: '更新成绩失败',
                error: error.message
            });
        }
    },

    // 删除成绩
    async deleteGrade(req, res) {
        try {
            const { id } = req.params;

            const deletedGrades = await db.remove('grades', { id });

            if (deletedGrades.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '成绩记录不存在'
                });
            }

            res.json({
                success: true,
                message: '成绩删除成功'
            });
        } catch (error) {
            console.error('删除成绩失败:', error);
            res.status(500).json({
                success: false,
                message: '删除成绩失败',
                error: error.message
            });
        }
    },

    // 获取课程成绩统计
    async getCourseGradeStatistics(req, res) {
        try {
            const { course_id, semester, academic_year } = req.params;

            // 使用存储函数获取统计数据
            const statsResult = await db.executeFunction('get_course_grade_statistics', [
                course_id, semester, academic_year
            ]);

            if (statsResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '未找到该课程的成绩数据'
                });
            }

            const stats = statsResult[0];

            // 获取成绩分布
            const distributionQuery = `
                SELECT 
                    g.letter_grade,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
                FROM grades g
                WHERE g.course_id = $1 AND g.semester = $2 AND g.academic_year = $3
                GROUP BY g.letter_grade
                ORDER BY 
                    CASE g.letter_grade
                        WHEN 'A+' THEN 1 WHEN 'A' THEN 2
                        WHEN 'B+' THEN 3 WHEN 'B' THEN 4
                        WHEN 'C+' THEN 5 WHEN 'C' THEN 6
                        WHEN 'D' THEN 7 WHEN 'F' THEN 8
                    END
            `;

            const distributionResult = await db.query(distributionQuery, [course_id, semester, academic_year]);

            // 获取分数段分布
            const scoreRangeQuery = `
                SELECT 
                    CASE 
                        WHEN total_score >= 90 THEN '90-100'
                        WHEN total_score >= 80 THEN '80-89'
                        WHEN total_score >= 70 THEN '70-79'
                        WHEN total_score >= 60 THEN '60-69'
                        ELSE '0-59'
                    END as score_range,
                    COUNT(*) as count
                FROM grades
                WHERE course_id = $1 AND semester = $2 AND academic_year = $3
                    AND total_score IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN total_score >= 90 THEN '90-100'
                        WHEN total_score >= 80 THEN '80-89'
                        WHEN total_score >= 70 THEN '70-79'
                        WHEN total_score >= 60 THEN '60-69'
                        ELSE '0-59'
                    END
                ORDER BY 
                    CASE 
                        WHEN total_score >= 90 THEN 1
                        WHEN total_score >= 80 THEN 2
                        WHEN total_score >= 70 THEN 3
                        WHEN total_score >= 60 THEN 4
                        ELSE 5
                    END
            `;

            const scoreRangeResult = await db.query(scoreRangeQuery, [course_id, semester, academic_year]);

            res.json({
                success: true,
                data: {
                    statistics: stats,
                    gradeDistribution: distributionResult.rows,
                    scoreRangeDistribution: scoreRangeResult.rows
                }
            });
        } catch (error) {
            console.error('获取课程成绩统计失败:', error);
            res.status(500).json({
                success: false,
                message: '获取课程成绩统计失败',
                error: error.message
            });
        }
    },

    // 获取班级成绩总览
    async getClassGradeOverview(req, res) {
        try {
            const { class_id, semester, academic_year } = req.params;

            const overviewQuery = `
                SELECT 
                    c.course_code, c.course_name, c.credits,
                    COUNT(g.id) as student_count,
                    ROUND(AVG(g.total_score), 2) as avg_score,
                    COUNT(CASE WHEN g.is_pass THEN 1 END) as pass_count,
                    ROUND(COUNT(CASE WHEN g.is_pass THEN 1 END) * 100.0 / COUNT(g.id), 2) as pass_rate,
                    MAX(g.total_score) as max_score,
                    MIN(g.total_score) as min_score,
                    t.name as teacher_name
                FROM courses c
                JOIN grades g ON c.id = g.course_id
                JOIN students s ON g.student_id = s.id
                JOIN course_schedule cs ON (c.id = cs.course_id AND s.class_id = cs.class_id)
                JOIN teachers t ON cs.teacher_id = t.id
                WHERE s.class_id = $1 
                    AND g.semester = $2 
                    AND g.academic_year = $3
                GROUP BY c.id, c.course_code, c.course_name, c.credits, t.name
                ORDER BY c.course_code
            `;

            const overviewResult = await db.query(overviewQuery, [class_id, semester, academic_year]);

            // 获取班级整体统计
            const classStatsQuery = `
                SELECT 
                    COUNT(DISTINCT g.student_id) as total_students,
                    ROUND(AVG(g.total_score), 2) as overall_avg_score,
                    COUNT(CASE WHEN g.is_pass THEN 1 END) as total_pass,
                    COUNT(g.id) as total_exams,
                    ROUND(COUNT(CASE WHEN g.is_pass THEN 1 END) * 100.0 / COUNT(g.id), 2) as overall_pass_rate
                FROM grades g
                JOIN students s ON g.student_id = s.id
                WHERE s.class_id = $1 AND g.semester = $2 AND g.academic_year = $3
            `;

            const classStatsResult = await db.query(classStatsQuery, [class_id, semester, academic_year]);

            res.json({
                success: true,
                data: {
                    courseStatistics: overviewResult.rows,
                    classStatistics: classStatsResult.rows[0] || {}
                }
            });
        } catch (error) {
            console.error('获取班级成绩总览失败:', error);
            res.status(500).json({
                success: false,
                message: '获取班级成绩总览失败',
                error: error.message
            });
        }
    },

    // 成绩分析报告
    async getGradeAnalysisReport(req, res) {
        try {
            const { course_id, semester, academic_year } = req.params;

            // 获取详细的成绩分析数据
            const analysisQuery = `
                WITH grade_analysis AS (
                    SELECT 
                        g.*,
                        s.student_code, s.name as student_name,
                        c.course_name, c.credits,
                        cl.class_name,
                        ROW_NUMBER() OVER (ORDER BY g.total_score DESC) as rank_overall,
                        ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY g.total_score DESC) as rank_in_class,
                        CASE 
                            WHEN g.total_score >= (SELECT AVG(total_score) + STDDEV(total_score) FROM grades WHERE course_id = g.course_id AND semester = g.semester AND academic_year = g.academic_year)
                            THEN '优秀'
                            WHEN g.total_score >= (SELECT AVG(total_score) FROM grades WHERE course_id = g.course_id AND semester = g.semester AND academic_year = g.academic_year)
                            THEN '良好'
                            WHEN g.total_score >= (SELECT AVG(total_score) - STDDEV(total_score) FROM grades WHERE course_id = g.course_id AND semester = g.semester AND academic_year = g.academic_year)
                            THEN '一般'
                            ELSE '待改进'
                        END as performance_level
                    FROM grades g
                    JOIN students s ON g.student_id = s.id
                    JOIN courses c ON g.course_id = c.id
                    JOIN classes cl ON s.class_id = cl.id
                    WHERE g.course_id = $1 AND g.semester = $2 AND g.academic_year = $3
                )
                SELECT * FROM grade_analysis
                ORDER BY rank_overall
            `;

            const analysisResult = await db.query(analysisQuery, [course_id, semester, academic_year]);

            // 获取课程统计信息
            const statsResult = await db.executeFunction('get_course_grade_statistics', [
                course_id, semester, academic_year
            ]);

            res.json({
                success: true,
                data: {
                    gradeAnalysis: analysisResult.rows,
                    statistics: statsResult[0] || {}
                }
            });
        } catch (error) {
            console.error('获取成绩分析报告失败:', error);
            res.status(500).json({
                success: false,
                message: '获取成绩分析报告失败',
                error: error.message
            });
        }
    }
};

module.exports = gradeController;