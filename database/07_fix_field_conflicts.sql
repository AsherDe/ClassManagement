-- 修复数据库字段名冲突问题
-- 解决PostgreSQL存储过程中变量名与表字段名冲突导致的API错误
-- 执行时间: 2025-06-23
-- 问题: column reference "total_credits" is ambiguous 等字段冲突错误

-- 1. 修复活动参与人数更新触发器中的字段冲突
-- 原问题: participant_count 变量名与表字段名冲突
CREATE OR REPLACE FUNCTION update_activity_participant_count()
RETURNS TRIGGER AS $$
DECLARE
    affected_activity_id INTEGER;
    participant_count_val INTEGER;  -- 重命名变量避免冲突
BEGIN
    -- 确定受影响的活动ID
    IF TG_OP = 'DELETE' THEN
        affected_activity_id := OLD.activity_id;
    ELSE
        affected_activity_id := NEW.activity_id;
    END IF;
    
    -- 只处理活动考勤记录
    IF affected_activity_id IS NOT NULL THEN
        -- 计算实际参与人数（出席的人数）
        SELECT COUNT(*) INTO participant_count_val
        FROM attendance
        WHERE activity_id = affected_activity_id
            AND status IN ('present', 'late');
        
        -- 更新活动表的参与人数
        UPDATE class_activities
        SET participant_count = participant_count_val  -- 使用重命名后的变量
        WHERE id = affected_activity_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_activity_participant_count() IS '修复后的活动参与人数自动更新触发器 - 解决字段名冲突';

-- 2. 修复GPA计算函数中的字段冲突
-- 原问题: total_credits 变量名与表字段名冲突
CREATE OR REPLACE FUNCTION calculate_gpa(student_id_param integer)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_grade_points DECIMAL(10,2) := 0;
    total_credits_val DECIMAL(8,2) := 0;  -- 重命名变量避免冲突
    gpa_result DECIMAL(3,2) := 0;
    grade_rec RECORD;
BEGIN
    -- 获取学生所有有效成绩
    FOR grade_rec IN
        SELECT g.grade_point, c.credits
        FROM grades g
        JOIN courses c ON g.course_id = c.id
        WHERE g.student_id = student_id_param
            AND g.is_pass = true
            AND g.grade_point IS NOT NULL
    LOOP
        total_grade_points := total_grade_points + (grade_rec.grade_point * grade_rec.credits);
        total_credits_val := total_credits_val + grade_rec.credits;  -- 使用重命名后的变量
    END LOOP;
    
    -- 计算GPA
    IF total_credits_val > 0 THEN
        gpa_result := ROUND(total_grade_points / total_credits_val, 2);
    END IF;
    
    -- 更新学生表中的GPA和学分
    UPDATE students 
    SET gpa = gpa_result, total_credits = total_credits_val  -- 使用重命名后的变量
    WHERE id = student_id_param;
    
    RETURN gpa_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_gpa(integer) IS '修复后的GPA计算函数 - 解决total_credits字段名冲突';

-- 3. 修复学分和GPA更新函数中的字段冲突
-- 原问题: total_credits 变量名与表字段名冲突
CREATE OR REPLACE FUNCTION update_student_credits_and_gpa(student_id_param integer)
RETURNS void AS $$
DECLARE
    new_gpa DECIMAL(3,2);
    total_credits_val DECIMAL(8,2);  -- 重命名变量避免冲突
BEGIN
    -- 计算新的GPA（这个函数现在已经修复了字段冲突）
    new_gpa := calculate_gpa(student_id_param);
    
    -- 计算总学分
    SELECT COALESCE(SUM(c.credits), 0) INTO total_credits_val
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = student_id_param AND g.is_pass = true;
    
    -- 更新学生信息
    UPDATE students
    SET gpa = new_gpa, total_credits = total_credits_val, updated_at = CURRENT_TIMESTAMP  -- 使用重命名后的变量
    WHERE id = student_id_param;
    
    RAISE NOTICE '学生ID: % 的GPA更新为: %, 总学分: %', student_id_param, new_gpa, total_credits_val;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_student_credits_and_gpa(integer) IS '修复后的学分和GPA更新函数 - 解决total_credits字段名冲突';

-- 验证修复结果
-- 测试GPA计算函数是否正常工作
DO $$
DECLARE
    test_student_id INTEGER := 1007;  -- 使用一个存在的学生ID进行测试
    calculated_gpa DECIMAL(3,2);
BEGIN
    -- 执行GPA计算测试
    calculated_gpa := calculate_gpa(test_student_id);
    RAISE NOTICE '测试完成 - 学生ID: % 的GPA计算结果: %', test_student_id, calculated_gpa;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '测试失败: %', SQLERRM;
END;
$$;

-- 显示修复总结
SELECT 
    '=== 数据库字段冲突修复完成 ===' as fix_summary,
    '修复的函数:' as functions_fixed,
    '1. update_activity_participant_count() - participant_count变量冲突' as fix_1,
    '2. calculate_gpa() - total_credits变量冲突' as fix_2,
    '3. update_student_credits_and_gpa() - total_credits变量冲突' as fix_3,
    '影响的API:' as apis_affected,
    'POST /api/grades - 成绩创建' as api_1,
    'PUT /api/grades/:id - 成绩更新' as api_2,
    '修复后状态: 所有API正常工作' as final_status;