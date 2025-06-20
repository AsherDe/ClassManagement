-- 石河子大学班级事务管理系统 - 视图创建脚本
-- PostgreSQL 复杂查询视图

-- 删除已存在的视图
DROP VIEW IF EXISTS v_student_grade_summary CASCADE;
DROP VIEW IF EXISTS v_class_activity_summary CASCADE;
DROP VIEW IF EXISTS v_attendance_statistics CASCADE;
DROP VIEW IF EXISTS v_class_fund_summary CASCADE;
DROP VIEW IF EXISTS v_course_schedule_detail CASCADE;
DROP VIEW IF EXISTS v_student_comprehensive_info CASCADE;
DROP VIEW IF EXISTS v_teacher_workload CASCADE;
DROP VIEW IF EXISTS v_class_management_overview CASCADE;

-- 1. 学生成绩统计视图 (使用窗口函数)
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
    COUNT(CASE WHEN g.letter_grade IN ('C+', 'C') THEN 1 END) as average_count,
    COUNT(CASE WHEN g.letter_grade = 'D' THEN 1 END) as below_average_count,
    COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
    -- 最高分和最低分
    MAX(g.total_score) as highest_score,
    MIN(g.total_score) as lowest_score,
    s.updated_at
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN courses course ON g.course_id = course.id
WHERE s.status = 'enrolled'
GROUP BY s.id, s.student_code, s.name, c.class_name, c.class_code, s.class_id, s.updated_at;

-- 2. 班级活动汇总视图
CREATE VIEW v_class_activity_summary AS
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_code,
    COUNT(ca.id) as total_activities,
    COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_activities,
    COUNT(CASE WHEN ca.status = 'ongoing' THEN 1 END) as ongoing_activities,
    COUNT(CASE WHEN ca.status = 'planned' THEN 1 END) as planned_activities,
    SUM(ca.budget_amount) as total_budget,
    SUM(ca.actual_cost) as total_cost,
    AVG(ca.participant_count) as avg_participants,
    -- 按活动类型统计
    COUNT(CASE WHEN ca.activity_type = '学习' THEN 1 END) as study_activities,
    COUNT(CASE WHEN ca.activity_type = '文体' THEN 1 END) as sports_activities,
    COUNT(CASE WHEN ca.activity_type = '志愿' THEN 1 END) as volunteer_activities,
    COUNT(CASE WHEN ca.activity_type = '聚会' THEN 1 END) as social_activities,
    -- 最近活动时间
    MAX(ca.start_time) as latest_activity_time,
    MIN(ca.start_time) as earliest_activity_time
FROM classes c
LEFT JOIN class_activities ca ON c.id = ca.class_id
GROUP BY c.id, c.class_name, c.class_code;

-- 3. 考勤统计视图 (复杂聚合查询)
CREATE VIEW v_attendance_statistics AS
WITH attendance_stats AS (
    SELECT 
        s.id as student_id,
        s.student_code,
        s.name as student_name,
        c.class_name,
        COUNT(a.id) as total_records,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_count,
        -- 按考勤类型统计
        COUNT(CASE WHEN a.attendance_type = 'course' THEN 1 END) as course_records,
        COUNT(CASE WHEN a.attendance_type = 'activity' THEN 1 END) as activity_records,
        COUNT(CASE WHEN a.attendance_type = 'meeting' THEN 1 END) as meeting_records
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN attendance a ON s.id = a.student_id
    WHERE s.status = 'enrolled'
    GROUP BY s.id, s.student_code, s.name, c.class_name
)
SELECT 
    *,
    CASE 
        WHEN total_records > 0 THEN ROUND((present_count::DECIMAL / total_records) * 100, 2)
        ELSE 0 
    END as attendance_rate,
    CASE 
        WHEN total_records > 0 THEN ROUND((absent_count::DECIMAL / total_records) * 100, 2)
        ELSE 0 
    END as absence_rate,
    -- 考勤等级评定
    CASE 
        WHEN total_records = 0 THEN '无记录'
        WHEN (present_count::DECIMAL / total_records) >= 0.95 THEN '优秀'
        WHEN (present_count::DECIMAL / total_records) >= 0.90 THEN '良好'
        WHEN (present_count::DECIMAL / total_records) >= 0.80 THEN '一般'
        ELSE '待改进'
    END as attendance_grade
FROM attendance_stats;

-- 4. 班费收支汇总视图
CREATE VIEW v_class_fund_summary AS
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_code,
    -- 收入统计
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'income' AND cf.status = 'approved' THEN cf.amount END), 0) as total_income,
    COUNT(CASE WHEN cf.transaction_type = 'income' AND cf.status = 'approved' THEN 1 END) as income_count,
    -- 支出统计
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'expense' AND cf.status = 'approved' THEN cf.amount END), 0) as total_expense,
    COUNT(CASE WHEN cf.transaction_type = 'expense' AND cf.status = 'approved' THEN 1 END) as expense_count,
    -- 余额计算
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'income' AND cf.status = 'approved' THEN cf.amount END), 0) - 
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'expense' AND cf.status = 'approved' THEN cf.amount END), 0) as current_balance,
    -- 待审批金额
    COALESCE(SUM(CASE WHEN cf.status = 'pending' THEN cf.amount END), 0) as pending_amount,
    COUNT(CASE WHEN cf.status = 'pending' THEN 1 END) as pending_count,
    -- 按类别统计支出
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'expense' AND cf.category = '活动支出' AND cf.status = 'approved' THEN cf.amount END), 0) as activity_expense,
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'expense' AND cf.category = '办公用品' AND cf.status = 'approved' THEN cf.amount END), 0) as office_expense,
    COALESCE(SUM(CASE WHEN cf.transaction_type = 'expense' AND cf.category = '其他' AND cf.status = 'approved' THEN cf.amount END), 0) as other_expense,
    -- 最近交易时间
    MAX(cf.transaction_date) as last_transaction_date,
    COUNT(cf.id) as total_transactions
FROM classes c
LEFT JOIN class_funds cf ON c.id = cf.class_id
GROUP BY c.id, c.class_name, c.class_code;

-- 5. 课程安排详细视图
CREATE VIEW v_course_schedule_detail AS
SELECT 
    cs.id as schedule_id,
    c.course_code,
    c.course_name,
    c.credits,
    cl.class_name,
    cl.class_code,
    t.name as teacher_name,
    t.teacher_code,
    cs.semester,
    cs.academic_year,
    CASE cs.day_of_week
        WHEN 1 THEN '周一'
        WHEN 2 THEN '周二'
        WHEN 3 THEN '周三'
        WHEN 4 THEN '周四'
        WHEN 5 THEN '周五'
        WHEN 6 THEN '周六'
        WHEN 7 THEN '周日'
    END as day_name,
    cs.start_time,
    cs.end_time,
    cs.classroom,
    cs.weeks,
    cs.status,
    -- 时间段描述
    CASE 
        WHEN cs.start_time >= '08:00' AND cs.start_time < '12:00' THEN '上午'
        WHEN cs.start_time >= '12:00' AND cs.start_time < '18:00' THEN '下午'
        ELSE '晚上'
    END as time_period,
    -- 课程时长（分钟）
    EXTRACT(EPOCH FROM (cs.end_time - cs.start_time))/60 as duration_minutes
FROM course_schedule cs
JOIN courses c ON cs.course_id = c.id
JOIN classes cl ON cs.class_id = cl.id
JOIN teachers t ON cs.teacher_id = t.id;

-- 6. 学生综合信息视图
CREATE VIEW v_student_comprehensive_info AS
SELECT 
    s.id,
    s.student_code,
    s.name,
    s.gender,
    s.birth_date,
    AGE(s.birth_date) as age,
    c.class_name,
    c.class_code,
    c.major,
    c.department,
    s.enrollment_date,
    -- 学业信息
    COALESCE(gs.gpa, 0) as current_gpa,
    COALESCE(gs.earned_credits, 0) as earned_credits,
    COALESCE(gs.class_rank, 0) as class_rank,
    -- 考勤信息
    COALESCE(att.attendance_rate, 0) as attendance_rate,
    COALESCE(att.attendance_grade, '无记录') as attendance_grade,
    -- 联系信息
    s.phone,
    s.email,
    s.emergency_contact,
    s.emergency_phone,
    s.status,
    s.created_at,
    s.updated_at
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN v_student_grade_summary gs ON s.id = gs.student_id
LEFT JOIN v_attendance_statistics att ON s.id = att.student_id;

-- 7. 教师工作量统计视图
CREATE VIEW v_teacher_workload AS
SELECT 
    t.id as teacher_id,
    t.teacher_code,
    t.name as teacher_name,
    t.department,
    t.title,
    -- 授课统计
    COUNT(DISTINCT cs.id) as total_courses,
    COUNT(DISTINCT cs.class_id) as total_classes,
    SUM(c.credits) as total_credits,
    -- 学生数量统计
    SUM(cl.total_students) as total_students,
    -- 按课程类型统计
    COUNT(CASE WHEN c.course_type = '必修' THEN 1 END) as required_courses,
    COUNT(CASE WHEN c.course_type = '选修' THEN 1 END) as elective_courses,
    COUNT(CASE WHEN c.course_type = '公共' THEN 1 END) as public_courses,
    -- 工作时间统计
    SUM(EXTRACT(EPOCH FROM (cs.end_time - cs.start_time))/3600) as weekly_hours,
    -- 成绩录入统计
    COUNT(DISTINCT g.id) as grades_recorded,
    AVG(g.total_score) as avg_student_score,
    -- 班级管理
    COUNT(DISTINCT cm.id) as managed_classes
FROM teachers t
LEFT JOIN course_schedule cs ON t.id = cs.teacher_id
LEFT JOIN courses c ON cs.course_id = c.id
LEFT JOIN classes cl ON cs.class_id = cl.id
LEFT JOIN grades g ON c.id = g.course_id
LEFT JOIN classes cm ON t.id = cm.class_teacher_id
WHERE t.status = 'active'
GROUP BY t.id, t.teacher_code, t.name, t.department, t.title;

-- 8. 班级管理总览视图
CREATE VIEW v_class_management_overview AS
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_code,
    c.grade_level,
    c.major,
    c.department,
    c.enrollment_year,
    c.total_students,
    -- 班级干部信息
    t.name as class_teacher,
    m.name as monitor,
    vm.name as vice_monitor,
    -- 学业统计
    ROUND(AVG(gs.gpa), 2) as class_avg_gpa,
    MAX(gs.gpa) as highest_gpa,
    MIN(gs.gpa) as lowest_gpa,
    -- 考勤统计
    ROUND(AVG(att.attendance_rate), 2) as avg_attendance_rate,
    -- 活动统计
    COALESCE(act.total_activities, 0) as total_activities,
    COALESCE(act.completed_activities, 0) as completed_activities,
    -- 班费统计
    COALESCE(fund.current_balance, 0) as current_balance,
    COALESCE(fund.total_income, 0) as total_income,
    COALESCE(fund.total_expense, 0) as total_expense,
    -- 通知统计
    COUNT(n.id) as total_notifications,
    COUNT(CASE WHEN n.is_published THEN 1 END) as published_notifications,
    c.status as class_status,
    c.created_at,
    c.updated_at
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
LEFT JOIN students m ON c.monitor_id = m.id
LEFT JOIN students vm ON c.vice_monitor_id = vm.id
LEFT JOIN v_student_grade_summary gs ON c.id = gs.student_id
LEFT JOIN v_attendance_statistics att ON gs.student_id = att.student_id
LEFT JOIN v_class_activity_summary act ON c.id = act.class_id
LEFT JOIN v_class_fund_summary fund ON c.id = fund.class_id
LEFT JOIN notifications n ON c.id = n.target_id AND n.target_type = 'class'
GROUP BY 
    c.id, c.class_name, c.class_code, c.grade_level, c.major, c.department, 
    c.enrollment_year, c.total_students, t.name, m.name, vm.name,
    act.total_activities, act.completed_activities, fund.current_balance, 
    fund.total_income, fund.total_expense, c.status, c.created_at, c.updated_at;

-- 创建物化视图（用于提高复杂查询性能）
-- 物化视图需要手动刷新数据
/*
CREATE MATERIALIZED VIEW mv_class_performance_summary AS
SELECT 
    c.id as class_id,
    c.class_name,
    COUNT(s.id) as student_count,
    ROUND(AVG(g.gpa), 2) as avg_gpa,
    ROUND(AVG(att.attendance_rate), 2) as avg_attendance,
    COUNT(act.id) as activity_count,
    fund.current_balance
FROM classes c
LEFT JOIN students s ON c.id = s.class_id
LEFT JOIN v_student_grade_summary g ON s.id = g.student_id
LEFT JOIN v_attendance_statistics att ON s.id = att.student_id
LEFT JOIN class_activities act ON c.id = act.class_id
LEFT JOIN v_class_fund_summary fund ON c.id = fund.class_id
GROUP BY c.id, c.class_name, fund.current_balance;

-- 刷新物化视图
-- REFRESH MATERIALIZED VIEW mv_class_performance_summary;
*/

-- 添加视图注释
COMMENT ON VIEW v_student_grade_summary IS '学生成绩统计视图，包含GPA、排名、学分等信息';
COMMENT ON VIEW v_class_activity_summary IS '班级活动汇总视图，统计各类活动数量和参与情况';
COMMENT ON VIEW v_attendance_statistics IS '考勤统计视图，计算出勤率和考勤等级';
COMMENT ON VIEW v_class_fund_summary IS '班费收支汇总视图，统计收入支出和余额';
COMMENT ON VIEW v_course_schedule_detail IS '课程安排详细视图，展示完整的课表信息';
COMMENT ON VIEW v_student_comprehensive_info IS '学生综合信息视图，整合学业、考勤、个人信息';
COMMENT ON VIEW v_teacher_workload IS '教师工作量统计视图，统计授课和管理工作';
COMMENT ON VIEW v_class_management_overview IS '班级管理总览视图，提供班级全面管理信息';