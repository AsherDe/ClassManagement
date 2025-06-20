const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 导入数据库连接
const db = require('./database/connection');

// 导入路由
const routes = require('./routes');

// 全局中间件
app.use(helmet()); // 安全头部设置

// CORS配置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求限制
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP每15分钟最多100个请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    
    res.send = function(data) {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        originalSend.call(this, data);
    };
    
    next();
});

// API路由
app.use('/api', routes);

// 静态文件服务 (上传的文件)
app.use('/uploads', express.static('uploads'));

// 根路径
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '欢迎使用石河子大学班级事务管理系统',
        system: '石河子大学班级事务管理系统',
        version: '1.0.0',
        description: '基于PostgreSQL的数据库课程设计项目',
        features: [
            'PostgreSQL高级特性应用',
            'RESTful API设计',
            '复杂SQL查询优化',
            '存储过程和触发器',
            '视图和索引优化',
            '数据完整性约束'
        ],
        documentation: '/api',
        health_check: '/api/health',
        database_info: '/api/db-info'
    });
});

// 404错误处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '请求的资源不存在',
        path: req.originalUrl,
        method: req.method
    });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    
    // 数据库错误处理
    if (err.code) {
        switch (err.code) {
            case '23505': // 唯一约束违反
                return res.status(400).json({
                    success: false,
                    message: '数据重复，违反唯一性约束',
                    error: err.detail
                });
            case '23503': // 外键约束违反
                return res.status(400).json({
                    success: false,
                    message: '关联数据不存在，违反外键约束',
                    error: err.detail
                });
            case '23514': // 检查约束违反
                return res.status(400).json({
                    success: false,
                    message: '数据不符合检查约束条件',
                    error: err.detail
                });
            case '42P01': // 表不存在
                return res.status(500).json({
                    success: false,
                    message: '数据库表不存在',
                    error: '请检查数据库初始化'
                });
        }
    }
    
    // JWT错误处理
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: '无效的访问令牌'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: '访问令牌已过期'
        });
    }
    
    // 验证错误处理
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            errors: err.errors
        });
    }
    
    // 默认服务器错误
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? '服务器内部错误' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在优雅关闭服务器...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
        db.pool.end(() => {
            console.log('数据库连接池已关闭');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在优雅关闭服务器...');
    server.close(() => {
        console.log('HTTP服务器已关闭');
        db.pool.end(() => {
            console.log('数据库连接池已关闭');
            process.exit(0);
        });
    });
});

// 启动服务器
const server = app.listen(PORT, async () => {
    console.log(`
╭─────────────────────────────────────────────────────────────╮
│                                                             │
│           石河子大学班级事务管理系统 API 服务                │
│                                                             │
│  🚀 服务器运行中:  http://localhost:${PORT}                   │
│  📚 API文档:      http://localhost:${PORT}/api              │
│  ❤️  健康检查:     http://localhost:${PORT}/api/health        │
│  📊 数据库信息:    http://localhost:${PORT}/api/db-info       │
│                                                             │
│  💾 数据库: PostgreSQL                                      │
│  🏗️  架构: RESTful API                                      │
│  🔧 环境: ${process.env.NODE_ENV || 'development'}                                        │
│                                                             │
╰─────────────────────────────────────────────────────────────╯
    `);
    
    // 测试数据库连接
    const dbConnected = await db.testConnection();
    if (dbConnected) {
        console.log('✅ 数据库连接成功');
    } else {
        console.log('❌ 数据库连接失败');
    }
    
    console.log(`📅 服务器启动时间: ${new Date().toLocaleString('zh-CN')}`);
});

module.exports = app;