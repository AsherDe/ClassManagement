-- 石河子大学班级事务管理系统 PostgreSQL 数据库设计
-- Database Course Design Project

-- 创建数据库（如果需要）
-- CREATE DATABASE class_management_system ENCODING 'UTF8';

-- 删除表（如果存在，按依赖关系顺序）
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS class_funds CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS class_activities CASCADE;
DROP TABLE IF EXISTS course_schedule CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 删除序列（如果存在）
DROP SEQUENCE IF EXISTS user_id_seq CASCADE;
DROP SEQUENCE IF EXISTS class_id_seq CASCADE;
DROP SEQUENCE IF EXISTS course_id_seq CASCADE;
DROP SEQUENCE IF EXISTS activity_id_seq CASCADE;
DROP SEQUENCE IF EXISTS attendance_id_seq CASCADE;
DROP SEQUENCE IF EXISTS grade_id_seq CASCADE;
DROP SEQUENCE IF EXISTS fund_id_seq CASCADE;
DROP SEQUENCE IF EXISTS notification_id_seq CASCADE;
DROP SEQUENCE IF EXISTS permission_id_seq CASCADE;

-- 创建序列
CREATE SEQUENCE user_id_seq START 1000;
CREATE SEQUENCE class_id_seq START 1;
CREATE SEQUENCE course_id_seq START 1;
CREATE SEQUENCE activity_id_seq START 1;
CREATE SEQUENCE attendance_id_seq START 1;
CREATE SEQUENCE grade_id_seq START 1;
CREATE SEQUENCE fund_id_seq START 1;
CREATE SEQUENCE notification_id_seq START 1;
CREATE SEQUENCE permission_id_seq START 1;

-- 1. 用户表（基础用户信息）
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

-- 2. 班级表
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

-- 3. 教师表
CREATE TABLE teachers (
    id INTEGER PRIMARY KEY,
    teacher_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    id_card VARCHAR(18),
    department VARCHAR(100) NOT NULL,
    title VARCHAR(50), -- 职称
    education VARCHAR(50), -- 学历
    phone VARCHAR(20),
    email VARCHAR(100),
    office_location VARCHAR(100),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'retired')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 学生表
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

-- 5. 课程表
CREATE TABLE courses (
    id INTEGER PRIMARY KEY DEFAULT nextval('course_id_seq'),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(200) NOT NULL,
    credits DECIMAL(3,1) NOT NULL CHECK (credits > 0),
    course_type VARCHAR(50) NOT NULL, -- 必修/选修/公共
    department VARCHAR(100) NOT NULL,
    prerequisite_courses TEXT, -- 先修课程
    course_description TEXT,
    total_hours INTEGER NOT NULL CHECK (total_hours > 0),
    theory_hours INTEGER DEFAULT 0,
    practice_hours INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 课程安排表（连接课程、班级、教师）
CREATE TABLE course_schedule (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL, -- 学期：2024-1, 2024-2
    academic_year VARCHAR(10) NOT NULL, -- 学年：2024-2025
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50),
    weeks VARCHAR(100), -- 上课周次：1-16,18
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE(course_id, class_id, semester, academic_year)
);

-- 7. 班级活动表
CREATE TABLE class_activities (
    id INTEGER PRIMARY KEY DEFAULT nextval('activity_id_seq'),
    class_id INTEGER NOT NULL,
    activity_name VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 学习、文体、志愿、聚会等
    description TEXT,
    location VARCHAR(200),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    organizer_id INTEGER, -- 组织者（学生ID）
    budget_amount DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    required_attendance BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES students(id) ON DELETE SET NULL
);

-- 8. 考勤表
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
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_schedule_id) REFERENCES course_schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES class_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (recorder_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_attendance_reference CHECK (
        (course_schedule_id IS NOT NULL AND activity_id IS NULL) OR
        (course_schedule_id IS NULL AND activity_id IS NOT NULL)
    )
);

-- 9. 成绩表
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

-- 10. 班费记录表
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. 通知表
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY DEFAULT nextval('notification_id_seq'),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 通知类型：班级通知、学院通知、系统通知
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('all', 'class', 'student', 'teacher')),
    target_id INTEGER, -- 目标ID（班级ID或用户ID）
    sender_id INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    publish_time TIMESTAMP,
    expire_time TIMESTAMP,
    read_count INTEGER DEFAULT 0,
    attachment_urls TEXT[], -- PostgreSQL数组类型存储附件URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 12. 权限表
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY DEFAULT nextval('permission_id_seq'),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_key VARCHAR(100) UNIQUE NOT NULL, -- 权限标识符
    category VARCHAR(50) NOT NULL, -- 权限分类
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. 用户权限关联表
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_by INTEGER, -- 授予者ID
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 权限过期时间
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, permission_id)
);

-- 添加外键约束
ALTER TABLE classes ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (class_teacher_id) REFERENCES teachers(id);
ALTER TABLE classes ADD CONSTRAINT fk_classes_monitor FOREIGN KEY (monitor_id) REFERENCES students(id);
ALTER TABLE classes ADD CONSTRAINT fk_classes_vice_monitor FOREIGN KEY (vice_monitor_id) REFERENCES students(id);

-- 创建更新时间自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON class_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON class_funds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE users IS '用户基础信息表';
COMMENT ON TABLE classes IS '班级信息表';
COMMENT ON TABLE teachers IS '教师信息表';
COMMENT ON TABLE students IS '学生信息表';
COMMENT ON TABLE courses IS '课程信息表';
COMMENT ON TABLE course_schedule IS '课程安排表';
COMMENT ON TABLE class_activities IS '班级活动表';
COMMENT ON TABLE attendance IS '考勤记录表';
COMMENT ON TABLE grades IS '学生成绩表';
COMMENT ON TABLE class_funds IS '班费收支记录表';
COMMENT ON TABLE notifications IS '通知公告表';
COMMENT ON TABLE permissions IS '系统权限表';
COMMENT ON TABLE user_permissions IS '用户权限关联表';

-- 添加重要列注释
COMMENT ON COLUMN users.profile_data IS 'JSON格式存储用户额外配置信息';
COMMENT ON COLUMN grades.grade_point IS '绩点计算：A+=4.0, A=4.0, B+=3.5, B=3.0, C+=2.5, C=2.0, D=1.0, F=0';
COMMENT ON COLUMN notifications.attachment_urls IS 'PostgreSQL数组类型存储多个附件URL';