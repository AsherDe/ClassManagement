-- 石河子大学班级事务管理系统 - 索引优化方案
-- PostgreSQL 索引创建脚本

-- 删除已存在的索引（如果需要）
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_user_type;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_students_class_id;
DROP INDEX IF EXISTS idx_students_student_code;
DROP INDEX IF EXISTS idx_teachers_teacher_code;
DROP INDEX IF EXISTS idx_classes_class_code;
DROP INDEX IF EXISTS idx_courses_course_code;
DROP INDEX IF EXISTS idx_course_schedule_course_class;
DROP INDEX IF EXISTS idx_course_schedule_semester;
DROP INDEX IF EXISTS idx_attendance_student_date;
DROP INDEX IF EXISTS idx_attendance_date;
DROP INDEX IF EXISTS idx_grades_student_course;
DROP INDEX IF EXISTS idx_grades_semester;
DROP INDEX IF EXISTS idx_class_funds_class_date;
DROP INDEX IF EXISTS idx_notifications_target;
DROP INDEX IF EXISTS idx_notifications_published;
DROP INDEX IF EXISTS idx_user_permissions_user;

-- 用户表索引
-- B-tree索引用于唯一性查找和排序
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL; -- 部分索引
CREATE INDEX idx_users_created_at ON users(created_at);

-- 学生表索引
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_student_code ON students(student_code);
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_status ON students(status);
-- 复合索引用于常见的联合查询
CREATE INDEX idx_students_class_status ON students(class_id, status);

-- 教师表索引
CREATE INDEX idx_teachers_teacher_code ON teachers(teacher_code);
CREATE INDEX idx_teachers_department ON teachers(department);
CREATE INDEX idx_teachers_status ON teachers(status);

-- 班级表索引
CREATE INDEX idx_classes_class_code ON classes(class_code);
CREATE INDEX idx_classes_grade_major ON classes(grade_level, major);
CREATE INDEX idx_classes_enrollment_year ON classes(enrollment_year);
CREATE INDEX idx_classes_teacher ON classes(class_teacher_id);

-- 课程表索引
CREATE INDEX idx_courses_course_code ON courses(course_code);
CREATE INDEX idx_courses_department ON courses(department);
CREATE INDEX idx_courses_type ON courses(course_type);
CREATE INDEX idx_courses_status ON courses(status);

-- 课程安排表索引（高频查询）
CREATE INDEX idx_course_schedule_course_class ON course_schedule(course_id, class_id);
CREATE INDEX idx_course_schedule_teacher ON course_schedule(teacher_id);
CREATE INDEX idx_course_schedule_semester ON course_schedule(semester, academic_year);
CREATE INDEX idx_course_schedule_time ON course_schedule(day_of_week, start_time);
-- 复合索引用于课表查询
CREATE INDEX idx_course_schedule_class_time ON course_schedule(class_id, day_of_week, start_time);

-- 班级活动表索引
CREATE INDEX idx_activities_class_id ON class_activities(class_id);
CREATE INDEX idx_activities_type ON class_activities(activity_type);
CREATE INDEX idx_activities_start_time ON class_activities(start_time);
CREATE INDEX idx_activities_status ON class_activities(status);
CREATE INDEX idx_activities_organizer ON class_activities(organizer_id);

-- 考勤表索引（频繁查询和统计）
CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_course_schedule ON attendance(course_schedule_id);
CREATE INDEX idx_attendance_activity ON attendance(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX idx_attendance_status ON attendance(status);
-- 复合索引用于考勤统计查询
CREATE INDEX idx_attendance_student_type_date ON attendance(student_id, attendance_type, attendance_date);

-- 成绩表索引（关键业务表）
CREATE INDEX idx_grades_student_course ON grades(student_id, course_id);
CREATE INDEX idx_grades_semester ON grades(semester, academic_year);
CREATE INDEX idx_grades_student_semester ON grades(student_id, semester, academic_year);
CREATE INDEX idx_grades_course_semester ON grades(course_id, semester, academic_year);
CREATE INDEX idx_grades_total_score ON grades(total_score) WHERE total_score IS NOT NULL;
CREATE INDEX idx_grades_gpa ON grades(grade_point) WHERE grade_point IS NOT NULL;
-- 部分索引：只索引有效成绩
CREATE INDEX idx_grades_valid ON grades(student_id, total_score) WHERE is_pass = true;

-- 班费记录表索引
CREATE INDEX idx_class_funds_class_date ON class_funds(class_id, transaction_date);
CREATE INDEX idx_class_funds_type ON class_funds(transaction_type);
CREATE INDEX idx_class_funds_category ON class_funds(category);
CREATE INDEX idx_class_funds_status ON class_funds(status);
CREATE INDEX idx_class_funds_handler ON class_funds(handler_id);
-- 复合索引用于班费统计
CREATE INDEX idx_class_funds_class_type_date ON class_funds(class_id, transaction_type, transaction_date);

-- 通知表索引
CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_published ON notifications(is_published, publish_time);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_expire ON notifications(expire_time) WHERE expire_time IS NOT NULL;

-- 权限表索引
CREATE INDEX idx_permissions_key ON permissions(permission_key);
CREATE INDEX idx_permissions_category ON permissions(category);

-- 用户权限关联表索引
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_active ON user_permissions(user_id, is_active);
-- 复合索引用于权限验证
CREATE INDEX idx_user_permissions_valid ON user_permissions(user_id, permission_id) 
    WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- 哈希索引（用于等值查询优化）
-- 注意：PostgreSQL 哈希索引在某些版本中可能不如B-tree性能好
-- CREATE INDEX idx_users_username_hash ON users USING HASH(username);
-- CREATE INDEX idx_students_code_hash ON students USING HASH(student_code);

-- GIN索引（用于JSON和数组字段）
CREATE INDEX idx_users_profile_data_gin ON users USING GIN(profile_data) WHERE profile_data IS NOT NULL;
CREATE INDEX idx_notifications_attachments_gin ON notifications USING GIN(attachment_urls) WHERE attachment_urls IS NOT NULL;

-- 函数索引（用于特殊查询需求）
-- 按学期和年份排序的函数索引
CREATE INDEX idx_grades_semester_order ON grades(
    (semester || '-' || academic_year), student_id
);

-- 用于模糊搜索的索引（使用pg_trgm扩展，如果可用）
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_students_name_trgm ON students USING GIN(name gin_trgm_ops);
-- CREATE INDEX idx_teachers_name_trgm ON teachers USING GIN(name gin_trgm_ops);

-- 创建用于分区的索引（如果使用表分区）
-- 例如：按年份分区成绩表
-- CREATE INDEX idx_grades_2024_student_course ON grades_2024(student_id, course_id);

-- 索引统计信息更新
ANALYZE users;
ANALYZE students;
ANALYZE teachers;
ANALYZE classes;
ANALYZE courses;
ANALYZE course_schedule;
ANALYZE class_activities;
ANALYZE attendance;
ANALYZE grades;
ANALYZE class_funds;
ANALYZE notifications;
ANALYZE permissions;
ANALYZE user_permissions;

-- 索引使用情况查询语句（用于性能监控）
/*
-- 查看索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- 查看未使用的索引
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

-- 查看表的统计信息
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
*/