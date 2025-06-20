const express = require('express');
const router = express.Router();

// 导入路由模块
const authRoutes = require('./auth');
const studentRoutes = require('./students');
const gradeRoutes = require('./grades');
const classRoutes = require('./classes');
const courseRoutes = require('./courses');
const attendanceRoutes = require('./attendance');
const activityRoutes = require('./activities');
const fundRoutes = require('./funds');
const notificationRoutes = require('./notifications');
const statisticsRoutes = require('./statistics');
const permissionRoutes = require('./permissions');

// API版本和基本信息
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '石河子大学班级事务管理系统 API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            students: '/api/students',
            grades: '/api/grades',
            classes: '/api/classes',
            courses: '/api/courses',
            attendance: '/api/attendance',
            activities: '/api/activities',
            funds: '/api/funds',
            notifications: '/api/notifications',
            statistics: '/api/statistics',
            permissions: '/api/permissions'
        },
        database: 'PostgreSQL',
        features: [
            'SQL复杂查询',
            '窗口函数应用',
            '存储过程调用',
            '视图查询',
            '触发器自动化',
            '索引优化',
            '事务处理'
        ]
    });
});

// 健康检查接口
router.get('/health', async (req, res) => {
    try {
        const db = require('../database/connection');
        
        // 测试数据库连接
        const dbTest = await db.testConnection();
        
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbTest ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// 数据库信息接口
router.get('/db-info', async (req, res) => {
    try {
        const db = require('../database/connection');
        
        const queries = [
            { name: '用户总数', query: 'SELECT COUNT(*) as count FROM users' },
            { name: '学生总数', query: 'SELECT COUNT(*) as count FROM students' },
            { name: '教师总数', query: 'SELECT COUNT(*) as count FROM teachers' },
            { name: '班级总数', query: 'SELECT COUNT(*) as count FROM classes' },
            { name: '课程总数', query: 'SELECT COUNT(*) as count FROM courses' },
            { name: '成绩记录总数', query: 'SELECT COUNT(*) as count FROM grades' },
            { name: '考勤记录总数', query: 'SELECT COUNT(*) as count FROM attendance' },
            { name: '活动总数', query: 'SELECT COUNT(*) as count FROM class_activities' }
        ];

        const results = {};
        
        for (const queryInfo of queries) {
            try {
                const result = await db.query(queryInfo.query);
                results[queryInfo.name] = parseInt(result.rows[0].count);
            } catch (error) {
                results[queryInfo.name] = `Error: ${error.message}`;
            }
        }

        // 获取数据库版本和大小信息
        const versionResult = await db.query('SELECT version()');
        const sizeResult = await db.query(`
            SELECT 
                pg_database.datname AS database_name,
                pg_size_pretty(pg_database_size(pg_database.datname)) AS size
            FROM pg_database 
            WHERE pg_database.datname = current_database()
        `);

        res.json({
            success: true,
            data: {
                statistics: results,
                database_info: {
                    version: versionResult.rows[0].version,
                    size: sizeResult.rows[0]?.size || 'Unknown',
                    name: sizeResult.rows[0]?.database_name || 'Unknown'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取数据库信息失败',
            error: error.message
        });
    }
});

// 注册路由
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/grades', gradeRoutes);
router.use('/classes', classRoutes);
router.use('/courses', courseRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/activities', activityRoutes);
router.use('/funds', fundRoutes);
router.use('/notifications', notificationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/permissions', permissionRoutes);

module.exports = router;