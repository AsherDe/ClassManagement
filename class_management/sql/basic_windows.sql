-- 石河子大学教学管理数据库系统 (Windows兼容版本)
-- 课程设计 - PostgreSQL实现

-- =============================================================================
-- 1. 数据库和基础设置
-- =============================================================================

-- 创建数据库（如果需要）
-- CREATE DATABASE shzu_teaching_system;

-- 使用数据库
-- \c shzu_teaching_system;

-- 删除已存在的表（重新运行时使用）
DROP TABLE IF EXISTS activity_participants CASCADE;
DROP TABLE IF EXISTS class_activities CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS teaching CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS majors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================================================
-- 2. 表结构设计
-- =============================================================================

-- 用户基础表
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL DEFAULT 'shzu123456', -- 默认密码
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'teacher', 'student')),
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 专业表
CREATE TABLE majors (
    major_id SERIAL PRIMARY KEY,
    major_code VARCHAR(10) UNIQUE NOT NULL,
    major_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT '计算机科学与技术学院',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学生表
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY, -- 学号如：20231001111
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    major_id INTEGER REFERENCES majors(major_id),
    grade INTEGER NOT NULL, -- 年级
    class_number INTEGER NOT NULL, -- 班级号
    gpa DECIMAL(3,2) DEFAULT 0.00, -- GPA，触发器自动计算
    total_credits INTEGER DEFAULT 0, -- 总学分
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- 教师表
CREATE TABLE teachers (
    teacher_id VARCHAR(20) PRIMARY KEY, -- 工号
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(50), -- 职称
    department VARCHAR(100) DEFAULT '计算机科学与技术学院',
    hire_date DATE DEFAULT CURRENT_DATE
);

-- 课程表
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    course_type VARCHAR(20) DEFAULT 'required' CHECK (course_type IN ('required', 'elective', 'public')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 班级表（开课班级）
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id),
    class_name VARCHAR(100) NOT NULL, -- 如：2023级信息科学与技术1班数据库原理
    semester VARCHAR(20) NOT NULL, -- 学期，如：2024-2025-1
    max_students INTEGER DEFAULT 50,
    current_students INTEGER DEFAULT 0,
    class_time VARCHAR(100), -- 上课时间
    classroom VARCHAR(50), -- 教室
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled'))
);

-- 授课关系表
CREATE TABLE teaching (
    teaching_id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id),
    class_id INTEGER REFERENCES classes(class_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id)
);

-- 选课表
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id),
    class_id INTEGER REFERENCES classes(class_id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
    UNIQUE(student_id, class_id)
);

-- 成绩表
CREATE TABLE grades (
    grade_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id),
    class_id INTEGER REFERENCES classes(class_id),
    regular_score DECIMAL(5,2), -- 平时成绩
    midterm_score DECIMAL(5,2), -- 期中成绩
    final_score DECIMAL(5,2), -- 期末成绩
    total_score DECIMAL(5,2), -- 总成绩
    letter_grade VARCHAR(2), -- 等级成绩 A+, A, B+, B, C+, C, D, F
    gpa_points DECIMAL(3,2), -- GPA点数
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(20) REFERENCES teachers(teacher_id),
    UNIQUE(student_id, class_id)
);

-- 班级活动表
CREATE TABLE class_activities (
    activity_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(class_id),
    activity_name VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 学习、文体、志愿、聚会等
    description TEXT,
    location VARCHAR(200),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    organizer_id VARCHAR(20), -- 组织者（学生学号）
    budget_amount DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    required_attendance BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES students(student_id)
);

-- 活动参与记录表
CREATE TABLE activity_participants (
    participant_id SERIAL PRIMARY KEY,
    activity_id INTEGER NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'absent', 'cancelled')),
    feedback TEXT,
    FOREIGN KEY (activity_id) REFERENCES class_activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE(activity_id, student_id)
);

-- =============================================================================
-- 3. 创建索引
-- =============================================================================

CREATE INDEX idx_students_major ON students(major_id);
CREATE INDEX idx_students_grade_class ON students(grade, class_number);
CREATE INDEX idx_classes_course ON classes(course_id);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_class ON grades(class_id);

-- =============================================================================
-- 4. 创建视图
-- =============================================================================

-- 学生详细信息视图
CREATE VIEW v_student_info AS
SELECT 
    s.student_id,
    u.real_name,
    u.email,
    u.phone,
    m.major_name,
    s.grade,
    s.class_number,
    s.gpa,
    s.total_credits,
    s.status
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN majors m ON s.major_id = m.major_id;

-- 教师课程视图
CREATE VIEW v_teacher_courses AS
SELECT 
    t.teacher_id,
    u.real_name as teacher_name,
    c.course_code,
    c.course_name,
    cl.class_name,
    cl.semester,
    cl.current_students,
    cl.max_students,
    cl.class_time,
    cl.classroom,
    cl.class_id
FROM teachers t
JOIN users u ON t.user_id = u.user_id
JOIN teaching te ON t.teacher_id = te.teacher_id
JOIN classes cl ON te.class_id = cl.class_id
JOIN courses c ON cl.course_id = c.course_id;

-- 学生成绩详细视图
CREATE VIEW v_student_grades AS
SELECT 
    s.student_id,
    u.real_name as student_name,
    c.course_code,
    c.course_name,
    c.credits,
    cl.semester,
    g.regular_score,
    g.midterm_score,
    g.final_score,
    g.total_score,
    g.letter_grade,
    g.gpa_points
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN grades g ON s.student_id = g.student_id
JOIN classes cl ON g.class_id = cl.class_id
JOIN courses c ON cl.course_id = c.course_id;

-- =============================================================================
-- 5. 创建函数和触发器
-- =============================================================================

-- 计算等级成绩和GPA点数的函数
CREATE OR REPLACE FUNCTION calculate_letter_grade_and_gpa(score DECIMAL)
RETURNS TABLE(letter_grade VARCHAR(2), gpa_points DECIMAL(3,2)) AS $$
BEGIN
    IF score >= 95 THEN
        RETURN QUERY SELECT 'A+'::VARCHAR(2), 4.00::DECIMAL(3,2);
    ELSIF score >= 90 THEN
        RETURN QUERY SELECT 'A'::VARCHAR(2), 3.70::DECIMAL(3,2);
    ELSIF score >= 85 THEN
        RETURN QUERY SELECT 'B+'::VARCHAR(2), 3.30::DECIMAL(3,2);
    ELSIF score >= 80 THEN
        RETURN QUERY SELECT 'B'::VARCHAR(2), 3.00::DECIMAL(3,2);
    ELSIF score >= 75 THEN
        RETURN QUERY SELECT 'C+'::VARCHAR(2), 2.70::DECIMAL(3,2);
    ELSIF score >= 70 THEN
        RETURN QUERY SELECT 'C'::VARCHAR(2), 2.30::DECIMAL(3,2);
    ELSIF score >= 60 THEN
        RETURN QUERY SELECT 'D'::VARCHAR(2), 2.00::DECIMAL(3,2);
    ELSE
        RETURN QUERY SELECT 'F'::VARCHAR(2), 0.00::DECIMAL(3,2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 成绩插入/更新时自动计算等级和GPA的触发器函数
CREATE OR REPLACE FUNCTION trigger_calculate_grade()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total DECIMAL(5,2);
    grade_info RECORD;
BEGIN
    -- 计算总成绩（平时30% + 期中30% + 期末40%）
    IF NEW.regular_score IS NOT NULL AND NEW.midterm_score IS NOT NULL AND NEW.final_score IS NOT NULL THEN
        calculated_total := (COALESCE(NEW.regular_score, 0) * 0.3 + 
                            COALESCE(NEW.midterm_score, 0) * 0.3 + 
                            COALESCE(NEW.final_score, 0) * 0.4);
        NEW.total_score := calculated_total;
        
        -- 计算等级成绩和GPA点数
        SELECT * INTO grade_info FROM calculate_letter_grade_and_gpa(calculated_total);
        NEW.letter_grade := grade_info.letter_grade;
        NEW.gpa_points := grade_info.gpa_points;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建成绩计算触发器
CREATE TRIGGER tr_calculate_grade
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_grade();

-- 更新学生GPA的触发器函数
CREATE OR REPLACE FUNCTION trigger_update_student_gpa()
RETURNS TRIGGER AS $$
DECLARE
    student_gpa DECIMAL(3,2);
    student_credits INTEGER;
BEGIN
    -- 计算学生的总GPA和学分
    SELECT 
        ROUND(
            COALESCE(
                SUM(g.gpa_points * c.credits) / NULLIF(SUM(c.credits), 0), 
                0
            ), 2
        ),
        COALESCE(SUM(c.credits), 0)
    INTO student_gpa, student_credits
    FROM grades g
    JOIN classes cl ON g.class_id = cl.class_id
    JOIN courses c ON cl.course_id = c.course_id
    WHERE g.student_id = COALESCE(NEW.student_id, OLD.student_id)
    AND g.total_score IS NOT NULL;
    
    -- 更新学生表中的GPA和总学分
    UPDATE students 
    SET gpa = student_gpa, 
        total_credits = student_credits
    WHERE student_id = COALESCE(NEW.student_id, OLD.student_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 创建更新学生GPA的触发器
CREATE TRIGGER tr_update_student_gpa
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_student_gpa();

-- 更新班级学生数量的触发器函数
CREATE OR REPLACE FUNCTION trigger_update_class_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE classes 
        SET current_students = current_students + 1 
        WHERE class_id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes 
        SET current_students = current_students - 1 
        WHERE class_id = OLD.class_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建更新班级人数的触发器
CREATE TRIGGER tr_update_class_count
    AFTER INSERT OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_class_count();

-- =============================================================================
-- 6. 插入模拟数据
-- =============================================================================

-- 插入专业数据
INSERT INTO majors (major_code, major_name) VALUES
('IST', '信息科学与技术'),
('CS', '网络安全'),
('SE', '软件工程'),
('BD', '大数据');

-- 插入管理员用户
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('admin', 'admin123', 'admin', '系统管理员', 'admin@shzu.edu.cn', '13999999999');

-- 插入教师用户
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('t001', 'teacher123', 'teacher', '张教授', 'zhang@shzu.edu.cn', '13888888881'),
('t002', 'teacher123', 'teacher', '李副教授', 'li@shzu.edu.cn', '13888888882'),
('t003', 'teacher123', 'teacher', '王讲师', 'wang@shzu.edu.cn', '13888888883'),
('t004', 'teacher123', 'teacher', '刘教授', 'liu@shzu.edu.cn', '13888888884');

-- 插入学生用户
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('20231001111', 'student123', 'student', '陈小明', 'chen@stu.shzu.edu.cn', '13777777771'),
('20231001112', 'student123', 'student', '李小红', 'lihong@stu.shzu.edu.cn', '13777777772'),
('20231001113', 'student123', 'student', '王小强', 'wangqiang@stu.shzu.edu.cn', '13777777773'),
('20231002221', 'student123', 'student', '张小丽', 'zhangli@stu.shzu.edu.cn', '13777777774'),
('20231002222', 'student123', 'student', '赵小军', 'zhaojun@stu.shzu.edu.cn', '13777777775'),
('20231003331', 'student123', 'student', '孙小美', 'sunmei@stu.shzu.edu.cn', '13777777776'),
('20231003332', 'student123', 'student', '周小伟', 'zhouwei@stu.shzu.edu.cn', '13777777777'),
('20231004441', 'student123', 'student', '吴小芳', 'wufang@stu.shzu.edu.cn', '13777777778');

-- 插入教师数据
INSERT INTO teachers (teacher_id, user_id, title, department) VALUES
('T001', 2, '教授', '计算机科学与技术学院'),
('T002', 3, '副教授', '计算机科学与技术学院'),
('T003', 4, '讲师', '计算机科学与技术学院'),
('T004', 5, '教授', '计算机科学与技术学院');

-- 插入学生数据
INSERT INTO students (student_id, user_id, major_id, grade, class_number) VALUES
('20231001111', 6, 1, 2023, 1),  -- 信息科学与技术1班
('20231001112', 7, 1, 2023, 1),  -- 信息科学与技术1班
('20231001113', 8, 1, 2023, 1),  -- 信息科学与技术1班
('20231002221', 9, 2, 2023, 2),  -- 网络安全2班
('20231002222', 10, 2, 2023, 2), -- 网络安全2班
('20231003331', 11, 3, 2023, 3), -- 软件工程3班
('20231003332', 12, 3, 2023, 3), -- 软件工程3班
('20231004441', 13, 4, 2023, 4); -- 大数据4班

-- 插入课程数据
INSERT INTO courses (course_code, course_name, credits, course_type, description) VALUES
('CS101', '数据库原理', 4, 'required', '数据库系统的基本概念、设计和应用'),
('CS102', '数据结构', 4, 'required', '线性表、树、图等数据结构及算法'),
('CS103', '计算机网络', 3, 'required', '计算机网络协议、安全和应用'),
('CS104', '软件工程', 3, 'required', '软件开发生命周期和项目管理'),
('CS105', '人工智能导论', 3, 'elective', '人工智能基础理论和应用'),
('CS106', '大数据技术', 3, 'elective', '大数据处理和分析技术');

-- 插入班级数据
INSERT INTO classes (course_id, teacher_id, class_name, semester, max_students, class_time, classroom) VALUES
(1, 'T001', '2023级数据库原理-1班', '2024-2025-1', 50, '周一3-4节，周三5-6节', 'A101'),
(1, 'T001', '2023级数据库原理-2班', '2024-2025-1', 50, '周二3-4节，周四5-6节', 'A102'),
(2, 'T002', '2023级数据结构-1班', '2024-2025-1', 45, '周一1-2节，周三3-4节', 'A201'),
(3, 'T003', '2023级计算机网络-1班', '2024-2025-1', 40, '周二1-2节，周四3-4节', 'A202'),
(4, 'T004', '2023级软件工程-1班', '2024-2025-1', 35, '周三1-2节，周五3-4节', 'A203'),
(5, 'T002', '2023级人工智能导论-1班', '2024-2025-1', 30, '周五1-2节', 'A301');

-- 插入授课关系
INSERT INTO teaching (teacher_id, class_id) VALUES
('T001', 1), ('T001', 2), ('T002', 3), ('T002', 6), ('T003', 4), ('T004', 5);

-- 插入选课数据
INSERT INTO enrollments (student_id, class_id) VALUES
-- 信息科学与技术专业学生
('20231001111', 1), ('20231001111', 3), ('20231001111', 6),
('20231001112', 1), ('20231001112', 3),
('20231001113', 1), ('20231001113', 4),
-- 网络安全专业学生
('20231002221', 2), ('20231002221', 4),
('20231002222', 2), ('20231002222', 3),
-- 软件工程专业学生
('20231003331', 2), ('20231003331', 5),
('20231003332', 1), ('20231003332', 5),
-- 大数据专业学生
('20231004441', 2), ('20231004441', 6);

-- 插入成绩数据（触发器会自动计算总成绩、等级和GPA）
INSERT INTO grades (student_id, class_id, regular_score, midterm_score, final_score, recorded_by) VALUES
-- 陈小明的成绩
('20231001111', 1, 85.0, 88.0, 92.0, 'T001'), -- 数据库原理
('20231001111', 3, 78.0, 82.0, 85.0, 'T002'), -- 数据结构
('20231001111', 6, 90.0, 93.0, 95.0, 'T002'), -- 人工智能导论
-- 李小红的成绩
('20231001112', 1, 92.0, 90.0, 94.0, 'T001'), -- 数据库原理
('20231001112', 3, 88.0, 85.0, 87.0, 'T002'), -- 数据结构
-- 王小强的成绩
('20231001113', 1, 75.0, 78.0, 80.0, 'T001'), -- 数据库原理
('20231001113', 4, 82.0, 85.0, 88.0, 'T003'), -- 计算机网络
-- 张小丽的成绩
('20231002221', 2, 95.0, 93.0, 96.0, 'T001'), -- 数据库原理
('20231002221', 4, 87.0, 89.0, 91.0, 'T003'), -- 计算机网络
-- 赵小军的成绩
('20231002222', 2, 80.0, 83.0, 85.0, 'T001'), -- 数据库原理
('20231002222', 3, 76.0, 79.0, 82.0, 'T002'), -- 数据结构
-- 孙小美的成绩
('20231003331', 2, 88.0, 90.0, 92.0, 'T001'), -- 数据库原理
('20231003331', 5, 85.0, 87.0, 89.0, 'T004'), -- 软件工程
-- 周小伟的成绩
('20231003332', 1, 79.0, 81.0, 84.0, 'T001'), -- 数据库原理
('20231003332', 5, 82.0, 84.0, 86.0, 'T004'), -- 软件工程
-- 吴小芳的成绩
('20231004441', 2, 91.0, 89.0, 93.0, 'T001'), -- 数据库原理
('20231004441', 6, 87.0, 90.0, 92.0, 'T002'); -- 人工智能导论

-- =============================================================================
-- 7. 班级活动数据（演示活动管理功能）
-- =============================================================================

-- 插入班级活动演示数据
INSERT INTO class_activities (
    class_id, activity_name, activity_type, description, location, 
    start_time, end_time, organizer_id, budget_amount, actual_cost,
    participant_count, required_attendance, status
) VALUES
-- 信息科学与技术1班活动
(1, '数据库课程设计展示', '学习', '展示各小组的数据库课程设计成果，相互学习交流', 'A101教室', 
 '2024-12-20 14:00:00', '2024-12-20 16:30:00', '20231001111', 200.00, 180.50, 3, true, 'planned'),

(1, '元旦联欢会', '文体', '班级元旦联欢会，准备节目、游戏和聚餐', '学生活动中心', 
 '2024-12-31 18:00:00', '2024-12-31 21:00:00', '20231001112', 800.00, 0.00, 0, false, 'planned'),

(1, '专业认知实习', '学习', '参观当地知名IT企业，了解行业发展现状', '新疆软件园', 
 '2024-11-15 08:00:00', '2024-11-15 18:00:00', '20231001111', 300.00, 285.00, 3, true, 'completed'),

-- 网络安全2班活动
(2, '网络安全技能竞赛', '学习', '班级内部网络安全知识竞赛，提升专业技能', 'B202实验室', 
 '2024-12-25 13:30:00', '2024-12-25 17:00:00', '20231002221', 150.00, 120.00, 2, false, 'planned'),

(2, '班级篮球赛', '文体', '与其他班级进行友谊篮球比赛', '体育馆篮球场', 
 '2024-12-18 16:00:00', '2024-12-18 18:00:00', '20231002222', 100.00, 85.00, 2, false, 'completed'),

-- 软件工程3班活动
(3, '软件开发项目路演', '学习', '展示本学期软件工程课程项目成果', 'C301会议室', 
 '2024-12-22 09:00:00', '2024-12-22 12:00:00', '20231003331', 250.00, 0.00, 0, true, 'planned'),

(3, '志愿服务活动', '志愿', '到石河子市敬老院开展志愿服务', '石河子市敬老院', 
 '2024-11-20 09:00:00', '2024-11-20 15:00:00', '20231003332', 200.00, 180.00, 2, false, 'completed'),

-- 大数据4班活动
(4, '大数据分析案例分享', '学习', '邀请行业专家分享大数据分析实际案例', 'D401报告厅', 
 '2024-12-28 14:00:00', '2024-12-28 16:00:00', '20231004441', 300.00, 0.00, 0, false, 'planned'),

-- 跨班级联合活动
(1, '期末复习答疑会', '学习', '邀请高年级学长学姐分享学习经验，答疑解惑', '图书馆报告厅', 
 '2024-12-10 19:00:00', '2024-12-10 21:00:00', '20231001113', 100.00, 95.00, 3, false, 'completed'),

(2, '班级秋游活动', '文体', '前往天山大峡谷进行秋游，增进同学友谊', '天山大峡谷', 
 '2024-10-15 07:00:00', '2024-10-15 19:00:00', '20231002221', 1200.00, 1150.00, 2, false, 'completed');

-- 插入活动参与记录示例
INSERT INTO activity_participants (activity_id, student_id, attendance_status, feedback) VALUES
-- 专业认知实习参与记录
(3, '20231001111', 'attended', '企业参观很有意义，对专业发展有了更清晰的认识'),
(3, '20231001112', 'attended', '收获很大，了解了实际工作环境'),
(3, '20231001113', 'attended', '希望以后多组织类似活动'),

-- 篮球赛参与记录
(5, '20231002221', 'attended', '比赛很精彩，增进了班级团结'),
(5, '20231002222', 'attended', '运动让大家更有活力'),

-- 志愿服务参与记录
(7, '20231003331', 'attended', '帮助老人很有意义，会继续参加志愿活动'),
(7, '20231003332', 'attended', '通过服务他人，自己也收获了成长'),

-- 期末复习答疑会参与记录
(9, '20231001111', 'attended', '学长的经验分享很实用'),
(9, '20231001112', 'attended', '解答了很多学习疑问'),
(9, '20231001113', 'attended', '对期末考试更有信心了'),

-- 秋游活动参与记录
(10, '20231002221', 'attended', '风景优美，同学们玩得很开心'),
(10, '20231002222', 'attended', '团队活动增进了友谊');