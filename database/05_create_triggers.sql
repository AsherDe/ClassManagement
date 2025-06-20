-- 石河子大学班级事务管理系统 - 触发器实现
-- PostgreSQL 触发器用于数据完整性和自动化操作

-- 删除已存在的触发器
DROP TRIGGER IF EXISTS trg_update_class_student_count ON students;
DROP TRIGGER IF EXISTS trg_update_class_fund_balance ON class_funds;
DROP TRIGGER IF EXISTS trg_update_student_gpa_on_grade_change ON grades;
DROP TRIGGER IF EXISTS trg_validate_grade_scores ON grades;
DROP TRIGGER IF EXISTS trg_check_schedule_conflict ON course_schedule;
DROP TRIGGER IF EXISTS trg_update_activity_participant_count ON attendance;
DROP TRIGGER IF EXISTS trg_validate_class_positions ON classes;
DROP TRIGGER IF EXISTS trg_log_grade_changes ON grades;
DROP TRIGGER IF EXISTS trg_auto_publish_urgent_notification ON notifications;
DROP TRIGGER IF EXISTS trg_prevent_self_approval ON class_funds;

-- 1. 班级学生人数自动更新触发器
-- 当学生信息变更时自动更新班级的学生总数
CREATE TRIGGER trg_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_class_student_count();

-- 2. 班费余额自动更新触发器
-- 当班费记录状态改变时自动重新计算班级余额
CREATE OR REPLACE FUNCTION update_class_fund_balance_trigger()
RETURNS TRIGGER AS $$
DECLARE
    affected_class_id INTEGER;
BEGIN
    -- 确定受影响的班级ID
    IF TG_OP = 'DELETE' THEN
        affected_class_id := OLD.class_id;
    ELSE
        affected_class_id := NEW.class_id;
    END IF;
    
    -- 重新计算班费余额
    PERFORM calculate_class_fund_balance(affected_class_id);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_class_fund_balance
    AFTER INSERT OR UPDATE OR DELETE ON class_funds
    FOR EACH ROW
    EXECUTE FUNCTION update_class_fund_balance_trigger();

-- 3. 成绩变更时自动更新学生GPA触发器
CREATE OR REPLACE FUNCTION update_student_gpa_trigger()
RETURNS TRIGGER AS $$
DECLARE
    affected_student_id INTEGER;
BEGIN
    -- 确定受影响的学生ID
    IF TG_OP = 'DELETE' THEN
        affected_student_id := OLD.student_id;
    ELSE
        affected_student_id := NEW.student_id;
    END IF;
    
    -- 异步更新学生GPA（避免递归调用）
    PERFORM update_student_credits_and_gpa(affected_student_id);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_student_gpa_on_grade_change
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_student_gpa_trigger();

-- 4. 成绩数据验证触发器
-- 确保成绩数据的合理性和一致性
CREATE OR REPLACE FUNCTION validate_grade_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- 验证分数范围
    IF NEW.regular_score IS NOT NULL AND (NEW.regular_score < 0 OR NEW.regular_score > 100) THEN
        RAISE EXCEPTION '平时成绩必须在0-100之间';
    END IF;
    
    IF NEW.midterm_score IS NOT NULL AND (NEW.midterm_score < 0 OR NEW.midterm_score > 100) THEN
        RAISE EXCEPTION '期中成绩必须在0-100之间';
    END IF;
    
    IF NEW.final_score IS NOT NULL AND (NEW.final_score < 0 OR NEW.final_score > 100) THEN
        RAISE EXCEPTION '期末成绩必须在0-100之间';
    END IF;
    
    IF NEW.total_score IS NOT NULL AND (NEW.total_score < 0 OR NEW.total_score > 100) THEN
        RAISE EXCEPTION '总评成绩必须在0-100之间';
    END IF;
    
    -- 验证绩点范围
    IF NEW.grade_point IS NOT NULL AND (NEW.grade_point < 0 OR NEW.grade_point > 4.0) THEN
        RAISE EXCEPTION '绩点必须在0-4.0之间';
    END IF;
    
    -- 自动计算总评成绩（如果未提供）
    IF NEW.total_score IS NULL AND NEW.regular_score IS NOT NULL 
       AND NEW.midterm_score IS NOT NULL AND NEW.final_score IS NOT NULL THEN
        NEW.total_score := NEW.regular_score * 0.3 + NEW.midterm_score * 0.3 + NEW.final_score * 0.4;
    END IF;
    
    -- 根据总分自动确定等级成绩和绩点
    IF NEW.total_score IS NOT NULL THEN
        CASE 
            WHEN NEW.total_score >= 95 THEN 
                NEW.letter_grade := 'A+'; NEW.grade_point := 4.0; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 90 THEN 
                NEW.letter_grade := 'A'; NEW.grade_point := 4.0; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 85 THEN 
                NEW.letter_grade := 'B+'; NEW.grade_point := 3.5; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 80 THEN 
                NEW.letter_grade := 'B'; NEW.grade_point := 3.0; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 75 THEN 
                NEW.letter_grade := 'C+'; NEW.grade_point := 2.5; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 70 THEN 
                NEW.letter_grade := 'C'; NEW.grade_point := 2.0; NEW.is_pass := TRUE;
            WHEN NEW.total_score >= 60 THEN 
                NEW.letter_grade := 'D'; NEW.grade_point := 1.0; NEW.is_pass := TRUE;
            ELSE 
                NEW.letter_grade := 'F'; NEW.grade_point := 0.0; NEW.is_pass := FALSE;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_grade_scores
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION validate_grade_scores();

-- 5. 课程安排冲突检查触发器
CREATE OR REPLACE FUNCTION check_schedule_conflict_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查是否存在时间冲突
    IF check_schedule_conflict(NEW.class_id, NEW.day_of_week, NEW.teacher_id, 
                              NEW.start_time, NEW.end_time) THEN
        RAISE EXCEPTION '课程安排存在时间冲突：班级或教师在该时间段已有其他课程安排';
    END IF;
    
    -- 验证时间逻辑
    IF NEW.start_time >= NEW.end_time THEN
        RAISE EXCEPTION '课程开始时间必须早于结束时间';
    END IF;
    
    -- 验证上课时间在合理范围内
    IF NEW.start_time < '06:00:00' OR NEW.end_time > '22:00:00' THEN
        RAISE EXCEPTION '课程时间必须在06:00-22:00之间';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_schedule_conflict
    BEFORE INSERT OR UPDATE ON course_schedule
    FOR EACH ROW
    EXECUTE FUNCTION check_schedule_conflict_trigger();

-- 6. 活动参与人数自动更新触发器
CREATE OR REPLACE FUNCTION update_activity_participant_count()
RETURNS TRIGGER AS $$
DECLARE
    affected_activity_id INTEGER;
    participant_count INTEGER;
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
        SELECT COUNT(*) INTO participant_count
        FROM attendance
        WHERE activity_id = affected_activity_id
            AND status IN ('present', 'late');
        
        -- 更新活动表的参与人数
        UPDATE class_activities
        SET participant_count = participant_count
        WHERE id = affected_activity_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_activity_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_participant_count();

-- 7. 班级职务验证触发器
-- 确保班长和副班长都是该班级的学生
CREATE OR REPLACE FUNCTION validate_class_positions()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查班长是否属于该班级
    IF NEW.monitor_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM students 
            WHERE id = NEW.monitor_id AND class_id = NEW.id AND status = 'enrolled'
        ) THEN
            RAISE EXCEPTION '班长必须是本班级的在读学生';
        END IF;
    END IF;
    
    -- 检查副班长是否属于该班级
    IF NEW.vice_monitor_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM students 
            WHERE id = NEW.vice_monitor_id AND class_id = NEW.id AND status = 'enrolled'
        ) THEN
            RAISE EXCEPTION '副班长必须是本班级的在读学生';
        END IF;
    END IF;
    
    -- 确保班长和副班长不是同一人
    IF NEW.monitor_id IS NOT NULL AND NEW.vice_monitor_id IS NOT NULL 
       AND NEW.monitor_id = NEW.vice_monitor_id THEN
        RAISE EXCEPTION '班长和副班长不能是同一人';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_class_positions
    BEFORE INSERT OR UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION validate_class_positions();

-- 8. 成绩变更日志触发器
-- 记录成绩的重要变更历史
CREATE TABLE IF NOT EXISTS grade_change_log (
    id SERIAL PRIMARY KEY,
    grade_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_total_score DECIMAL(5,2),
    new_total_score DECIMAL(5,2),
    old_letter_grade VARCHAR(5),
    new_letter_grade VARCHAR(5),
    changed_by INTEGER, -- 操作者ID
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_grade_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO grade_change_log (
            grade_id, student_id, course_id, change_type,
            new_total_score, new_letter_grade, changed_by
        ) VALUES (
            NEW.id, NEW.student_id, NEW.course_id, 'INSERT',
            NEW.total_score, NEW.letter_grade, NEW.recorder_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 只记录重要字段的变更
        IF OLD.total_score IS DISTINCT FROM NEW.total_score 
           OR OLD.letter_grade IS DISTINCT FROM NEW.letter_grade THEN
            INSERT INTO grade_change_log (
                grade_id, student_id, course_id, change_type,
                old_total_score, new_total_score, old_letter_grade, new_letter_grade,
                changed_by
            ) VALUES (
                NEW.id, NEW.student_id, NEW.course_id, 'UPDATE',
                OLD.total_score, NEW.total_score, OLD.letter_grade, NEW.letter_grade,
                NEW.recorder_id
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO grade_change_log (
            grade_id, student_id, course_id, change_type,
            old_total_score, old_letter_grade, changed_by
        ) VALUES (
            OLD.id, OLD.student_id, OLD.course_id, 'DELETE',
            OLD.total_score, OLD.letter_grade, NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_grade_changes
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION log_grade_changes();

-- 9. 紧急通知自动发布触发器
CREATE OR REPLACE FUNCTION auto_publish_urgent_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果是紧急通知，自动发布
    IF NEW.priority = 'urgent' AND NOT NEW.is_published THEN
        NEW.is_published := TRUE;
        NEW.publish_time := CURRENT_TIMESTAMP;
        
        -- 如果没有设置过期时间，紧急通知默认7天后过期
        IF NEW.expire_time IS NULL THEN
            NEW.expire_time := CURRENT_TIMESTAMP + INTERVAL '7 days';
        END IF;
    END IF;
    
    -- 验证发布时间不能早于创建时间
    IF NEW.publish_time IS NOT NULL AND NEW.publish_time < NEW.created_at THEN
        RAISE EXCEPTION '发布时间不能早于创建时间';
    END IF;
    
    -- 验证过期时间不能早于发布时间
    IF NEW.expire_time IS NOT NULL AND NEW.publish_time IS NOT NULL 
       AND NEW.expire_time < NEW.publish_time THEN
        RAISE EXCEPTION '过期时间不能早于发布时间';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_publish_urgent_notification
    BEFORE INSERT OR UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION auto_publish_urgent_notification();

-- 10. 防止自我审批触发器
-- 确保班费支出不能由经手人自己审批
CREATE OR REPLACE FUNCTION prevent_self_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查审批人不能是经手人本人
    IF NEW.approver_id IS NOT NULL AND NEW.handler_id IS NOT NULL 
       AND NEW.approver_id = NEW.handler_id THEN
        RAISE EXCEPTION '经手人不能自己审批班费支出';
    END IF;
    
    -- 检查金额变更的合理性
    IF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status = 'approved' THEN
        IF OLD.amount != NEW.amount THEN
            RAISE EXCEPTION '已审批的班费记录不允许修改金额';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_self_approval
    BEFORE INSERT OR UPDATE ON class_funds
    FOR EACH ROW
    EXECUTE FUNCTION prevent_self_approval();

-- 11. 用户权限过期检查触发器
CREATE OR REPLACE FUNCTION check_permission_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- 检查权限是否已过期
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= CURRENT_TIMESTAMP THEN
        NEW.is_active := FALSE;
    END IF;
    
    -- 如果权限被激活，检查过期时间
    IF NEW.is_active = TRUE AND NEW.expires_at IS NOT NULL 
       AND NEW.expires_at <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION '不能激活已过期的权限';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_permission_expiry
    BEFORE INSERT OR UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION check_permission_expiry();

-- 创建定时任务函数（需要pg_cron扩展）
-- 定期清理过期的权限和通知
/*
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
    -- 禁用过期的用户权限
    UPDATE user_permissions 
    SET is_active = FALSE 
    WHERE expires_at IS NOT NULL 
        AND expires_at <= CURRENT_TIMESTAMP 
        AND is_active = TRUE;
    
    -- 删除过期的通知（可选）
    DELETE FROM notifications 
    WHERE expire_time IS NOT NULL 
        AND expire_time <= CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    RAISE NOTICE '过期数据清理完成';
END;
$$ LANGUAGE plpgsql;

-- 如果安装了pg_cron扩展，可以添加定时任务
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');
*/

-- 添加触发器相关的注释
COMMENT ON FUNCTION update_class_student_count() IS '自动更新班级学生人数的触发器函数';
COMMENT ON FUNCTION update_class_fund_balance_trigger() IS '自动更新班费余额的触发器函数';
COMMENT ON FUNCTION update_student_gpa_trigger() IS '成绩变更时自动更新学生GPA的触发器函数';
COMMENT ON FUNCTION validate_grade_scores() IS '验证和自动计算成绩数据的触发器函数';
COMMENT ON FUNCTION check_schedule_conflict_trigger() IS '检查课程安排冲突的触发器函数';
COMMENT ON FUNCTION update_activity_participant_count() IS '自动更新活动参与人数的触发器函数';
COMMENT ON FUNCTION validate_class_positions() IS '验证班级职务设置的触发器函数';
COMMENT ON FUNCTION log_grade_changes() IS '记录成绩变更历史的触发器函数';
COMMENT ON FUNCTION auto_publish_urgent_notification() IS '自动发布紧急通知的触发器函数';
COMMENT ON FUNCTION prevent_self_approval() IS '防止班费自我审批的触发器函数';
COMMENT ON TABLE grade_change_log IS '成绩变更历史记录表';