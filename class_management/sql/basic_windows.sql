-- ʯ���Ӵ�ѧ��ѧ�������ݿ�ϵͳ (Windows���ݰ汾)
-- �γ���� - PostgreSQLʵ��

-- =============================================================================
-- 1. ���ݿ�ͻ�������
-- =============================================================================

-- �������ݿ⣨�����Ҫ��
-- CREATE DATABASE shzu_teaching_system;

-- ʹ�����ݿ�
-- \c shzu_teaching_system;

-- ɾ���Ѵ��ڵı���������ʱʹ�ã�
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
-- 2. ��ṹ���
-- =============================================================================

-- �û�������
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL DEFAULT 'shzu123456', -- Ĭ������
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'teacher', 'student')),
    real_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- רҵ��
CREATE TABLE majors (
    major_id SERIAL PRIMARY KEY,
    major_code VARCHAR(10) UNIQUE NOT NULL,
    major_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT '�������ѧ�뼼��ѧԺ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ѧ����
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY, -- ѧ���磺20231001111
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    major_id INTEGER REFERENCES majors(major_id),
    grade INTEGER NOT NULL, -- �꼶
    class_number INTEGER NOT NULL, -- �༶��
    gpa DECIMAL(3,2) DEFAULT 0.00, -- GPA���������Զ�����
    total_credits INTEGER DEFAULT 0, -- ��ѧ��
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'graduated')),
    enrollment_date DATE DEFAULT CURRENT_DATE
);

-- ��ʦ��
CREATE TABLE teachers (
    teacher_id VARCHAR(20) PRIMARY KEY, -- ����
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(50), -- ְ��
    department VARCHAR(100) DEFAULT '�������ѧ�뼼��ѧԺ',
    hire_date DATE DEFAULT CURRENT_DATE
);

-- �γ̱�
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    course_type VARCHAR(20) DEFAULT 'required' CHECK (course_type IN ('required', 'elective', 'public')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- �༶�����ΰ༶��
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id),
    class_name VARCHAR(100) NOT NULL, -- �磺2023����Ϣ��ѧ�뼼��1�����ݿ�ԭ��
    semester VARCHAR(20) NOT NULL, -- ѧ�ڣ��磺2024-2025-1
    max_students INTEGER DEFAULT 50,
    current_students INTEGER DEFAULT 0,
    class_time VARCHAR(100), -- �Ͽ�ʱ��
    classroom VARCHAR(50), -- ����
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'finished', 'cancelled'))
);

-- �ڿι�ϵ��
CREATE TABLE teaching (
    teaching_id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(20) REFERENCES teachers(teacher_id),
    class_id INTEGER REFERENCES classes(class_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id)
);

-- ѡ�α�
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id),
    class_id INTEGER REFERENCES classes(class_id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
    UNIQUE(student_id, class_id)
);

-- �ɼ���
CREATE TABLE grades (
    grade_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id),
    class_id INTEGER REFERENCES classes(class_id),
    regular_score DECIMAL(5,2), -- ƽʱ�ɼ�
    midterm_score DECIMAL(5,2), -- ���гɼ�
    final_score DECIMAL(5,2), -- ��ĩ�ɼ�
    total_score DECIMAL(5,2), -- �ܳɼ�
    letter_grade VARCHAR(2), -- �ȼ��ɼ� A+, A, B+, B, C+, C, D, F
    gpa_points DECIMAL(3,2), -- GPA����
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by VARCHAR(20) REFERENCES teachers(teacher_id),
    UNIQUE(student_id, class_id)
);

-- �༶���
CREATE TABLE class_activities (
    activity_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(class_id),
    activity_name VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- ѧϰ�����塢־Ը���ۻ��
    description TEXT,
    location VARCHAR(200),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    organizer_id VARCHAR(20), -- ��֯�ߣ�ѧ��ѧ�ţ�
    budget_amount DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    required_attendance BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES students(student_id)
);

-- ������¼��
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
-- 3. ��������
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
-- 4. ������ͼ
-- =============================================================================

-- ѧ����ϸ��Ϣ��ͼ
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

-- ��ʦ�γ���ͼ
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

-- ѧ���ɼ���ϸ��ͼ
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
-- 5. ���������ʹ�����
-- =============================================================================

-- ����ȼ��ɼ���GPA�����ĺ���
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

-- �ɼ�����/����ʱ�Զ�����ȼ���GPA�Ĵ���������
CREATE OR REPLACE FUNCTION trigger_calculate_grade()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total DECIMAL(5,2);
    grade_info RECORD;
BEGIN
    -- �����ܳɼ���ƽʱ30% + ����30% + ��ĩ40%��
    IF NEW.regular_score IS NOT NULL AND NEW.midterm_score IS NOT NULL AND NEW.final_score IS NOT NULL THEN
        calculated_total := (COALESCE(NEW.regular_score, 0) * 0.3 + 
                            COALESCE(NEW.midterm_score, 0) * 0.3 + 
                            COALESCE(NEW.final_score, 0) * 0.4);
        NEW.total_score := calculated_total;
        
        -- ����ȼ��ɼ���GPA����
        SELECT * INTO grade_info FROM calculate_letter_grade_and_gpa(calculated_total);
        NEW.letter_grade := grade_info.letter_grade;
        NEW.gpa_points := grade_info.gpa_points;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- �����ɼ����㴥����
CREATE TRIGGER tr_calculate_grade
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_grade();

-- ����ѧ��GPA�Ĵ���������
CREATE OR REPLACE FUNCTION trigger_update_student_gpa()
RETURNS TRIGGER AS $$
DECLARE
    student_gpa DECIMAL(3,2);
    student_credits INTEGER;
BEGIN
    -- ����ѧ������GPA��ѧ��
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
    
    -- ����ѧ�����е�GPA����ѧ��
    UPDATE students 
    SET gpa = student_gpa, 
        total_credits = student_credits
    WHERE student_id = COALESCE(NEW.student_id, OLD.student_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ��������ѧ��GPA�Ĵ�����
CREATE TRIGGER tr_update_student_gpa
    AFTER INSERT OR UPDATE OR DELETE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_student_gpa();

-- ���°༶ѧ�������Ĵ���������
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

-- �������°༶�����Ĵ�����
CREATE TRIGGER tr_update_class_count
    AFTER INSERT OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_class_count();

-- =============================================================================
-- 6. ����ģ������
-- =============================================================================

-- ����רҵ����
INSERT INTO majors (major_code, major_name) VALUES
('IST', '��Ϣ��ѧ�뼼��'),
('CS', '���簲ȫ'),
('SE', '�������'),
('BD', '������');

-- �������Ա�û�
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('admin', 'admin123', 'admin', 'ϵͳ����Ա', 'admin@shzu.edu.cn', '13999999999');

-- �����ʦ�û�
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('t001', 'teacher123', 'teacher', '�Ž���', 'zhang@shzu.edu.cn', '13888888881'),
('t002', 'teacher123', 'teacher', '�����', 'li@shzu.edu.cn', '13888888882'),
('t003', 'teacher123', 'teacher', '����ʦ', 'wang@shzu.edu.cn', '13888888883'),
('t004', 'teacher123', 'teacher', '������', 'liu@shzu.edu.cn', '13888888884');

-- ����ѧ���û�
INSERT INTO users (username, password, user_type, real_name, email, phone) VALUES
('20231001111', 'student123', 'student', '��С��', 'chen@stu.shzu.edu.cn', '13777777771'),
('20231001112', 'student123', 'student', '��С��', 'lihong@stu.shzu.edu.cn', '13777777772'),
('20231001113', 'student123', 'student', '��Сǿ', 'wangqiang@stu.shzu.edu.cn', '13777777773'),
('20231002221', 'student123', 'student', '��С��', 'zhangli@stu.shzu.edu.cn', '13777777774'),
('20231002222', 'student123', 'student', '��С��', 'zhaojun@stu.shzu.edu.cn', '13777777775'),
('20231003331', 'student123', 'student', '��С��', 'sunmei@stu.shzu.edu.cn', '13777777776'),
('20231003332', 'student123', 'student', '��Сΰ', 'zhouwei@stu.shzu.edu.cn', '13777777777'),
('20231004441', 'student123', 'student', '��С��', 'wufang@stu.shzu.edu.cn', '13777777778');

-- �����ʦ����
INSERT INTO teachers (teacher_id, user_id, title, department) VALUES
('T001', 2, '����', '�������ѧ�뼼��ѧԺ'),
('T002', 3, '������', '�������ѧ�뼼��ѧԺ'),
('T003', 4, '��ʦ', '�������ѧ�뼼��ѧԺ'),
('T004', 5, '����', '�������ѧ�뼼��ѧԺ');

-- ����ѧ������
INSERT INTO students (student_id, user_id, major_id, grade, class_number) VALUES
('20231001111', 6, 1, 2023, 1),  -- ��Ϣ��ѧ�뼼��1��
('20231001112', 7, 1, 2023, 1),  -- ��Ϣ��ѧ�뼼��1��
('20231001113', 8, 1, 2023, 1),  -- ��Ϣ��ѧ�뼼��1��
('20231002221', 9, 2, 2023, 2),  -- ���簲ȫ2��
('20231002222', 10, 2, 2023, 2), -- ���簲ȫ2��
('20231003331', 11, 3, 2023, 3), -- �������3��
('20231003332', 12, 3, 2023, 3), -- �������3��
('20231004441', 13, 4, 2023, 4); -- ������4��

-- ����γ�����
INSERT INTO courses (course_code, course_name, credits, course_type, description) VALUES
('CS101', '���ݿ�ԭ��', 4, 'required', '���ݿ�ϵͳ�Ļ��������ƺ�Ӧ��'),
('CS102', '���ݽṹ', 4, 'required', '���Ա�����ͼ�����ݽṹ���㷨'),
('CS103', '���������', 3, 'required', '���������Э�顢��ȫ��Ӧ��'),
('CS104', '�������', 3, 'required', '��������������ں���Ŀ����'),
('CS105', '�˹����ܵ���', 3, 'elective', '�˹����ܻ������ۺ�Ӧ��'),
('CS106', '�����ݼ���', 3, 'elective', '�����ݴ���ͷ�������');

-- ����༶����
INSERT INTO classes (course_id, teacher_id, class_name, semester, max_students, class_time, classroom) VALUES
(1, 'T001', '2023�����ݿ�ԭ��-1��', '2024-2025-1', 50, '��һ3-4�ڣ�����5-6��', 'A101'),
(1, 'T001', '2023�����ݿ�ԭ��-2��', '2024-2025-1', 50, '�ܶ�3-4�ڣ�����5-6��', 'A102'),
(2, 'T002', '2023�����ݽṹ-1��', '2024-2025-1', 45, '��һ1-2�ڣ�����3-4��', 'A201'),
(3, 'T003', '2023�����������-1��', '2024-2025-1', 40, '�ܶ�1-2�ڣ�����3-4��', 'A202'),
(4, 'T004', '2023���������-1��', '2024-2025-1', 35, '����1-2�ڣ�����3-4��', 'A203'),
(5, 'T002', '2023���˹����ܵ���-1��', '2024-2025-1', 30, '����1-2��', 'A301');

-- �����ڿι�ϵ
INSERT INTO teaching (teacher_id, class_id) VALUES
('T001', 1), ('T001', 2), ('T002', 3), ('T002', 6), ('T003', 4), ('T004', 5);

-- ����ѡ������
INSERT INTO enrollments (student_id, class_id) VALUES
-- ��Ϣ��ѧ�뼼��רҵѧ��
('20231001111', 1), ('20231001111', 3), ('20231001111', 6),
('20231001112', 1), ('20231001112', 3),
('20231001113', 1), ('20231001113', 4),
-- ���簲ȫרҵѧ��
('20231002221', 2), ('20231002221', 4),
('20231002222', 2), ('20231002222', 3),
-- �������רҵѧ��
('20231003331', 2), ('20231003331', 5),
('20231003332', 1), ('20231003332', 5),
-- ������רҵѧ��
('20231004441', 2), ('20231004441', 6);

-- ����ɼ����ݣ����������Զ������ܳɼ����ȼ���GPA��
INSERT INTO grades (student_id, class_id, regular_score, midterm_score, final_score, recorded_by) VALUES
-- ��С���ĳɼ�
('20231001111', 1, 85.0, 88.0, 92.0, 'T001'), -- ���ݿ�ԭ��
('20231001111', 3, 78.0, 82.0, 85.0, 'T002'), -- ���ݽṹ
('20231001111', 6, 90.0, 93.0, 95.0, 'T002'), -- �˹����ܵ���
-- ��С��ĳɼ�
('20231001112', 1, 92.0, 90.0, 94.0, 'T001'), -- ���ݿ�ԭ��
('20231001112', 3, 88.0, 85.0, 87.0, 'T002'), -- ���ݽṹ
-- ��Сǿ�ĳɼ�
('20231001113', 1, 75.0, 78.0, 80.0, 'T001'), -- ���ݿ�ԭ��
('20231001113', 4, 82.0, 85.0, 88.0, 'T003'), -- ���������
-- ��С���ĳɼ�
('20231002221', 2, 95.0, 93.0, 96.0, 'T001'), -- ���ݿ�ԭ��
('20231002221', 4, 87.0, 89.0, 91.0, 'T003'), -- ���������
-- ��С���ĳɼ�
('20231002222', 2, 80.0, 83.0, 85.0, 'T001'), -- ���ݿ�ԭ��
('20231002222', 3, 76.0, 79.0, 82.0, 'T002'), -- ���ݽṹ
-- ��С���ĳɼ�
('20231003331', 2, 88.0, 90.0, 92.0, 'T001'), -- ���ݿ�ԭ��
('20231003331', 5, 85.0, 87.0, 89.0, 'T004'), -- �������
-- ��Сΰ�ĳɼ�
('20231003332', 1, 79.0, 81.0, 84.0, 'T001'), -- ���ݿ�ԭ��
('20231003332', 5, 82.0, 84.0, 86.0, 'T004'), -- �������
-- ��С���ĳɼ�
('20231004441', 2, 91.0, 89.0, 93.0, 'T001'), -- ���ݿ�ԭ��
('20231004441', 6, 87.0, 90.0, 92.0, 'T002'); -- �˹����ܵ���

-- =============================================================================
-- 7. �༶����ݣ���ʾ������ܣ�
-- =============================================================================

-- ����༶���ʾ����
INSERT INTO class_activities (
    class_id, activity_name, activity_type, description, location, 
    start_time, end_time, organizer_id, budget_amount, actual_cost,
    participant_count, required_attendance, status
) VALUES
-- ��Ϣ��ѧ�뼼��1��
(1, '���ݿ�γ����չʾ', 'ѧϰ', 'չʾ��С������ݿ�γ���Ƴɹ����໥ѧϰ����', 'A101����', 
 '2024-12-20 14:00:00', '2024-12-20 16:30:00', '20231001111', 200.00, 180.50, 3, true, 'planned'),

(1, 'Ԫ��������', '����', '�༶Ԫ�������ᣬ׼����Ŀ����Ϸ�;۲�', 'ѧ�������', 
 '2024-12-31 18:00:00', '2024-12-31 21:00:00', '20231001112', 800.00, 0.00, 0, false, 'planned'),

(1, 'רҵ��֪ʵϰ', 'ѧϰ', '�ι۵���֪��IT��ҵ���˽���ҵ��չ��״', '�½����԰', 
 '2024-11-15 08:00:00', '2024-11-15 18:00:00', '20231001111', 300.00, 285.00, 3, true, 'completed'),

-- ���簲ȫ2��
(2, '���簲ȫ���ܾ���', 'ѧϰ', '�༶�ڲ����簲ȫ֪ʶ����������רҵ����', 'B202ʵ����', 
 '2024-12-25 13:30:00', '2024-12-25 17:00:00', '20231002221', 150.00, 120.00, 2, false, 'planned'),

(2, '�༶������', '����', '�������༶���������������', '����������', 
 '2024-12-18 16:00:00', '2024-12-18 18:00:00', '20231002222', 100.00, 85.00, 2, false, 'completed'),

-- �������3��
(3, '���������Ŀ·��', 'ѧϰ', 'չʾ��ѧ��������̿γ���Ŀ�ɹ�', 'C301������', 
 '2024-12-22 09:00:00', '2024-12-22 12:00:00', '20231003331', 250.00, 0.00, 0, true, 'planned'),

(3, '־Ը����', '־Ը', '��ʯ�����о���Ժ��չ־Ը����', 'ʯ�����о���Ժ', 
 '2024-11-20 09:00:00', '2024-11-20 15:00:00', '20231003332', 200.00, 180.00, 2, false, 'completed'),

-- ������4��
(4, '�����ݷ�����������', 'ѧϰ', '������ҵר�ҷ�������ݷ���ʵ�ʰ���', 'D401������', 
 '2024-12-28 14:00:00', '2024-12-28 16:00:00', '20231004441', 300.00, 0.00, 0, false, 'planned'),

-- ��༶���ϻ
(1, '��ĩ��ϰ���ɻ�', 'ѧϰ', '������꼶ѧ��ѧ�����ѧϰ���飬���ɽ��', 'ͼ��ݱ�����', 
 '2024-12-10 19:00:00', '2024-12-10 21:00:00', '20231001113', 100.00, 95.00, 3, false, 'completed'),

(2, '�༶���λ', '����', 'ǰ����ɽ��Ͽ�Ƚ������Σ�����ͬѧ����', '��ɽ��Ͽ��', 
 '2024-10-15 07:00:00', '2024-10-15 19:00:00', '20231002221', 1200.00, 1150.00, 2, false, 'completed');

-- ���������¼ʾ��
INSERT INTO activity_participants (activity_id, student_id, attendance_status, feedback) VALUES
-- רҵ��֪ʵϰ�����¼
(3, '20231001111', 'attended', '��ҵ�ιۺ������壬��רҵ��չ���˸���������ʶ'),
(3, '20231001112', 'attended', '�ջ�ܴ��˽���ʵ�ʹ�������'),
(3, '20231001113', 'attended', 'ϣ���Ժ����֯���ƻ'),

-- �����������¼
(5, '20231002221', 'attended', '�����ܾ��ʣ������˰༶�Ž�'),
(5, '20231002222', 'attended', '�˶��ô�Ҹ��л���'),

-- ־Ը��������¼
(7, '20231003331', 'attended', '�������˺������壬������μ�־Ը�'),
(7, '20231003332', 'attended', 'ͨ���������ˣ��Լ�Ҳ�ջ��˳ɳ�'),

-- ��ĩ��ϰ���ɻ�����¼
(9, '20231001111', 'attended', 'ѧ���ľ�������ʵ��'),
(9, '20231001112', 'attended', '����˺ܶ�ѧϰ����'),
(9, '20231001113', 'attended', '����ĩ���Ը���������'),

-- ���λ�����¼
(10, '20231002221', 'attended', '�羰������ͬѧ����úܿ���'),
(10, '20231002222', 'attended', '�Ŷӻ����������');