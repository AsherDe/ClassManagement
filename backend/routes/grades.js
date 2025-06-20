const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

// 输入验证规则
const gradeValidationRules = () => {
    return [
        body('student_id').isInt({ min: 1 }).withMessage('学生ID必须是正整数'),
        body('course_id').isInt({ min: 1 }).withMessage('课程ID必须是正整数'),
        body('semester').notEmpty().withMessage('学期不能为空').matches(/^\d{4}-[12]$/).withMessage('学期格式应为YYYY-1或YYYY-2'),
        body('academic_year').notEmpty().withMessage('学年不能为空').matches(/^\d{4}-\d{4}$/).withMessage('学年格式应为YYYY-YYYY'),
        body('regular_score').optional().isFloat({ min: 0, max: 100 }).withMessage('平时成绩必须在0-100之间'),
        body('midterm_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期中成绩必须在0-100之间'),
        body('final_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期末成绩必须在0-100之间'),
        body('total_score').optional().isFloat({ min: 0, max: 100 }).withMessage('总评成绩必须在0-100之间'),
        body('is_retake').optional().isBoolean().withMessage('是否重修必须是布尔值'),
        body('exam_date').optional().isISO8601().withMessage('考试日期格式不正确')
    ];
};

const updateGradeValidationRules = () => {
    return [
        body('regular_score').optional().isFloat({ min: 0, max: 100 }).withMessage('平时成绩必须在0-100之间'),
        body('midterm_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期中成绩必须在0-100之间'),
        body('final_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期末成绩必须在0-100之间'),
        body('total_score').optional().isFloat({ min: 0, max: 100 }).withMessage('总评成绩必须在0-100之间'),
        body('exam_date').optional().isISO8601().withMessage('考试日期格式不正确')
    ];
};

const batchImportValidationRules = () => {
    return [
        body('course_id').isInt({ min: 1 }).withMessage('课程ID必须是正整数'),
        body('semester').notEmpty().withMessage('学期不能为空').matches(/^\d{4}-[12]$/).withMessage('学期格式应为YYYY-1或YYYY-2'),
        body('academic_year').notEmpty().withMessage('学年不能为空').matches(/^\d{4}-\d{4}$/).withMessage('学年格式应为YYYY-YYYY'),
        body('grades').isArray({ min: 1 }).withMessage('成绩数据必须是非空数组'),
        body('grades.*.student_id').isInt({ min: 1 }).withMessage('学生ID必须是正整数'),
        body('grades.*.regular_score').optional().isFloat({ min: 0, max: 100 }).withMessage('平时成绩必须在0-100之间'),
        body('grades.*.midterm_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期中成绩必须在0-100之间'),
        body('grades.*.final_score').optional().isFloat({ min: 0, max: 100 }).withMessage('期末成绩必须在0-100之间')
    ];
};

/**
 * @route GET /api/grades
 * @desc 获取成绩列表
 * @access Private
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 10)
 * @query {number} course_id - 课程ID (可选)
 * @query {number} class_id - 班级ID (可选)
 * @query {string} semester - 学期 (可选)
 * @query {string} academic_year - 学年 (可选)
 * @query {number} student_id - 学生ID (可选)
 */
router.get('/', gradeController.getGrades);

/**
 * @route POST /api/grades
 * @desc 录入单个成绩
 * @access Private
 * @body {object} gradeData - 成绩数据
 */
router.post('/', gradeValidationRules(), gradeController.createGrade);

/**
 * @route POST /api/grades/batch-import
 * @desc 批量导入成绩
 * @access Private
 * @body {number} course_id - 课程ID
 * @body {string} semester - 学期
 * @body {string} academic_year - 学年
 * @body {Array} grades - 成绩数据数组
 */
router.post('/batch-import', batchImportValidationRules(), gradeController.batchImportGrades);

/**
 * @route PUT /api/grades/:id
 * @desc 更新成绩
 * @access Private
 * @param {number} id - 成绩记录ID
 */
router.put('/:id', updateGradeValidationRules(), gradeController.updateGrade);

/**
 * @route DELETE /api/grades/:id
 * @desc 删除成绩
 * @access Private
 * @param {number} id - 成绩记录ID
 */
router.delete('/:id', gradeController.deleteGrade);

/**
 * @route GET /api/grades/course/:course_id/statistics/:semester/:academic_year
 * @desc 获取课程成绩统计
 * @access Private
 * @param {number} course_id - 课程ID
 * @param {string} semester - 学期
 * @param {string} academic_year - 学年
 */
router.get('/course/:course_id/statistics/:semester/:academic_year', gradeController.getCourseGradeStatistics);

/**
 * @route GET /api/grades/class/:class_id/overview/:semester/:academic_year
 * @desc 获取班级成绩总览
 * @access Private
 * @param {number} class_id - 班级ID
 * @param {string} semester - 学期
 * @param {string} academic_year - 学年
 */
router.get('/class/:class_id/overview/:semester/:academic_year', gradeController.getClassGradeOverview);

/**
 * @route GET /api/grades/course/:course_id/analysis/:semester/:academic_year
 * @desc 获取成绩分析报告
 * @access Private
 * @param {number} course_id - 课程ID
 * @param {string} semester - 学期
 * @param {string} academic_year - 学年
 */
router.get('/course/:course_id/analysis/:semester/:academic_year', gradeController.getGradeAnalysisReport);

module.exports = router;