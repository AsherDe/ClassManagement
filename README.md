# 石河子大学班级事务管理系统

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.3+-brightgreen.svg)](https://vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.4+-blue.svg)](https://element-plus.org/)

## 项目概述

石河子大学班级事务管理系统是一个基于 PostgreSQL 数据库的课程设计项目，旨在展示数据库设计能力和 SQL 编程技能。系统采用现代化的技术栈，包含完整的前后端实现。

### 系统特色

- 🏗️ **数据库驱动**: 以 PostgreSQL 高级特性为核心
- 📊 **复杂查询**: 大量使用窗口函数、CTE、存储过程
- ⚡ **性能优化**: 索引优化、视图缓存、查询优化
- 🔄 **自动化**: 触发器实现数据完整性和自动更新
- 📈 **数据分析**: 丰富的统计报表和可视化图表
- 🎯 **实用性**: 贴近真实的班级管理业务场景

## 技术栈

### 后端技术
- **数据库**: PostgreSQL 17
- **运行时**: Node.js 16+
- **框架**: Express.js
- **数据库驱动**: pg (原生 PostgreSQL 驱动)
- **安全**: bcrypt, jsonwebtoken, helmet
- **验证**: express-validator
- **日志**: winston

### 前端技术
- **框架**: Vue.js 3.3+
- **UI组件**: Element Plus 2.4+
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **图表**: ECharts + vue-echarts
- **构建工具**: Vite
- **样式**: SCSS

### 数据库特性
- ✅ **窗口函数**: 学生排名、成绩统计
- ✅ **存储过程**: 批量数据处理、复杂业务逻辑
- ✅ **触发器**: 数据完整性、自动更新
- ✅ **视图**: 复杂查询优化、数据安全
- ✅ **索引**: B-tree、部分索引、复合索引
- ✅ **约束**: 主键、外键、检查约束、唯一约束
- ✅ **CTE查询**: 递归查询、复杂统计
- ✅ **JSON字段**: 灵活数据存储
- ✅ **数组类型**: PostgreSQL 特有功能

## 系统功能

### 核心模块

#### 1. 用户管理模块
- 学生信息管理（基本信息、学业情况）
- 教师信息管理（教学任务、工作量统计）
- 班级干部管理（班长、副班长权限）
- 权限分级控制（角色权限、操作授权）

#### 2. 班级事务模块
- 班级基本信息管理
- 班级活动组织管理
- 班费收支管理（审批流程）
- 考勤管理（课程考勤、活动考勤）

#### 3. 学业管理模块
- 课程信息管理
- 课程安排管理（时间冲突检测）
- 成绩录入查询（批量导入、统计分析）
- 学分统计（GPA计算、排名）

#### 4. 数据分析模块
- 成绩分析报告（分布统计、趋势分析）
- 考勤统计分析（出勤率、异常检测）
- 班级绩效评估（综合排名）
- 财务统计报表（收支明细、余额统计）

### 高级功能

#### SQL 复杂查询示例
```sql
-- 使用窗口函数计算学生成绩排名
SELECT 
    student_id, student_name, total_score,
    ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY total_score DESC) as class_rank,
    RANK() OVER (ORDER BY total_score DESC) as overall_rank
FROM v_student_grade_summary;

-- 使用 CTE 进行递归查询（权限继承）
WITH RECURSIVE permission_tree AS (
    SELECT id, permission_name, parent_id, 1 as level
    FROM permissions WHERE parent_id IS NULL
    UNION ALL
    SELECT p.id, p.permission_name, p.parent_id, pt.level + 1
    FROM permissions p
    JOIN permission_tree pt ON p.parent_id = pt.id
)
SELECT * FROM permission_tree;

-- 存储过程调用示例
CALL batch_import_grades(1, '2024-1', '2024-2025', 
    ARRAY[(1001,85.0,88.0,90.0), (1002,90.0,92.0,95.0)]::grades_data[]);
```

## 安装部署

### 环境要求
- PostgreSQL 17+
- Node.js 16+
- npm 8+

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd class_management
```

2. **数据库初始化**
```bash
# 创建数据库
createdb class_management_system

# 执行数据库脚本
psql -d class_management_system -f database/schema/01_create_tables.sql
psql -d class_management_system -f database/indexes/02_create_indexes.sql
psql -d class_management_system -f database/schema/03_create_views.sql
psql -d class_management_system -f database/procedures/04_stored_procedures.sql
psql -d class_management_system -f database/triggers/05_create_triggers.sql
psql -d class_management_system -f database/data/06_insert_test_data.sql
```

3. **后端启动**
```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env 文件配置数据库连接
npm run dev
```

4. **前端启动**
```bash
cd frontend
npm install
npm run dev
```

5. **访问系统**
- 前端地址: http://localhost:8080
- 后端API: http://localhost:3000
- API文档: http://localhost:3000/api

### 生产部署

1. **环境配置**
```bash
# 后端生产构建
cd backend
npm run build

# 前端生产构建
cd frontend
npm run build:prod
```

2. **数据库配置**
```sql
-- 创建生产数据库用户
CREATE USER class_mgmt_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE class_management_system TO class_mgmt_user;
```

3. **Nginx 配置示例**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 数据库设计

### 核心表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| users | 用户基础表 | id, username, user_type, profile_data(JSON) |
| students | 学生信息表 | student_code, name, class_id, gpa, total_credits |
| teachers | 教师信息表 | teacher_code, name, department, title |
| classes | 班级信息表 | class_name, class_code, monitor_id, class_fund_balance |
| courses | 课程信息表 | course_code, course_name, credits, course_type |
| grades | 成绩记录表 | student_id, course_id, total_score, grade_point |
| attendance | 考勤记录表 | student_id, attendance_date, status |
| class_activities | 班级活动表 | activity_name, start_time, participant_count |
| class_funds | 班费记录表 | transaction_type, amount, status |
| notifications | 通知公告表 | title, content, target_type, attachment_urls(Array) |

### 关键视图

- `v_student_grade_summary`: 学生成绩汇总（含排名、GPA）
- `v_class_activity_summary`: 班级活动统计
- `v_attendance_statistics`: 考勤统计分析
- `v_class_fund_summary`: 班费收支汇总
- `v_teacher_workload`: 教师工作量统计

### 存储过程

- `calculate_gpa(student_id)`: 计算学生GPA
- `batch_import_grades()`: 批量导入成绩
- `get_course_grade_statistics()`: 课程成绩统计
- `get_class_performance_ranking()`: 班级绩效排名

## API 接口

### 学生管理
```http
GET    /api/students                    # 获取学生列表
GET    /api/students/:id               # 获取学生详情
GET    /api/students/:id/transcript    # 获取学生成绩单
PUT    /api/students/:id               # 更新学生信息
POST   /api/students/import            # 批量导入学生
```

### 成绩管理
```http
GET    /api/grades                     # 获取成绩列表
POST   /api/grades                     # 录入成绩
POST   /api/grades/batch-import        # 批量导入成绩
GET    /api/grades/course/:id/statistics/:semester/:year  # 课程统计
```

### 系统信息
```http
GET    /api/health                     # 健康检查
GET    /api/db-info                    # 数据库信息
GET    /api                           # API概览
```

## 性能优化

### 索引策略
- **B-tree索引**: 主键、外键、常用查询字段
- **复合索引**: 多字段联合查询优化
- **部分索引**: 条件过滤索引
- **函数索引**: 计算字段索引

### 查询优化
- **视图缓存**: 复杂查询结果缓存
- **存储过程**: 减少网络传输
- **窗口函数**: 避免子查询
- **CTE**: 简化复杂逻辑

### 性能监控
```sql
-- 查看索引使用情况
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- 查看慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

## 开发指南

### 代码规范
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 组件命名采用 PascalCase
- 文件命名采用 kebab-case

### 数据库开发
- 所有表必须有主键和时间戳
- 外键约束必须明确命名
- 复杂查询优先使用视图
- 业务逻辑优先使用存储过程

### Git 提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建工具、辅助工具等
```

## 常见问题

### Q: 数据库连接失败？
A: 检查 PostgreSQL 服务状态和连接配置，确保数据库已创建且用户权限正确。

### Q: 前端页面空白？
A: 检查 API 代理配置，确保后端服务已启动且端口正确。

### Q: 成绩导入失败？
A: 检查数据格式是否符合要求，学生ID和课程ID是否存在。

### Q: 权限验证不通过？
A: 检查用户权限配置，确保权限表数据正确。

## 许可证

Apache License

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

**注意**: 这是一个数据库课程设计项目，主要用于展示 PostgreSQL 数据库设计能力和 SQL 编程技能。