# 数据库设计文档

## 概述

石河子大学班级事务管理系统采用 PostgreSQL 17 作为数据库管理系统，充分利用 PostgreSQL 的高级特性来实现复杂的业务逻辑和数据分析功能。

## 设计原则

### 1. 数据完整性
- **主键约束**: 每个表都有唯一标识的主键
- **外键约束**: 确保引用完整性
- **检查约束**: 验证数据的业务规则
- **唯一约束**: 防止重复数据

### 2. 性能优化
- **索引策略**: 针对查询模式优化索引
- **视图缓存**: 复杂查询结果预计算
- **分区策略**: 大表按时间分区（预留）

### 3. 扩展性
- **模块化设计**: 表结构支持功能扩展
- **JSON字段**: 灵活的配置存储
- **触发器**: 自动化业务逻辑

## 表结构设计

### 核心业务表

#### 1. users - 用户基础表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('user_id_seq'),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'teacher', 'admin')),
    avatar_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_data JSONB -- PostgreSQL JSON字段存储额外配置信息
);
```

**设计要点:**
- 使用自定义序列生成用户ID，起始值1000
- JSON字段存储扩展配置信息
- 支持多种用户类型的统一管理

#### 2. classes - 班级信息表
```sql
CREATE TABLE classes (
    id INTEGER PRIMARY KEY DEFAULT nextval('class_id_seq'),
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 4),
    major VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    enrollment_year INTEGER NOT NULL,
    total_students INTEGER DEFAULT 0,
    class_teacher_id INTEGER,
    monitor_id INTEGER, -- 班长
    vice_monitor_id INTEGER, -- 副班长
    class_fund_balance DECIMAL(10,2) DEFAULT 0.00,
    class_description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**设计要点:**
- 班级代码具有唯一性约束
- 支持班级干部管理（班长、副班长）
- 实时维护班费余额和学生总数

#### 3. students - 学生信息表
```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    id_card VARCHAR(18),
    class_id INTEGER NOT NULL,
    enrollment_date DATE NOT NULL,
    graduation_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    home_address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    total_credits DECIMAL(5,2) DEFAULT 0,
    gpa DECIMAL(3,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'suspended', 'graduated', 'dropped')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT
);
```

**设计要点:**
- 学生ID与用户ID一致，实现表继承关系
- 自动维护学分和GPA字段
- 支持多种学生状态管理

#### 4. grades - 成绩记录表
```sql
CREATE TABLE grades (
    id INTEGER PRIMARY KEY DEFAULT nextval('grade_id_seq'),
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    regular_score DECIMAL(5,2), -- 平时成绩
    midterm_score DECIMAL(5,2), -- 期中成绩
    final_score DECIMAL(5,2), -- 期末成绩
    total_score DECIMAL(5,2), -- 总评成绩
    grade_point DECIMAL(3,1), -- 绩点
    letter_grade VARCHAR(5), -- 等级成绩 A+,A,B+,B,C+,C,D,F
    is_pass BOOLEAN DEFAULT FALSE,
    is_retake BOOLEAN DEFAULT FALSE, -- 是否重修
    exam_date DATE,
    recorder_id INTEGER, -- 录入者ID
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (recorder_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(student_id, course_id, semester, academic_year, is_retake)
);
```

**设计要点:**
- 支持平时、期中、期末成绩分别记录
- 自动计算总评成绩和绩点
- 唯一约束防止重复录入

### 关联业务表

#### 5. attendance - 考勤记录表
```sql
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY DEFAULT nextval('attendance_id_seq'),
    student_id INTEGER NOT NULL,
    course_schedule_id INTEGER,
    activity_id INTEGER,
    attendance_date DATE NOT NULL,
    attendance_type VARCHAR(20) NOT NULL CHECK (attendance_type IN ('course', 'activity', 'meeting')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    recorder_id INTEGER, -- 记录者ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attendance_reference CHECK (
        (course_schedule_id IS NOT NULL AND activity_id IS NULL) OR
        (course_schedule_id IS NULL AND activity_id IS NOT NULL)
    )
);
```

**设计要点:**
- 支持课程考勤和活动考勤
- 检查约束确保关联关系正确性
- 记录详细的考勤时间信息

#### 6. class_funds - 班费记录表
```sql
CREATE TABLE class_funds (
    id INTEGER PRIMARY KEY DEFAULT nextval('fund_id_seq'),
    class_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL, -- 类别：班费收取、活动支出、办公用品等
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'alipay', 'wechat')),
    receipt_url VARCHAR(255), -- 凭证图片URL
    handler_id INTEGER, -- 经手人ID
    approver_id INTEGER, -- 审批人ID
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**设计要点:**
- 支持完整的收支记录和审批流程
- 多种支付方式支持
- 凭证URL字段支持票据管理

## 高级特性应用

### 1. 窗口函数应用

#### 学生成绩排名计算
```sql
-- 班级内排名和全校排名
SELECT 
    student_id, student_name, gpa,
    ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY gpa DESC NULLS LAST) as class_rank,
    ROW_NUMBER() OVER (ORDER BY gpa DESC NULLS LAST) as overall_rank,
    RANK() OVER (PARTITION BY class_id ORDER BY gpa DESC NULLS LAST) as class_rank_with_ties
FROM v_student_grade_summary;
```

#### 移动平均计算
```sql
-- 学生成绩趋势分析
SELECT 
    student_id, semester, total_score,
    AVG(total_score) OVER (
        PARTITION BY student_id 
        ORDER BY semester 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as moving_avg_3_semesters
FROM grades;
```

### 2. 公用表表达式 (CTE)

#### 递归查询权限继承
```sql
WITH RECURSIVE permission_hierarchy AS (
    -- 基础情况：顶级权限
    SELECT id, permission_name, parent_id, 1 as level, 
           ARRAY[id] as path
    FROM permissions 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 递归情况：子权限
    SELECT p.id, p.permission_name, p.parent_id, ph.level + 1,
           ph.path || p.id
    FROM permissions p
    JOIN permission_hierarchy ph ON p.parent_id = ph.id
    WHERE NOT p.id = ANY(ph.path) -- 防止循环
)
SELECT * FROM permission_hierarchy ORDER BY level, id;
```

#### 复杂统计查询
```sql
WITH class_performance AS (
    SELECT 
        c.id as class_id,
        c.class_name,
        AVG(s.gpa) as avg_gpa,
        COUNT(s.id) as student_count,
        COUNT(CASE WHEN s.gpa >= 3.5 THEN 1 END) as excellent_students
    FROM classes c
    LEFT JOIN students s ON c.id = s.class_id
    WHERE s.status = 'enrolled'
    GROUP BY c.id, c.class_name
)
SELECT 
    *,
    RANK() OVER (ORDER BY avg_gpa DESC) as performance_rank,
    excellent_students * 100.0 / student_count as excellent_rate
FROM class_performance;
```

### 3. 存储过程

#### GPA计算存储过程
```sql
CREATE OR REPLACE FUNCTION calculate_gpa(student_id_param INTEGER)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_grade_points DECIMAL(10,2) := 0;
    total_credits DECIMAL(8,2) := 0;
    gpa_result DECIMAL(3,2) := 0;
BEGIN
    -- 计算加权GPA
    SELECT 
        COALESCE(SUM(g.grade_point * c.credits), 0),
        COALESCE(SUM(c.credits), 0)
    INTO total_grade_points, total_credits
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = student_id_param 
        AND g.is_pass = true;
    
    IF total_credits > 0 THEN
        gpa_result := ROUND(total_grade_points / total_credits, 2);
    END IF;
    
    -- 更新学生表
    UPDATE students 
    SET gpa = gpa_result, total_credits = total_credits
    WHERE id = student_id_param;
    
    RETURN gpa_result;
END;
$$ LANGUAGE plpgsql;
```

### 4. 触发器

#### 自动更新班级学生人数
```sql
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据操作类型更新相关班级
    IF TG_OP = 'INSERT' THEN
        UPDATE classes 
        SET total_students = (
            SELECT COUNT(*) FROM students 
            WHERE class_id = NEW.class_id AND status = 'enrolled'
        )
        WHERE id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 更新原班级和新班级
        IF OLD.class_id != NEW.class_id OR OLD.status != NEW.status THEN
            UPDATE classes 
            SET total_students = (
                SELECT COUNT(*) FROM students 
                WHERE class_id = OLD.class_id AND status = 'enrolled'
            )
            WHERE id = OLD.class_id;
            
            UPDATE classes 
            SET total_students = (
                SELECT COUNT(*) FROM students 
                WHERE class_id = NEW.class_id AND status = 'enrolled'
            )
            WHERE id = NEW.class_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes 
        SET total_students = (
            SELECT COUNT(*) FROM students 
            WHERE class_id = OLD.class_id AND status = 'enrolled'
        )
        WHERE id = OLD.class_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_class_student_count();
```

### 5. 视图优化

#### 学生成绩汇总视图
```sql
CREATE VIEW v_student_grade_summary AS
SELECT 
    s.id as student_id,
    s.student_code,
    s.name as student_name,
    c.class_name,
    c.class_code,
    COUNT(g.id) as total_courses,
    ROUND(AVG(g.total_score), 2) as avg_score,
    ROUND(AVG(g.grade_point), 2) as gpa,
    SUM(CASE WHEN g.is_pass THEN course.credits ELSE 0 END) as earned_credits,
    SUM(course.credits) as attempted_credits,
    -- 使用窗口函数计算排名
    ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY AVG(g.grade_point) DESC NULLS LAST) as class_rank,
    ROW_NUMBER() OVER (ORDER BY AVG(g.grade_point) DESC NULLS LAST) as overall_rank,
    -- 计算各等级成绩数量
    COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
    COUNT(CASE WHEN g.letter_grade IN ('B+', 'B') THEN 1 END) as good_count,
    COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN courses course ON g.course_id = course.id
WHERE s.status = 'enrolled'
GROUP BY s.id, s.student_code, s.name, c.class_name, c.class_code, s.class_id;
```

## 索引优化策略

### 1. B-tree索引
```sql
-- 基础查询索引
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);

-- 复合索引
CREATE INDEX idx_grades_semester_student ON grades(semester, academic_year, student_id);
CREATE INDEX idx_students_class_status ON students(class_id, status);
```

### 2. 部分索引
```sql
-- 只索引有效数据
CREATE INDEX idx_users_active_email ON users(email) WHERE status = 'active';
CREATE INDEX idx_grades_valid_scores ON grades(student_id, total_score) WHERE is_pass = true;
```

### 3. 函数索引
```sql
-- 用于排序的复合字段索引
CREATE INDEX idx_grades_semester_order ON grades(
    (semester || '-' || academic_year), student_id
);
```

### 4. GIN索引（JSON和数组）
```sql
-- JSON字段索引
CREATE INDEX idx_users_profile_data_gin ON users USING GIN(profile_data);
-- 数组字段索引
CREATE INDEX idx_notifications_attachments_gin ON notifications USING GIN(attachment_urls);
```

## 性能监控

### 1. 索引使用情况
```sql
SELECT 
    schemaname, tablename, indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

### 2. 慢查询分析
```sql
-- 需要安装 pg_stat_statements 扩展
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    (100 * total_time / sum(total_time) OVER()) AS percentage
FROM pg_stat_statements 
ORDER BY total_time DESC
LIMIT 10;
```

### 3. 表大小统计
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

## 数据完整性

### 1. 约束设计
- **主键约束**: 确保实体唯一性
- **外键约束**: 维护引用完整性
- **检查约束**: 验证数据有效性
- **唯一约束**: 防止业务重复

### 2. 事务处理
```sql
-- 成绩录入事务示例
BEGIN;
    INSERT INTO grades (...) VALUES (...);
    UPDATE students SET gpa = calculate_gpa(student_id) WHERE id = ?;
    INSERT INTO grade_change_log (...) VALUES (...);
COMMIT;
```

### 3. 数据备份策略
```bash
# 全库备份
pg_dump -h localhost -U username -d class_management_system > backup.sql

# 仅结构备份
pg_dump -h localhost -U username -d class_management_system --schema-only > structure.sql

# 仅数据备份
pg_dump -h localhost -U username -d class_management_system --data-only > data.sql
```

## 扩展性考虑

### 1. 表分区（预留设计）
```sql
-- 按年份分区成绩表（示例）
CREATE TABLE grades_2024 PARTITION OF grades
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. 读写分离
- 主库处理写操作
- 从库处理复杂查询和报表

### 3. 缓存策略
- Redis缓存热点数据
- 应用层缓存查询结果

## 安全性设计

### 1. 用户权限
```sql
-- 创建只读用户
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE class_management_system TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 创建应用用户
CREATE USER app_user WITH PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### 2. 行级安全（RLS）
```sql
-- 学生只能查看自己的成绩
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY student_grades_policy ON grades
    FOR SELECT TO student_role
    USING (student_id = current_user_id());
```

## 总结

本数据库设计充分利用了 PostgreSQL 的高级特性，包括：

1. **丰富的数据类型**: JSON、数组、自定义类型
2. **高级查询功能**: 窗口函数、CTE、递归查询
3. **存储过程**: 复杂业务逻辑封装
4. **触发器**: 数据完整性自动维护
5. **视图**: 复杂查询优化和安全控制
6. **索引优化**: 多种索引类型的合理使用

这些特性的综合应用使得系统既能满足复杂的业务需求，又能保证良好的性能和可维护性。