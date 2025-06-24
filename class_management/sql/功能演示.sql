-- =============================================================================
-- 7. 功能演示SQL语句
-- =============================================================================

-- 7.1 管理员功能演示

-- 管理员查询用户列表
SELECT '=== 管理员功能：查询用户列表 ===' as title;
SELECT 
    u.user_id,
    u.username,
    u.user_type,
    u.real_name,
    u.email,
    u.phone,
    u.created_at
FROM users u
ORDER BY u.user_type, u.username;

-- 管理员重置用户密码
SELECT '=== 管理员功能：重置用户密码 ===' as title;
-- 重置学生密码示例
UPDATE users 
SET password = 'newpassword123', updated_at = CURRENT_TIMESTAMP 
WHERE username = '20231001111';

-- 查看密码重置结果
SELECT username, real_name, password, updated_at 
FROM users 
WHERE username = '20231001111';

-- 7.2 教师功能演示

-- 教师查看自己教授的课程
SELECT '=== 教师功能：查看自己教授的课程 ===' as title;
SELECT 
    tc.teacher_name,
    tc.course_code,
    tc.course_name,
    tc.class_name,
    tc.semester,
    tc.current_students,
    tc.max_students,
    tc.class_time,
    tc.classroom
FROM v_teacher_courses tc
WHERE tc.teacher_id = 'T001'
ORDER BY tc.course_code;

-- 教师查看课程班级的学生
SELECT '=== 教师功能：查看课程班级学生 ===' as title;
SELECT 
    si.student_id,
    si.real_name,
    si.major_name,
    si.grade,
    si.class_number,
    si.gpa,
    e.enrolled_at
FROM enrollments e
JOIN v_student_info si ON e.student_id = si.student_id
WHERE e.class_id = 1 -- T001教师的数据库原理1班
ORDER BY si.student_id;

-- 教师录入成绩
SELECT '=== 教师功能：录入新成绩 ===' as title;
-- 假设给新学生录入成绩
INSERT INTO grades (student_id, class_id, regular_score, midterm_score, final_score, recorded_by) 
VALUES ('20231001112', 4, 85.0, 87.0, 89.0, 'T003')
ON CONFLICT (student_id, class_id) 
DO UPDATE SET 
    regular_score = EXCLUDED.regular_score,
    midterm_score = EXCLUDED.midterm_score,
    final_score = EXCLUDED.final_score,
    recorded_at = CURRENT_TIMESTAMP;

-- 教师修改成绩
SELECT '=== 教师功能：修改成绩 ===' as title;
UPDATE grades 
SET regular_score = 90.0, midterm_score = 92.0, final_score = 94.0 
WHERE student_id = '20231001111' AND class_id = 1;

-- 教师查询成绩
SELECT '=== 教师功能：查询班级成绩 ===' as title;
SELECT 
    sg.student_id,
    sg.student_name,
    sg.course_name,
    sg.regular_score,
    sg.midterm_score,
    sg.final_score,
    sg.total_score,
    sg.letter_grade,
    sg.gpa_points
FROM v_student_grades sg
JOIN classes cl ON sg.course_code = (SELECT course_code FROM courses WHERE course_id = cl.course_id)
WHERE cl.class_id = 1 -- T001的数据库原理1班
ORDER BY sg.total_score DESC;

-- 7.3 学生功能演示

-- 学生查看个人信息
SELECT '=== 学生功能：查看个人信息 ===' as title;
SELECT 
    student_id,
    real_name,
    email,
    phone,
    major_name,
    grade,
    class_number,
    gpa,
    total_credits,
    status
FROM v_student_info
WHERE student_id = '20231001111';

-- 学生查看自己的课程信息
SELECT '=== 学生功能：查看课程信息 ===' as title;
SELECT 
    c.course_code,
    c.course_name,
    c.credits,
    c.course_type,
    cl.class_name,
    cl.semester,
    cl.class_time,
    cl.classroom,
    u.real_name as teacher_name,
    e.enrolled_at
FROM enrollments e
JOIN classes cl ON e.class_id = cl.class_id
JOIN courses c ON cl.course_id = c.course_id
JOIN teachers t ON cl.teacher_id = t.teacher_id
JOIN users u ON t.user_id = u.user_id
WHERE e.student_id = '20231001111'
ORDER BY c.course_code;

-- 学生查询个人成绩和GPA
SELECT '=== 学生功能：查询个人成绩 ===' as title;
SELECT 
    course_code,
    course_name,
    credits,
    semester,
    regular_score,
    midterm_score,
    final_score,
    total_score,
    letter_grade,
    gpa_points
FROM v_student_grades
WHERE student_id = '20231001111'
ORDER BY semester, course_code;

-- 学生GPA统计
SELECT '=== 学生功能：GPA统计 ===' as title;
SELECT 
    student_id,
    real_name,
    major_name,
    gpa,
    total_credits,
    CASE 
        WHEN gpa >= 3.70 THEN '优秀'
        WHEN gpa >= 3.00 THEN '良好'
        WHEN gpa >= 2.30 THEN '中等'
        WHEN gpa >= 2.00 THEN '及格'
        ELSE '不及格'
    END as gpa_level
FROM v_student_info
WHERE student_id = '20231001111';

-- =============================================================================
-- 8. 复杂查询演示
-- =============================================================================

-- 复杂连接查询：各专业学生平均GPA排名（老师的页面显示）
SELECT '=== 复杂查询：各专业学生平均GPA排名 ===' as title;
SELECT 
    m.major_name,
    COUNT(s.student_id) as student_count,
    ROUND(AVG(s.gpa), 2) as avg_gpa,
    ROUND(AVG(s.total_credits), 1) as avg_credits,
    ROW_NUMBER() OVER (ORDER BY AVG(s.gpa) DESC) as ranking
FROM majors m
LEFT JOIN students s ON m.major_id = s.major_id
GROUP BY m.major_id, m.major_name
ORDER BY avg_gpa DESC;

-- 复杂查询：教师工作量统计（管理员页面显示）
SELECT '=== 复杂查询：教师工作量统计 ===' as title;
SELECT 
    t.teacher_id,
    u.real_name as teacher_name,
    t.title,
    COUNT(DISTINCT cl.class_id) as class_count,
    SUM(cl.current_students) as total_students,
    SUM(c.credits) as total_credits,
    ROUND(AVG(cl.current_students), 1) as avg_class_size
FROM teachers t
JOIN users u ON t.user_id = u.user_id
LEFT JOIN teaching te ON t.teacher_id = te.teacher_id
LEFT JOIN classes cl ON te.class_id = cl.class_id
LEFT JOIN courses c ON cl.course_id = c.course_id
GROUP BY t.teacher_id, u.real_name, t.title
ORDER BY total_students DESC;

-- 复杂查询：课程成绩分析（老师页面可见）
SELECT '=== 复杂查询：课程成绩分析 ===' as title;
SELECT 
    c.course_name,
    COUNT(g.grade_id) as student_count,
    ROUND(AVG(g.total_score), 2) as avg_score,
    ROUND(MIN(g.total_score), 2) as min_score,
    ROUND(MAX(g.total_score), 2) as max_score,
    COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) as excellent_count,
    COUNT(CASE WHEN g.letter_grade = 'F' THEN 1 END) as fail_count,
    ROUND(
        COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END) * 100.0 / COUNT(g.grade_id), 
        1
    ) as excellent_rate
FROM courses c
JOIN classes cl ON c.course_id = cl.course_id
JOIN grades g ON cl.class_id = g.class_id
GROUP BY c.course_id, c.course_name
ORDER BY avg_score DESC;

-- =============================================================================
-- 9. 触发器效果演示
-- =============================================================================

-- 演示触发器：插入新成绩时自动计算GPA
SELECT '=== 触发器演示：插入成绩前学生GPA ===' as title;
SELECT student_id, real_name, gpa, total_credits 
FROM v_student_info 
WHERE student_id = '20231002221';

-- 插入新成绩
INSERT INTO grades (student_id, class_id, regular_score, midterm_score, final_score, recorded_by) 
VALUES ('20231002221', 6, 88.0, 90.0, 92.0, 'T002'); -- 人工智能导论课程

-- 查看GPA自动更新结果
SELECT '=== 触发器演示：插入成绩后学生GPA自动更新 ===' as title;
SELECT student_id, real_name, gpa, total_credits 
FROM v_student_info 
WHERE student_id = '20231002221';

-- 显示所有学生的最终GPA排名
SELECT '=== 最终结果：学生GPA排名 ===' as title;
SELECT 
    ROW_NUMBER() OVER (ORDER BY gpa DESC) as ranking,
    student_id,
    real_name,
    major_name,
    gpa,
    total_credits,
    CASE 
        WHEN gpa >= 3.70 THEN '优秀'
        WHEN gpa >= 3.00 THEN '良好'
        WHEN gpa >= 2.30 THEN '中等'
        WHEN gpa >= 2.00 THEN '及格'
        ELSE '不及格'
    END as gpa_level
FROM v_student_info
ORDER BY gpa DESC, total_credits DESC;