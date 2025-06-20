-- 石河子大学班级事务管理系统 - 存储过程和函数
-- PostgreSQL 存储过程实现

-- 删除已存在的函数
DROP FUNCTION IF EXISTS calculate_gpa(INTEGER);
DROP FUNCTION IF EXISTS update_class_student_count();
DROP FUNCTION IF EXISTS get_student_attendance_rate(INTEGER, DATE, DATE);
DROP FUNCTION IF EXISTS calculate_class_fund_balance(INTEGER);
DROP FUNCTION IF EXISTS get_course_grade_statistics(INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS check_schedule_conflict(INTEGER, INTEGER, INTEGER, TIME, TIME);
DROP FUNCTION IF EXISTS generate_student_transcript(INTEGER);
DROP FUNCTION IF EXISTS update_student_credits_and_gpa(INTEGER);
DROP FUNCTION IF EXISTS get_class_performance_ranking();
DROP PROCEDURE IF EXISTS batch_import_grades(INTEGER, VARCHAR, VARCHAR, grades_data[]);
DROP PROCEDURE IF EXISTS process_attendance_batch(attendance_record[]);

-- 1. 计算学生GPA的函数
CREATE OR REPLACE FUNCTION calculate_gpa(student_id_param INTEGER)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_grade_points DECIMAL(10,2) := 0;
    total_credits DECIMAL(8,2) := 0;
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
        total_credits := total_credits + grade_rec.credits;
    END LOOP;
    
    -- 计算GPA
    IF total_credits > 0 THEN
        gpa_result := ROUND(total_grade_points / total_credits, 2);
    END IF;
    
    -- 更新学生表中的GPA和学分
    UPDATE students 
    SET gpa = gpa_result, total_credits = total_credits
    WHERE id = student_id_param;
    
    RETURN gpa_result;
END;
$$ LANGUAGE plpgsql;

-- 2. 更新班级学生人数的函数
CREATE OR REPLACE FUNCTION update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新相关班级的学生总数
    IF TG_OP = 'INSERT' THEN
        UPDATE classes 
        SET total_students = (
            SELECT COUNT(*) 
            FROM students 
            WHERE class_id = NEW.class_id AND status = 'enrolled'
        )
        WHERE id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 如果学生转班或状态改变
        IF OLD.class_id != NEW.class_id OR OLD.status != NEW.status THEN
            -- 更新原班级人数
            UPDATE classes 
            SET total_students = (
                SELECT COUNT(*) 
                FROM students 
                WHERE class_id = OLD.class_id AND status = 'enrolled'
            )
            WHERE id = OLD.class_id;
            
            -- 更新新班级人数
            UPDATE classes 
            SET total_students = (
                SELECT COUNT(*) 
                FROM students 
                WHERE class_id = NEW.class_id AND status = 'enrolled'
            )
            WHERE id = NEW.class_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE classes 
        SET total_students = (
            SELECT COUNT(*) 
            FROM students 
            WHERE class_id = OLD.class_id AND status = 'enrolled'
        )
        WHERE id = OLD.class_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. 计算学生出勤率的函数
CREATE OR REPLACE FUNCTION get_student_attendance_rate(
    student_id_param INTEGER,
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_records INTEGER := 0;
    present_records INTEGER := 0;
    attendance_rate DECIMAL(5,2) := 0;
    start_date DATE;
    end_date DATE;
BEGIN
    -- 设置日期范围，默认为当前学期
    start_date := COALESCE(start_date_param, CURRENT_DATE - INTERVAL '6 months');
    end_date := COALESCE(end_date_param, CURRENT_DATE);
    
    -- 统计总考勤记录数
    SELECT COUNT(*) INTO total_records
    FROM attendance
    WHERE student_id = student_id_param
        AND attendance_date BETWEEN start_date AND end_date;
    
    -- 统计出勤记录数
    SELECT COUNT(*) INTO present_records
    FROM attendance
    WHERE student_id = student_id_param
        AND attendance_date BETWEEN start_date AND end_date
        AND status = 'present';
    
    -- 计算出勤率
    IF total_records > 0 THEN
        attendance_rate := ROUND((present_records::DECIMAL / total_records) * 100, 2);
    END IF;
    
    RETURN attendance_rate;
END;
$$ LANGUAGE plpgsql;

-- 4. 计算班费余额的函数
CREATE OR REPLACE FUNCTION calculate_class_fund_balance(class_id_param INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_income DECIMAL(10,2) := 0;
    total_expense DECIMAL(10,2) := 0;
    current_balance DECIMAL(10,2) := 0;
BEGIN
    -- 计算总收入（已审批）
    SELECT COALESCE(SUM(amount), 0) INTO total_income
    FROM class_funds
    WHERE class_id = class_id_param
        AND transaction_type = 'income'
        AND status = 'approved';
    
    -- 计算总支出（已审批）
    SELECT COALESCE(SUM(amount), 0) INTO total_expense
    FROM class_funds
    WHERE class_id = class_id_param
        AND transaction_type = 'expense'
        AND status = 'approved';
    
    -- 计算余额
    current_balance := total_income - total_expense;
    
    -- 更新班级表中的余额
    UPDATE classes
    SET class_fund_balance = current_balance
    WHERE id = class_id_param;
    
    RETURN current_balance;
END;
$$ LANGUAGE plpgsql;

-- 5. 获取课程成绩统计的函数
CREATE OR REPLACE FUNCTION get_course_grade_statistics(
    course_id_param INTEGER,
    semester_param VARCHAR(20),
    academic_year_param VARCHAR(10)
)
RETURNS TABLE(
    total_students INTEGER,
    avg_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    min_score DECIMAL(5,2),
    pass_count INTEGER,
    fail_count INTEGER,
    pass_rate DECIMAL(5,2),
    excellent_count INTEGER,
    good_count INTEGER,
    average_count INTEGER,
    below_average_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_students,
        ROUND(AVG(g.total_score), 2) as avg_score,
        MAX(g.total_score) as max_score,
        MIN(g.total_score) as min_score,
        COUNT(CASE WHEN g.is_pass THEN 1 END)::INTEGER as pass_count,
        COUNT(CASE WHEN NOT g.is_pass THEN 1 END)::INTEGER as fail_count,
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN g.is_pass THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0::DECIMAL(5,2)
        END as pass_rate,
        COUNT(CASE WHEN g.letter_grade IN ('A+', 'A') THEN 1 END)::INTEGER as excellent_count,
        COUNT(CASE WHEN g.letter_grade IN ('B+', 'B') THEN 1 END)::INTEGER as good_count,
        COUNT(CASE WHEN g.letter_grade IN ('C+', 'C') THEN 1 END)::INTEGER as average_count,
        COUNT(CASE WHEN g.letter_grade = 'D' THEN 1 END)::INTEGER as below_average_count
    FROM grades g
    WHERE g.course_id = course_id_param
        AND g.semester = semester_param
        AND g.academic_year = academic_year_param;
END;
$$ LANGUAGE plpgsql;

-- 6. 检查课程安排冲突的函数
CREATE OR REPLACE FUNCTION check_schedule_conflict(
    class_id_param INTEGER,
    day_of_week_param INTEGER,
    teacher_id_param INTEGER,
    start_time_param TIME,
    end_time_param TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER := 0;
BEGIN
    -- 检查班级时间冲突
    SELECT COUNT(*) INTO conflict_count
    FROM course_schedule
    WHERE class_id = class_id_param
        AND day_of_week = day_of_week_param
        AND status = 'scheduled'
        AND (
            (start_time_param >= start_time AND start_time_param < end_time) OR
            (end_time_param > start_time AND end_time_param <= end_time) OR
            (start_time_param <= start_time AND end_time_param >= end_time)
        );
    
    IF conflict_count > 0 THEN
        RETURN TRUE; -- 存在冲突
    END IF;
    
    -- 检查教师时间冲突
    SELECT COUNT(*) INTO conflict_count
    FROM course_schedule
    WHERE teacher_id = teacher_id_param
        AND day_of_week = day_of_week_param
        AND status = 'scheduled'
        AND (
            (start_time_param >= start_time AND start_time_param < end_time) OR
            (end_time_param > start_time AND end_time_param <= end_time) OR
            (start_time_param <= start_time AND end_time_param >= end_time)
        );
    
    RETURN conflict_count > 0; -- 返回是否存在冲突
END;
$$ LANGUAGE plpgsql;

-- 7. 生成学生成绩单的函数
CREATE OR REPLACE FUNCTION generate_student_transcript(student_id_param INTEGER)
RETURNS TABLE(
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    course_code VARCHAR(20),
    course_name VARCHAR(200),
    credits DECIMAL(3,1),
    total_score DECIMAL(5,2),
    letter_grade VARCHAR(5),
    grade_point DECIMAL(3,1),
    is_pass BOOLEAN,
    is_retake BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.semester,
        g.academic_year,
        c.course_code,
        c.course_name,
        c.credits,
        g.total_score,
        g.letter_grade,
        g.grade_point,
        g.is_pass,
        g.is_retake
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = student_id_param
    ORDER BY g.academic_year, g.semester, c.course_code;
END;
$$ LANGUAGE plpgsql;

-- 8. 更新学生学分和GPA的函数
CREATE OR REPLACE FUNCTION update_student_credits_and_gpa(student_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    new_gpa DECIMAL(3,2);
    total_credits DECIMAL(8,2);
BEGIN
    -- 计算新的GPA
    new_gpa := calculate_gpa(student_id_param);
    
    -- 计算总学分
    SELECT COALESCE(SUM(c.credits), 0) INTO total_credits
    FROM grades g
    JOIN courses c ON g.course_id = c.id
    WHERE g.student_id = student_id_param AND g.is_pass = true;
    
    -- 更新学生信息
    UPDATE students
    SET gpa = new_gpa, total_credits = total_credits, updated_at = CURRENT_TIMESTAMP
    WHERE id = student_id_param;
    
    RAISE NOTICE '学生ID: % 的GPA更新为: %, 总学分: %', student_id_param, new_gpa, total_credits;
END;
$$ LANGUAGE plpgsql;

-- 9. 获取班级绩效排名的函数
CREATE OR REPLACE FUNCTION get_class_performance_ranking()
RETURNS TABLE(
    class_id INTEGER,
    class_name VARCHAR(100),
    avg_gpa DECIMAL(3,2),
    avg_attendance_rate DECIMAL(5,2),
    total_activities INTEGER,
    fund_balance DECIMAL(10,2),
    performance_score DECIMAL(8,2),
    ranking INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH class_metrics AS (
        SELECT 
            c.id as class_id,
            c.class_name,
            COALESCE(AVG(s.gpa), 0) as avg_gpa,
            COALESCE(AVG(get_student_attendance_rate(s.id)), 0) as avg_attendance_rate,
            COUNT(ca.id) as total_activities,
            COALESCE(calculate_class_fund_balance(c.id), 0) as fund_balance
        FROM classes c
        LEFT JOIN students s ON c.id = s.class_id AND s.status = 'enrolled'
        LEFT JOIN class_activities ca ON c.id = ca.class_id AND ca.status = 'completed'
        WHERE c.status = 'active'
        GROUP BY c.id, c.class_name
    ),
    performance_calculation AS (
        SELECT 
            *,
            -- 综合绩效得分计算（GPA权重40%，出勤率权重30%，活动数权重20%，班费管理权重10%）
            (avg_gpa * 25) + (avg_attendance_rate * 0.3) + (total_activities * 2) + 
            (CASE WHEN fund_balance >= 0 THEN 10 ELSE 0 END) as performance_score
        FROM class_metrics
    )
    SELECT 
        pc.*,
        ROW_NUMBER() OVER (ORDER BY pc.performance_score DESC)::INTEGER as ranking
    FROM performance_calculation pc
    ORDER BY performance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. 批量导入成绩的存储过程
CREATE TYPE grades_data AS (
    student_id INTEGER,
    regular_score DECIMAL(5,2),
    midterm_score DECIMAL(5,2),
    final_score DECIMAL(5,2)
);

CREATE OR REPLACE PROCEDURE batch_import_grades(
    course_id_param INTEGER,
    semester_param VARCHAR(20),
    academic_year_param VARCHAR(10),
    grades_array grades_data[]
)
LANGUAGE plpgsql AS $$
DECLARE
    grade_item grades_data;
    total_score DECIMAL(5,2);
    letter_grade VARCHAR(5);
    grade_point DECIMAL(3,1);
    is_pass BOOLEAN;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- 开始事务
    BEGIN
        FOREACH grade_item IN ARRAY grades_array
        LOOP
            BEGIN
                -- 计算总评成绩（平时30% + 期中30% + 期末40%）
                total_score := COALESCE(grade_item.regular_score, 0) * 0.3 + 
                              COALESCE(grade_item.midterm_score, 0) * 0.3 + 
                              COALESCE(grade_item.final_score, 0) * 0.4;
                
                -- 确定等级成绩和绩点
                CASE 
                    WHEN total_score >= 95 THEN 
                        letter_grade := 'A+'; grade_point := 4.0; is_pass := TRUE;
                    WHEN total_score >= 90 THEN 
                        letter_grade := 'A'; grade_point := 4.0; is_pass := TRUE;
                    WHEN total_score >= 85 THEN 
                        letter_grade := 'B+'; grade_point := 3.5; is_pass := TRUE;
                    WHEN total_score >= 80 THEN 
                        letter_grade := 'B'; grade_point := 3.0; is_pass := TRUE;
                    WHEN total_score >= 75 THEN 
                        letter_grade := 'C+'; grade_point := 2.5; is_pass := TRUE;
                    WHEN total_score >= 70 THEN 
                        letter_grade := 'C'; grade_point := 2.0; is_pass := TRUE;
                    WHEN total_score >= 60 THEN 
                        letter_grade := 'D'; grade_point := 1.0; is_pass := TRUE;
                    ELSE 
                        letter_grade := 'F'; grade_point := 0.0; is_pass := FALSE;
                END CASE;
                
                -- 插入或更新成绩
                INSERT INTO grades (
                    student_id, course_id, semester, academic_year,
                    regular_score, midterm_score, final_score, total_score,
                    letter_grade, grade_point, is_pass,
                    recorder_id, recorded_at
                ) VALUES (
                    grade_item.student_id, course_id_param, semester_param, academic_year_param,
                    grade_item.regular_score, grade_item.midterm_score, grade_item.final_score, total_score,
                    letter_grade, grade_point, is_pass,
                    NULL, CURRENT_TIMESTAMP
                )
                ON CONFLICT (student_id, course_id, semester, academic_year, is_retake)
                DO UPDATE SET
                    regular_score = EXCLUDED.regular_score,
                    midterm_score = EXCLUDED.midterm_score,
                    final_score = EXCLUDED.final_score,
                    total_score = EXCLUDED.total_score,
                    letter_grade = EXCLUDED.letter_grade,
                    grade_point = EXCLUDED.grade_point,
                    is_pass = EXCLUDED.is_pass,
                    updated_at = CURRENT_TIMESTAMP;
                
                -- 更新学生GPA
                PERFORM update_student_credits_and_gpa(grade_item.student_id);
                
                success_count := success_count + 1;
                
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE NOTICE '导入学生ID % 的成绩时发生错误: %', grade_item.student_id, SQLERRM;
            END;
        END LOOP;
        
        RAISE NOTICE '批量导入完成：成功 % 条，失败 % 条', success_count, error_count;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '批量导入过程中发生严重错误: %', SQLERRM;
        ROLLBACK;
    END;
END;
$$;

-- 11. 考勤批量处理存储过程
CREATE TYPE attendance_record AS (
    student_id INTEGER,
    course_schedule_id INTEGER,
    activity_id INTEGER,
    attendance_date DATE,
    attendance_type VARCHAR(20),
    status VARCHAR(20),
    check_in_time TIMESTAMP,
    notes TEXT
);

CREATE OR REPLACE PROCEDURE process_attendance_batch(
    attendance_array attendance_record[]
)
LANGUAGE plpgsql AS $$
DECLARE
    att_record attendance_record;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    FOREACH att_record IN ARRAY attendance_array
    LOOP
        BEGIN
            INSERT INTO attendance (
                student_id, course_schedule_id, activity_id, attendance_date,
                attendance_type, status, check_in_time, notes, recorder_id
            ) VALUES (
                att_record.student_id, att_record.course_schedule_id, att_record.activity_id,
                att_record.attendance_date, att_record.attendance_type, att_record.status,
                att_record.check_in_time, att_record.notes, NULL
            );
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE '处理学生ID % 的考勤记录时发生错误: %', att_record.student_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '考勤批量处理完成：成功 % 条，失败 % 条', success_count, error_count;
END;
$$;