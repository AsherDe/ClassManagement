# API 接口文档

## 概述

石河子大学班级事务管理系统提供 RESTful API 接口，支持完整的班级事务管理功能。所有接口都经过精心设计，充分展示了与 PostgreSQL 数据库的高级交互能力。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 分页响应
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "code": "ERROR_CODE"
}
```

## 系统信息接口

### 1. 获取系统概览
**GET** `/`

获取系统基本信息和功能概述。

**响应示例:**
```json
{
  "success": true,
  "message": "石河子大学班级事务管理系统 API",
  "version": "1.0.0",
  "endpoints": {
    "students": "/api/students",
    "grades": "/api/grades",
    "classes": "/api/classes"
  },
  "features": [
    "SQL复杂查询",
    "窗口函数应用",
    "存储过程调用"
  ]
}
```

### 2. 健康检查
**GET** `/health`

检查系统和数据库连接状态。

**响应示例:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-12-17T10:30:00Z",
  "database": "connected",
  "uptime": 3600
}
```

### 3. 数据库信息
**GET** `/db-info`

获取数据库统计信息，展示系统数据规模。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "用户总数": 25,
      "学生总数": 20,
      "教师总数": 4,
      "班级总数": 3,
      "课程总数": 10,
      "成绩记录总数": 48,
      "考勤记录总数": 86,
      "活动总数": 8
    },
    "database_info": {
      "version": "PostgreSQL 17.0",
      "size": "12 MB",
      "name": "class_management_system"
    }
  }
}
```

## 学生管理接口

### 1. 获取学生列表
**GET** `/students`

获取学生列表，支持分页、搜索和过滤。

**查询参数:**
- `page` (number): 页码，默认 1
- `limit` (number): 每页数量，默认 10
- `class_id` (number): 班级ID过滤
- `status` (string): 学生状态过滤
- `search` (string): 搜索关键词（姓名或学号）

**SQL特性展示:**
- 复杂多表连接查询
- 条件过滤和分页
- ILIKE模糊搜索

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1005,
      "student_code": "20210101",
      "name": "陈浩",
      "gender": "male",
      "birth_date": "2003-01-15",
      "class_id": 1,
      "class_name": "计算机2021-1班",
      "class_code": "CS2021-1",
      "major": "计算机科学与技术",
      "department": "计算机科学与技术学院",
      "gpa": 3.45,
      "total_credits": 12.5,
      "status": "enrolled"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "pages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 2. 获取学生详情
**GET** `/students/:id`

获取指定学生的详细信息，包括学业统计和考勤统计。

**SQL特性展示:**
- 视图查询 (`v_student_grade_summary`, `v_attendance_statistics`)
- 多表关联查询

**响应示例:**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1005,
      "student_code": "20210101",
      "name": "陈浩",
      "gender": "male",
      "birth_date": "2003-01-15",
      "class_name": "计算机2021-1班",
      "phone": "13111111111",
      "email": "student001@stu.shzu.edu.cn",
      "home_address": "新疆石河子市",
      "emergency_contact": "陈父",
      "emergency_phone": "13911111111",
      "gpa": 3.45,
      "total_credits": 12.5,
      "status": "enrolled"
    },
    "gradeStats": {
      "total_courses": 4,
      "avg_score": 86.5,
      "gpa": 3.45,
      "class_rank": 3,
      "overall_rank": 8,
      "excellent_count": 1,
      "good_count": 2,
      "fail_count": 0
    },
    "attendanceStats": {
      "total_records": 15,
      "present_count": 13,
      "absent_count": 1,
      "late_count": 1,
      "attendance_rate": 86.67,
      "attendance_grade": "良好"
    }
  }
}
```

### 3. 获取学生成绩单
**GET** `/students/:id/transcript`

获取学生完整成绩单，按学期分组。

**SQL特性展示:**
- 存储函数调用 (`generate_student_transcript`)
- 数据分组和排序

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "academic_year": "2024-2025",
      "semester": "2024-1",
      "courses": [
        {
          "course_code": "CS101",
          "course_name": "计算机科学导论",
          "credits": 3.0,
          "total_score": 87.5,
          "letter_grade": "B+",
          "grade_point": 3.5,
          "is_pass": true,
          "is_retake": false
        }
      ]
    }
  ]
}
```

### 4. 获取学生考勤记录
**GET** `/students/:id/attendance`

获取学生考勤记录，支持日期范围和类型过滤。

**查询参数:**
- `start_date` (string): 开始日期 (YYYY-MM-DD)
- `end_date` (string): 结束日期 (YYYY-MM-DD)
- `attendance_type` (string): 考勤类型 (course/activity/meeting)

**SQL特性展示:**
- 存储函数调用 (`get_student_attendance_rate`)
- 日期范围查询
- LEFT JOIN多表关联

**响应示例:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "attendance_date": "2024-09-02",
        "attendance_type": "course",
        "status": "present",
        "check_in_time": "2024-09-02T07:55:00Z",
        "course_name": "计算机科学导论",
        "course_code": "CS101",
        "teacher_name": "张伟"
      }
    ],
    "statistics": {
      "attendance_rate": 86.67
    }
  }
}
```

### 5. 获取班级学生排名
**GET** `/students/class/:class_id/ranking`

获取指定班级的学生排名信息。

**SQL特性展示:**
- 视图查询 (`v_student_grade_summary`)
- 窗口函数 (ROW_NUMBER, RANK)
- 成绩统计分析

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "student_id": 1006,
      "student_code": "20210102",
      "student_name": "赵丽",
      "gpa": 3.85,
      "class_rank": 1,
      "total_courses": 4,
      "earned_credits": 14.0,
      "excellent_count": 3,
      "good_count": 1,
      "fail_count": 0
    }
  ]
}
```

## 成绩管理接口

### 1. 获取成绩列表
**GET** `/grades`

获取成绩记录列表，支持多维度过滤。

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量
- `course_id` (number): 课程ID
- `class_id` (number): 班级ID
- `semester` (string): 学期
- `academic_year` (string): 学年
- `student_id` (number): 学生ID

**SQL特性展示:**
- 复杂多表关联查询
- 动态条件过滤
- 分页查询

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1005,
      "course_id": 1,
      "semester": "2024-1",
      "academic_year": "2024-2025",
      "regular_score": 85.0,
      "midterm_score": 88.0,
      "final_score": 90.0,
      "total_score": 87.5,
      "letter_grade": "B+",
      "grade_point": 3.5,
      "is_pass": true,
      "student_code": "20210101",
      "student_name": "陈浩",
      "course_code": "CS101",
      "course_name": "计算机科学导论",
      "class_name": "计算机2021-1班",
      "teacher_name": "张伟"
    }
  ]
}
```

### 2. 录入成绩
**POST** `/grades`

录入单个学生成绩。

**请求体:**
```json
{
  "student_id": 1005,
  "course_id": 1,
  "semester": "2024-1",
  "academic_year": "2024-2025",
  "regular_score": 85.0,
  "midterm_score": 88.0,
  "final_score": 90.0,
  "exam_date": "2024-01-15",
  "is_retake": false
}
```

**SQL特性展示:**
- 触发器自动计算 (总分、等级、绩点)
- 唯一约束防重复
- 外键约束验证

### 3. 批量导入成绩
**POST** `/grades/batch-import`

批量导入课程成绩，使用存储过程处理。

**请求体:**
```json
{
  "course_id": 1,
  "semester": "2024-1",
  "academic_year": "2024-2025",
  "grades": [
    {
      "student_id": 1005,
      "regular_score": 85.0,
      "midterm_score": 88.0,
      "final_score": 90.0
    },
    {
      "student_id": 1006,
      "regular_score": 90.0,
      "midterm_score": 92.0,
      "final_score": 95.0
    }
  ]
}
```

**SQL特性展示:**
- 存储过程调用 (`batch_import_grades`)
- 自定义数据类型 (`grades_data[]`)
- 事务处理
- 批量数据处理

### 4. 获取课程成绩统计
**GET** `/grades/course/:course_id/statistics/:semester/:academic_year`

获取指定课程的成绩统计信息。

**SQL特性展示:**
- 存储函数调用 (`get_course_grade_statistics`)
- 聚合函数统计
- 分组统计查询

**响应示例:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_students": 15,
      "avg_score": 82.5,
      "max_score": 95.0,
      "min_score": 65.0,
      "pass_count": 14,
      "fail_count": 1,
      "pass_rate": 93.33,
      "excellent_count": 5,
      "good_count": 7,
      "average_count": 2,
      "below_average_count": 1
    },
    "gradeDistribution": [
      {
        "letter_grade": "A+",
        "count": 2,
        "percentage": 13.33
      },
      {
        "letter_grade": "A",
        "count": 3,
        "percentage": 20.0
      }
    ],
    "scoreRangeDistribution": [
      {
        "score_range": "90-100",
        "count": 5
      },
      {
        "score_range": "80-89",
        "count": 7
      }
    ]
  }
}
```

### 5. 获取班级成绩总览
**GET** `/grades/class/:class_id/overview/:semester/:academic_year`

获取班级在指定学期的所有课程成绩总览。

**SQL特性展示:**
- 复杂多表关联
- 分组聚合统计
- 成绩分析计算

**响应示例:**
```json
{
  "success": true,
  "data": {
    "courseStatistics": [
      {
        "course_code": "CS101",
        "course_name": "计算机科学导论",
        "credits": 3.0,
        "student_count": 10,
        "avg_score": 85.5,
        "pass_count": 10,
        "pass_rate": 100.0,
        "max_score": 95.0,
        "min_score": 78.0,
        "teacher_name": "张伟"
      }
    ],
    "classStatistics": {
      "total_students": 10,
      "overall_avg_score": 84.2,
      "total_pass": 38,
      "total_exams": 40,
      "overall_pass_rate": 95.0
    }
  }
}
```

### 6. 成绩分析报告
**GET** `/grades/course/:course_id/analysis/:semester/:academic_year`

获取详细的成绩分析报告。

**SQL特性展示:**
- CTE复杂查询
- 窗口函数排名
- 统计分析计算

**响应示例:**
```json
{
  "success": true,
  "data": {
    "gradeAnalysis": [
      {
        "student_id": 1006,
        "student_code": "20210102",
        "student_name": "赵丽",
        "total_score": 95.0,
        "letter_grade": "A",
        "rank_overall": 1,
        "rank_in_class": 1,
        "performance_level": "优秀"
      }
    ],
    "statistics": {
      "total_students": 15,
      "avg_score": 82.5,
      "pass_rate": 93.33
    }
  }
}
```

## 数据验证

### 输入验证规则

#### 学生信息验证
```javascript
const studentValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('姓名不能为空')
      .isLength({ max: 100 }).withMessage('姓名长度不能超过100字符'),
    body('gender').optional().isIn(['male', 'female'])
      .withMessage('性别必须是male或female'),
    body('phone').optional().isMobilePhone('zh-CN')
      .withMessage('手机号格式不正确'),
    body('email').optional().isEmail()
      .withMessage('邮箱格式不正确')
  ];
};
```

#### 成绩验证
```javascript
const gradeValidationRules = () => {
  return [
    body('student_id').isInt({ min: 1 })
      .withMessage('学生ID必须是正整数'),
    body('course_id').isInt({ min: 1 })
      .withMessage('课程ID必须是正整数'),
    body('semester').matches(/^\d{4}-[12]$/)
      .withMessage('学期格式应为YYYY-1或YYYY-2'),
    body('academic_year').matches(/^\d{4}-\d{4}$/)
      .withMessage('学年格式应为YYYY-YYYY'),
    body('regular_score').optional().isFloat({ min: 0, max: 100 })
      .withMessage('平时成绩必须在0-100之间'),
    body('midterm_score').optional().isFloat({ min: 0, max: 100 })
      .withMessage('期中成绩必须在0-100之间'),
    body('final_score').optional().isFloat({ min: 0, max: 100 })
      .withMessage('期末成绩必须在0-100之间')
  ];
};
```

## 错误处理

### HTTP状态码
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权访问
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `500` - 服务器内部错误

### 数据库错误处理
```javascript
// PostgreSQL错误码处理
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
}
```

## 性能优化

### 1. 数据库连接池
```javascript
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. 查询优化
- 使用索引优化查询性能
- 视图缓存复杂查询结果
- 存储过程减少网络传输
- 分页查询限制数据量

### 3. 响应缓存
```javascript
// 缓存系统信息（示例）
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.originalSend = res.send;
    res.send = (body) => {
      cache.set(key, JSON.parse(body), duration);
      res.originalSend(body);
    };
    
    next();
  };
};
```

## 安全性

### 1. 输入验证
- 使用 express-validator 验证所有输入
- SQL注入防护（参数化查询）
- XSS防护（输入过滤）

### 2. 安全头部
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

### 3. 请求限制
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
```

## 测试用例

### 1. 单元测试示例
```javascript
describe('Student Controller', () => {
  test('should get student list', async () => {
    const response = await request(app)
      .get('/api/students')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });
  
  test('should get student by id', async () => {
    const response = await request(app)
      .get('/api/students/1005')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.student).toBeDefined();
    expect(response.body.data.gradeStats).toBeDefined();
  });
});
```

### 2. 集成测试
```javascript
describe('Grade Management Integration', () => {
  test('should create and retrieve grade', async () => {
    // 创建成绩
    const createResponse = await request(app)
      .post('/api/grades')
      .send({
        student_id: 1005,
        course_id: 1,
        semester: '2024-1',
        academic_year: '2024-2025',
        regular_score: 85,
        midterm_score: 88,
        final_score: 90
      })
      .expect(201);
    
    // 查询成绩
    const getResponse = await request(app)
      .get(`/api/grades/${createResponse.body.data.id}`)
      .expect(200);
    
    expect(getResponse.body.data.total_score).toBeCloseTo(87.5);
  });
});
```

## 扩展接口

系统还包含以下模块的完整接口（详细文档略）：

### 班级管理
- `GET /classes` - 班级列表
- `GET /classes/:id` - 班级详情
- `POST /classes` - 创建班级
- `PUT /classes/:id` - 更新班级

### 课程管理
- `GET /courses` - 课程列表
- `GET /courses/schedule` - 课程安排
- `POST /courses` - 创建课程

### 考勤管理
- `GET /attendance` - 考勤记录
- `POST /attendance/batch` - 批量考勤
- `GET /attendance/statistics` - 考勤统计

### 活动管理
- `GET /activities` - 活动列表
- `POST /activities` - 创建活动
- `PUT /activities/:id` - 更新活动

### 财务管理
- `GET /funds` - 班费记录
- `POST /funds` - 添加收支
- `PUT /funds/:id/approve` - 审批班费

### 统计分析
- `GET /statistics/overview` - 系统概览
- `GET /statistics/performance` - 绩效统计
- `GET /statistics/trends` - 趋势分析

## 总结

本API文档展示了石河子大学班级事务管理系统的核心接口设计，重点突出了以下PostgreSQL数据库特性的应用：

1. **复杂查询**: 多表关联、条件过滤、分页查询
2. **窗口函数**: 排名计算、移动平均、统计分析
3. **存储过程**: 批量处理、复杂业务逻辑
4. **视图优化**: 复杂查询结果缓存
5. **触发器**: 数据完整性自动维护
6. **事务处理**: 保证数据一致性
7. **性能优化**: 索引使用、查询优化

这些接口不仅满足实际业务需求，更重要的是展示了数据库课程设计中SQL编程的高级技巧和最佳实践。