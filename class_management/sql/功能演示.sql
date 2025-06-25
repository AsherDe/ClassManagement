
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

