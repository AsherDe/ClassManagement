const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const studentController = require('../controllers/studentController');
// const authMiddleware = require('../middleware/auth');

// 输入验证规则
const studentValidationRules = () => {
    return [
        body('name').notEmpty().withMessage('姓名不能为空').isLength({ max: 100 }).withMessage('姓名长度不能超过100字符'),
        body('gender').optional().isIn(['male', 'female']).withMessage('性别必须是male或female'),
        body('birth_date').optional().isISO8601().withMessage('出生日期格式不正确'),
        body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
        body('email').optional().isEmail().withMessage('邮箱格式不正确'),
        body('class_id').optional().isInt({ min: 1 }).withMessage('班级ID必须是正整数'),
        body('status').optional().isIn(['enrolled', 'suspended', 'graduated', 'dropped']).withMessage('状态值不正确')
    ];
};

const updateStudentValidationRules = () => {
    return [
        body('name').optional().notEmpty().withMessage('姓名不能为空').isLength({ max: 100 }).withMessage('姓名长度不能超过100字符'),
        body('gender').optional().isIn(['male', 'female']).withMessage('性别必须是male或female'),
        body('birth_date').optional().isISO8601().withMessage('出生日期格式不正确'),
        body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
        body('email').optional().isEmail().withMessage('邮箱格式不正确'),
        body('home_address').optional().isLength({ max: 500 }).withMessage('家庭住址长度不能超过500字符'),
        body('emergency_contact').optional().isLength({ max: 100 }).withMessage('紧急联系人姓名长度不能超过100字符'),
        body('emergency_phone').optional().isMobilePhone('zh-CN').withMessage('紧急联系人电话格式不正确'),
        body('status').optional().isIn(['enrolled', 'suspended', 'graduated', 'dropped']).withMessage('状态值不正确')
    ];
};

/**
 * @route GET /api/students
 * @desc 获取学生列表
 * @access Private
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 10)
 * @query {number} class_id - 班级ID (可选)
 * @query {string} status - 学生状态 (可选)
 * @query {string} search - 搜索关键词 (可选)
 */
router.get('/', studentController.getStudents);

/**
 * @route GET /api/students/:id
 * @desc 获取学生详细信息
 * @access Private
 * @param {number} id - 学生ID
 */
router.get('/:id', studentController.getStudentById);

/**
 * @route GET /api/students/:id/transcript
 * @desc 获取学生成绩单
 * @access Private
 * @param {number} id - 学生ID
 */
router.get('/:id/transcript', studentController.getStudentTranscript);

/**
 * @route GET /api/students/:id/attendance
 * @desc 获取学生考勤记录
 * @access Private
 * @param {number} id - 学生ID
 * @query {string} start_date - 开始日期 (可选)
 * @query {string} end_date - 结束日期 (可选)
 * @query {string} attendance_type - 考勤类型 (可选)
 */
router.get('/:id/attendance', studentController.getStudentAttendance);

/**
 * @route PUT /api/students/:id
 * @desc 更新学生信息
 * @access Private
 * @param {number} id - 学生ID
 */
router.put('/:id', updateStudentValidationRules(), studentController.updateStudent);

/**
 * @route GET /api/students/class/:class_id/ranking
 * @desc 获取班级学生排名
 * @access Private
 * @param {number} class_id - 班级ID
 */
router.get('/class/:class_id/ranking', studentController.getClassRanking);

/**
 * @route POST /api/students/import
 * @desc 批量导入学生
 * @access Private
 * @body {Array} students - 学生数据数组
 */
router.post('/import', studentController.importStudents);

module.exports = router;