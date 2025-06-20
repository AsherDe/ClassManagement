-- 石河子大学班级事务管理系统 - 测试数据插入脚本
-- PostgreSQL 测试数据生成

-- 清空数据（按依赖关系顺序）
TRUNCATE TABLE user_permissions RESTART IDENTITY CASCADE;
TRUNCATE TABLE permissions RESTART IDENTITY CASCADE;
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_funds RESTART IDENTITY CASCADE;
TRUNCATE TABLE grades RESTART IDENTITY CASCADE;
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_activities RESTART IDENTITY CASCADE;
TRUNCATE TABLE course_schedule RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE students RESTART IDENTITY CASCADE;
TRUNCATE TABLE teachers RESTART IDENTITY CASCADE;
TRUNCATE TABLE classes RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- 重置序列
ALTER SEQUENCE user_id_seq RESTART WITH 1000;
ALTER SEQUENCE class_id_seq RESTART WITH 1;
ALTER SEQUENCE course_id_seq RESTART WITH 1;
ALTER SEQUENCE activity_id_seq RESTART WITH 1;
ALTER SEQUENCE attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE grade_id_seq RESTART WITH 1;
ALTER SEQUENCE fund_id_seq RESTART WITH 1;
ALTER SEQUENCE notification_id_seq RESTART WITH 1;
ALTER SEQUENCE permission_id_seq RESTART WITH 1;

-- 插入基础用户数据
INSERT INTO users (username, password_hash, email, phone, user_type, status, profile_data) VALUES
-- 管理员用户
('admin', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'admin@shzu.edu.cn', '13999999999', 'admin', 'active', '{"role": "系统管理员", "department": "信息中心"}'),
-- 教师用户
('teacher001', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'zhang.wei@shzu.edu.cn', '13888888888', 'teacher', 'active', '{"title": "教授"}'),
('teacher002', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'li.ming@shzu.edu.cn', '13777777777', 'teacher', 'active', '{"title": "副教授"}'),
('teacher003', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'wang.fang@shzu.edu.cn', '13666666666', 'teacher', 'active', '{"title": "讲师"}'),
('teacher004', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'liu.jun@shzu.edu.cn', '13555555555', 'teacher', 'active', '{"title": "助教"}'),
-- 学生用户 (50个学生)
('20210101', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student001@stu.shzu.edu.cn', '13111111111', 'student', 'active', '{"grade": 2021}'),
('20210102', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student002@stu.shzu.edu.cn', '13111111112', 'student', 'active', '{"grade": 2021}'),
('20210103', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student003@stu.shzu.edu.cn', '13111111113', 'student', 'active', '{"grade": 2021}'),
('20210104', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student004@stu.shzu.edu.cn', '13111111114', 'student', 'active', '{"grade": 2021}'),
('20210105', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student005@stu.shzu.edu.cn', '13111111115', 'student', 'active', '{"grade": 2021}'),
('20210106', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student006@stu.shzu.edu.cn', '13111111116', 'student', 'active', '{"grade": 2021}'),
('20210107', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student007@stu.shzu.edu.cn', '13111111117', 'student', 'active', '{"grade": 2021}'),
('20210108', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student008@stu.shzu.edu.cn', '13111111118', 'student', 'active', '{"grade": 2021}'),
('20210109', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student009@stu.shzu.edu.cn', '13111111119', 'student', 'active', '{"grade": 2021}'),
('20210110', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student010@stu.shzu.edu.cn', '13111111120', 'student', 'active', '{"grade": 2021}'),
('20210201', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student011@stu.shzu.edu.cn', '13111111121', 'student', 'active', '{"grade": 2021}'),
('20210202', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student012@stu.shzu.edu.cn', '13111111122', 'student', 'active', '{"grade": 2021}'),
('20210203', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student013@stu.shzu.edu.cn', '13111111123', 'student', 'active', '{"grade": 2021}'),
('20210204', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student014@stu.shzu.edu.cn', '13111111124', 'student', 'active', '{"grade": 2021}'),
('20210205', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student015@stu.shzu.edu.cn', '13111111125', 'student', 'active', '{"grade": 2021}'),
('20220101', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student016@stu.shzu.edu.cn', '13111111126', 'student', 'active', '{"grade": 2022}'),
('20220102', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student017@stu.shzu.edu.cn', '13111111127', 'student', 'active', '{"grade": 2022}'),
('20220103', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student018@stu.shzu.edu.cn', '13111111128', 'student', 'active', '{"grade": 2022}'),
('20220104', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student019@stu.shzu.edu.cn', '13111111129', 'student', 'active', '{"grade": 2022}'),
('20220105', '$2b$10$8K1p/a0dM8V2KW8m.sRbGuOcxJR1M7VxYVZKcJ5dqLNFM2oPvWQAa', 'student020@stu.shzu.edu.cn', '13111111130', 'student', 'active', '{"grade": 2022}');

-- 插入教师信息
INSERT INTO teachers (id, teacher_code, name, gender, birth_date, id_card, department, title, education, phone, email, office_location, hire_date) VALUES
(1001, 'T001', '张伟', 'male', '1975-03-15', '654001197503154321', '计算机科学与技术学院', '教授', '博士', '13888888888', 'zhang.wei@shzu.edu.cn', '信息楼301', '2000-09-01'),
(1002, 'T002', '李明', 'male', '1980-07-22', '654001198007224567', '计算机科学与技术学院', '副教授', '硕士', '13777777777', 'li.ming@shzu.edu.cn', '信息楼302', '2005-03-01'),
(1003, 'T003', '王芳', 'female', '1985-11-08', '654001198511089876', '软件工程学院', '讲师', '硕士', '13666666666', 'wang.fang@shzu.edu.cn', '信息楼303', '2010-09-01'),
(1004, 'T004', '刘军', 'male', '1990-05-20', '654001199005201234', '软件工程学院', '助教', '学士', '13555555555', 'liu.jun@shzu.edu.cn', '信息楼304', '2015-03-01');

-- 插入班级信息
INSERT INTO classes (class_name, class_code, grade_level, major, department, enrollment_year, class_teacher_id) VALUES
('计算机2021-1班', 'CS2021-1', 3, '计算机科学与技术', '计算机科学与技术学院', 2021, 1001),
('计算机2021-2班', 'CS2021-2', 3, '计算机科学与技术', '计算机科学与技术学院', 2021, 1002),
('软件工程2022-1班', 'SE2022-1', 2, '软件工程', '软件工程学院', 2022, 1003);

-- 插入学生信息
INSERT INTO students (id, student_code, name, gender, birth_date, id_card, class_id, enrollment_date, phone, email, home_address, emergency_contact, emergency_phone) VALUES
-- 计算机2021-1班学生
(1005, '20210101', '陈浩', 'male', '2003-01-15', '654001200301151234', 1, '2021-09-01', '13111111111', 'student001@stu.shzu.edu.cn', '新疆石河子市', '陈父', '13911111111'),
(1006, '20210102', '赵丽', 'female', '2003-03-20', '654001200303201234', 1, '2021-09-01', '13111111112', 'student002@stu.shzu.edu.cn', '新疆乌鲁木齐市', '赵母', '13911111112'),
(1007, '20210103', '孙强', 'male', '2002-12-10', '654001200212101234', 1, '2021-09-01', '13111111113', 'student003@stu.shzu.edu.cn', '新疆克拉玛依市', '孙父', '13911111113'),
(1008, '20210104', '周雅', 'female', '2003-05-08', '654001200305081234', 1, '2021-09-01', '13111111114', 'student004@stu.shzu.edu.cn', '新疆昌吉市', '周母', '13911111114'),
(1009, '20210105', '吴峰', 'male', '2003-02-28', '654001200302281234', 1, '2021-09-01', '13111111115', 'student005@stu.shzu.edu.cn', '新疆伊犁州', '吴父', '13911111115'),
(1010, '20210106', '郑敏', 'female', '2003-08-12', '654001200308121234', 1, '2021-09-01', '13111111116', 'student006@stu.shzu.edu.cn', '新疆哈密市', '郑母', '13911111116'),
(1011, '20210107', '冯涛', 'male', '2003-04-18', '654001200304181234', 1, '2021-09-01', '13111111117', 'student007@stu.shzu.edu.cn', '新疆阿克苏市', '冯父', '13911111117'),
(1012, '20210108', '何静', 'female', '2003-07-25', '654001200307251234', 1, '2021-09-01', '13111111118', 'student008@stu.shzu.edu.cn', '新疆喀什市', '何母', '13911111118'),
(1013, '20210109', '韩磊', 'male', '2003-09-30', '654001200309301234', 1, '2021-09-01', '13111111119', 'student009@stu.shzu.edu.cn', '新疆塔城市', '韩父', '13911111119'),
(1014, '20210110', '卢婧', 'female', '2003-06-14', '654001200306141234', 1, '2021-09-01', '13111111120', 'student010@stu.shzu.edu.cn', '新疆阿勒泰市', '卢母', '13911111120'),
-- 计算机2021-2班学生
(1015, '20210201', '邓宇', 'male', '2003-01-22', '654001200301221234', 2, '2021-09-01', '13111111121', 'student011@stu.shzu.edu.cn', '新疆博乐市', '邓父', '13911111121'),
(1016, '20210202', '姚娜', 'female', '2003-03-17', '654001200303171234', 2, '2021-09-01', '13111111122', 'student012@stu.shzu.edu.cn', '新疆库尔勒市', '姚母', '13911111122'),
(1017, '20210203', '石鑫', 'male', '2002-11-05', '654001200211051234', 2, '2021-09-01', '13111111123', 'student013@stu.shzu.edu.cn', '新疆奎屯市', '石父', '13911111123'),
(1018, '20210204', '龚慧', 'female', '2003-04-11', '654001200304111234', 2, '2021-09-01', '13111111124', 'student014@stu.shzu.edu.cn', '新疆阿拉尔市', '龚母', '13911111124'),
(1019, '20210205', '常龙', 'male', '2003-08-26', '654001200308261234', 2, '2021-09-01', '13111111125', 'student015@stu.shzu.edu.cn', '新疆图木舒克市', '常父', '13911111125'),
-- 软件工程2022-1班学生
(1020, '20220101', '金明', 'male', '2004-02-14', '654001200402141234', 3, '2022-09-01', '13111111126', 'student016@stu.shzu.edu.cn', '新疆五家渠市', '金父', '13911111126'),
(1021, '20220102', '范琳', 'female', '2004-05-09', '654001200405091234', 3, '2022-09-01', '13111111127', 'student017@stu.shzu.edu.cn', '新疆石河子市', '范母', '13911111127'),
(1022, '20220103', '谭伟', 'male', '2004-01-03', '654001200401031234', 3, '2022-09-01', '13111111128', 'student018@stu.shzu.edu.cn', '新疆乌鲁木齐市', '谭父', '13911111128'),
(1023, '20220104', '廖雪', 'female', '2004-06-21', '654001200406211234', 3, '2022-09-01', '13111111129', 'student019@stu.shzu.edu.cn', '新疆克拉玛依市', '廖母', '13911111129'),
(1024, '20220105', '江东', 'male', '2004-03-16', '654001200403161234', 3, '2022-09-01', '13111111130', 'student020@stu.shzu.edu.cn', '新疆昌吉市', '江父', '13911111130');

-- 更新班级的班长和副班长
UPDATE classes SET monitor_id = 1005, vice_monitor_id = 1006 WHERE id = 1;
UPDATE classes SET monitor_id = 1015, vice_monitor_id = 1016 WHERE id = 2;
UPDATE classes SET monitor_id = 1020, vice_monitor_id = 1021 WHERE id = 3;

-- 插入课程信息
INSERT INTO courses (course_code, course_name, credits, course_type, department, course_description, total_hours, theory_hours, practice_hours) VALUES
('CS101', '计算机科学导论', 3.0, '必修', '计算机科学与技术学院', '计算机科学基础理论和应用概述', 48, 32, 16),
('CS102', '程序设计基础', 4.0, '必修', '计算机科学与技术学院', 'C语言程序设计基础', 64, 32, 32),
('CS201', '数据结构与算法', 4.0, '必修', '计算机科学与技术学院', '数据结构基础与算法分析', 64, 48, 16),
('CS202', '计算机组成原理', 3.5, '必修', '计算机科学与技术学院', '计算机硬件组成与工作原理', 56, 48, 8),
('CS301', '数据库系统原理', 3.5, '必修', '计算机科学与技术学院', '数据库理论与实践应用', 56, 40, 16),
('CS302', '操作系统', 3.5, '必修', '计算机科学与技术学院', '操作系统基本概念与实现', 56, 48, 8),
('SE201', '软件工程', 3.0, '必修', '软件工程学院', '软件开发方法论与项目管理', 48, 40, 8),
('SE202', 'Web开发技术', 3.5, '选修', '软件工程学院', '前端与后端Web开发技术', 56, 32, 24),
('MATH101', '高等数学A', 5.0, '公共', '数学学院', '微积分基础理论', 80, 80, 0),
('ENG101', '大学英语', 3.0, '公共', '外语学院', '大学英语综合教程', 48, 48, 0);

-- 插入课程安排
INSERT INTO course_schedule (course_id, class_id, teacher_id, semester, academic_year, day_of_week, start_time, end_time, classroom, weeks) VALUES
-- 2024年第1学期课程安排
(1, 1, 1001, '2024-1', '2024-2025', 1, '08:00:00', '09:40:00', 'A101', '1-16'),
(2, 1, 1001, '2024-1', '2024-2025', 3, '10:00:00', '11:40:00', 'A102', '1-16'),
(3, 1, 1002, '2024-1', '2024-2025', 5, '14:00:00', '15:40:00', 'A103', '1-16'),
(5, 1, 1001, '2024-1', '2024-2025', 2, '16:00:00', '17:40:00', 'A104', '1-16'),
(1, 2, 1002, '2024-1', '2024-2025', 2, '08:00:00', '09:40:00', 'B101', '1-16'),
(2, 2, 1002, '2024-1', '2024-2025', 4, '10:00:00', '11:40:00', 'B102', '1-16'),
(7, 3, 1003, '2024-1', '2024-2025', 1, '10:00:00', '11:40:00', 'C101', '1-16'),
(8, 3, 1003, '2024-1', '2024-2025', 3, '14:00:00', '15:40:00', 'C102', '1-16'),
(9, 1, 1004, '2024-1', '2024-2025', 4, '08:00:00', '09:40:00', 'D101', '1-16'),
(10, 2, 1004, '2024-1', '2024-2025', 5, '08:00:00', '09:40:00', 'D102', '1-16');

-- 插入班级活动
INSERT INTO class_activities (class_id, activity_name, activity_type, description, location, start_time, end_time, organizer_id, budget_amount, required_attendance, status) VALUES
(1, '新学期见面会', '学习', '新学期班级见面会，介绍课程安排和学习计划', '教学楼A101', '2024-09-05 19:00:00', '2024-09-05 20:30:00', 1005, 100.00, true, 'completed'),
(1, '中秋节聚餐', '聚会', '中秋节班级聚餐活动', '学生食堂二楼', '2024-09-15 18:00:00', '2024-09-15 20:00:00', 1006, 800.00, false, 'completed'),
(1, '程序设计竞赛培训', '学习', '准备ACM程序设计竞赛培训', '机房B201', '2024-10-10 14:00:00', '2024-10-10 17:00:00', 1007, 50.00, false, 'completed'),
(2, '班级篮球比赛', '文体', '与其他班级进行篮球友谊赛', '体育馆', '2024-10-20 15:00:00', '2024-10-20 17:00:00', 1015, 200.00, false, 'completed'),
(2, '学习经验交流会', '学习', '优秀学生学习经验分享', '教学楼B203', '2024-11-05 19:00:00', '2024-11-05 21:00:00', 1016, 80.00, true, 'completed'),
(3, '软件项目展示会', '学习', '学生软件项目作品展示', '实验楼C301', '2024-11-15 14:00:00', '2024-11-15 17:00:00', 1020, 150.00, true, 'completed'),
(1, '元旦晚会', '文体', '庆祝元旦的班级晚会', '学生活动中心', '2024-12-30 19:00:00', '2024-12-30 22:00:00', 1005, 1000.00, false, 'planned'),
(2, '期末复习动员会', '学习', '期末考试复习动员和经验分享', '教学楼B203', '2024-12-20 19:00:00', '2024-12-20 20:30:00', 1015, 50.00, true, 'planned');

-- 插入考勤记录
INSERT INTO attendance (student_id, course_schedule_id, activity_id, attendance_date, attendance_type, status, check_in_time, notes) VALUES
-- 课程考勤记录
(1005, 1, NULL, '2024-09-02', 'course', 'present', '2024-09-02 07:55:00', NULL),
(1006, 1, NULL, '2024-09-02', 'course', 'present', '2024-09-02 08:00:00', NULL),
(1007, 1, NULL, '2024-09-02', 'course', 'late', '2024-09-02 08:10:00', '迟到10分钟'),
(1008, 1, NULL, '2024-09-02', 'course', 'present', '2024-09-02 07:58:00', NULL),
(1009, 1, NULL, '2024-09-02', 'course', 'absent', NULL, '请假'),
(1010, 1, NULL, '2024-09-02', 'course', 'present', '2024-09-02 08:02:00', NULL),
-- 活动考勤记录
(1005, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 18:55:00', NULL),
(1006, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 19:00:00', NULL),
(1007, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 19:02:00', NULL),
(1008, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 18:58:00', NULL),
(1009, NULL, 1, '2024-09-05', 'activity', 'absent', NULL, '有事缺席'),
(1010, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 19:05:00', NULL),
(1011, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 19:01:00', NULL),
(1012, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 18:59:00', NULL),
(1013, NULL, 1, '2024-09-05', 'activity', 'late', '2024-09-05 19:15:00', '迟到15分钟'),
(1014, NULL, 1, '2024-09-05', 'activity', 'present', '2024-09-05 18:57:00', NULL);

-- 插入成绩记录
INSERT INTO grades (student_id, course_id, semester, academic_year, regular_score, midterm_score, final_score, recorder_id) VALUES
-- 计算机科学导论成绩
(1005, 1, '2024-1', '2024-2025', 85.0, 88.0, 90.0, 1001),
(1006, 1, '2024-1', '2024-2025', 90.0, 92.0, 95.0, 1001),
(1007, 1, '2024-1', '2024-2025', 78.0, 80.0, 82.0, 1001),
(1008, 1, '2024-1', '2024-2025', 88.0, 85.0, 87.0, 1001),
(1009, 1, '2024-1', '2024-2025', 82.0, 84.0, 86.0, 1001),
(1010, 1, '2024-1', '2024-2025', 91.0, 89.0, 93.0, 1001),
-- 程序设计基础成绩
(1005, 2, '2024-1', '2024-2025', 88.0, 85.0, 89.0, 1001),
(1006, 2, '2024-1', '2024-2025', 93.0, 95.0, 97.0, 1001),
(1007, 2, '2024-1', '2024-2025', 75.0, 78.0, 80.0, 1001),
(1008, 2, '2024-1', '2024-2025', 86.0, 88.0, 90.0, 1001),
(1009, 2, '2024-1', '2024-2025', 80.0, 82.0, 85.0, 1001),
(1010, 2, '2024-1', '2024-2025', 89.0, 91.0, 94.0, 1001),
-- 数据结构与算法成绩
(1005, 3, '2024-1', '2024-2025', 82.0, 85.0, 88.0, 1002),
(1006, 3, '2024-1', '2024-2025', 88.0, 90.0, 92.0, 1002),
(1007, 3, '2024-1', '2024-2025', 70.0, 72.0, 75.0, 1002),
(1008, 3, '2024-1', '2024-2025', 85.0, 87.0, 89.0, 1002),
(1009, 3, '2024-1', '2024-2025', 78.0, 80.0, 83.0, 1002),
(1010, 3, '2024-1', '2024-2025', 92.0, 89.0, 91.0, 1002);

-- 插入班费记录
INSERT INTO class_funds (class_id, transaction_type, amount, category, description, transaction_date, payment_method, handler_id, approver_id, status) VALUES
-- 班费收入
(1, 'income', 2000.00, '班费收取', '2024年第一学期班费收取', '2024-09-01', 'bank_transfer', 1005, 1001, 'approved'),
(1, 'income', 500.00, '活动收入', '程序设计竞赛奖金', '2024-10-15', 'cash', 1007, 1001, 'approved'),
(2, 'income', 1800.00, '班费收取', '2024年第一学期班费收取', '2024-09-01', 'bank_transfer', 1015, 1002, 'approved'),
(3, 'income', 1500.00, '班费收取', '2024年第一学期班费收取', '2024-09-01', 'alipay', 1020, 1003, 'approved'),
-- 班费支出
(1, 'expense', 100.00, '办公用品', '购买班级活动用品', '2024-09-03', 'cash', 1006, 1005, 'approved'),
(1, 'expense', 800.00, '活动支出', '中秋节聚餐费用', '2024-09-15', 'bank_transfer', 1006, 1005, 'approved'),
(1, 'expense', 50.00, '办公用品', '程序设计竞赛培训材料', '2024-10-08', 'cash', 1007, 1005, 'approved'),
(2, 'expense', 200.00, '活动支出', '篮球比赛费用', '2024-10-18', 'cash', 1016, 1015, 'approved'),
(2, 'expense', 80.00, '办公用品', '学习交流会用品', '2024-11-03', 'cash', 1016, 1015, 'approved'),
(3, 'expense', 150.00, '活动支出', '项目展示会费用', '2024-11-13', 'alipay', 1021, 1020, 'approved'),
-- 待审批支出
(1, 'expense', 1000.00, '活动支出', '元旦晚会预算', '2024-12-15', 'bank_transfer', 1005, NULL, 'pending'),
(2, 'expense', 50.00, '办公用品', '期末复习资料', '2024-12-18', 'cash', 1015, NULL, 'pending');

-- 插入权限数据
INSERT INTO permissions (permission_name, permission_key, category, description) VALUES
('查看学生信息', 'view_students', '学生管理', '查看学生基本信息和学业情况'),
('编辑学生信息', 'edit_students', '学生管理', '编辑学生基本信息'),
('录入成绩', 'input_grades', '成绩管理', '录入和修改学生成绩'),
('查看成绩', 'view_grades', '成绩管理', '查看学生成绩信息'),
('管理班级', 'manage_class', '班级管理', '管理班级基本信息和设置'),
('审批班费', 'approve_funds', '财务管理', '审批班费收支申请'),
('发布通知', 'publish_notification', '通知管理', '发布班级和系统通知'),
('管理用户', 'manage_users', '系统管理', '管理系统用户账户'),
('系统设置', 'system_settings', '系统管理', '修改系统配置参数'),
('数据统计', 'view_statistics', '数据分析', '查看各类统计报表');

-- 插入用户权限关联
INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES
-- 管理员权限
(1000, 1, NULL), (1000, 2, NULL), (1000, 3, NULL), (1000, 4, NULL), (1000, 5, NULL),
(1000, 6, NULL), (1000, 7, NULL), (1000, 8, NULL), (1000, 9, NULL), (1000, 10, NULL),
-- 教师权限
(1001, 1, 1000), (1001, 3, 1000), (1001, 4, 1000), (1001, 5, 1000), (1001, 6, 1000), (1001, 7, 1000), (1001, 10, 1000),
(1002, 1, 1000), (1002, 3, 1000), (1002, 4, 1000), (1002, 5, 1000), (1002, 6, 1000), (1002, 7, 1000), (1002, 10, 1000),
(1003, 1, 1000), (1003, 3, 1000), (1003, 4, 1000), (1003, 5, 1000), (1003, 6, 1000), (1003, 7, 1000), (1003, 10, 1000),
(1004, 1, 1000), (1004, 4, 1000), (1004, 10, 1000),
-- 学生班长权限
(1005, 4, 1001), (1005, 7, 1001), (1005, 10, 1001),
(1015, 4, 1002), (1015, 7, 1002), (1015, 10, 1002),
(1020, 4, 1003), (1020, 7, 1003), (1020, 10, 1003);

-- 插入通知
INSERT INTO notifications (title, content, notification_type, priority, target_type, target_id, sender_id, is_published, publish_time) VALUES
('新学期开学安排', '各位同学，新学期即将开始，请注意以下安排：\n1. 9月1日正式上课\n2. 请按时到校报到\n3. 准备好相关学习用品\n请大家认真准备，新学期加油！', '班级通知', 'high', 'class', 1, 1001, true, '2024-08-25 10:00:00'),
('中秋节放假通知', '根据学校安排，中秋节放假时间为9月15日-9月17日，共3天。\n请同学们注意安全，按时返校。', '学院通知', 'normal', 'all', NULL, 1000, true, '2024-09-10 14:00:00'),
('期中考试安排', '期中考试将于10月20日-10月25日举行，请同学们认真复习，具体考试安排请关注后续通知。', '班级通知', 'high', 'class', 1, 1001, true, '2024-10-01 09:00:00'),
('班费使用公示', '本月班费使用情况：\n支出：中秋聚餐 800元\n支出：办公用品 100元\n余额：1600元\n详细账目请联系班长查看。', '班级通知', 'normal', 'class', 1, 1005, true, '2024-09-20 16:00:00'),
('程序设计竞赛通知', '学校将举办程序设计竞赛，欢迎有兴趣的同学报名参加。\n报名截止时间：10月5日\n比赛时间：10月15日\n奖励丰厚，欢迎踊跃参与！', '学院通知', 'normal', 'all', NULL, 1002, true, '2024-09-25 11:00:00'),
('元旦晚会筹备通知', '班级元旦晚会筹备工作即将开始，需要同学们积极参与：\n1. 节目征集\n2. 会场布置\n3. 后勤保障\n有意参与的同学请联系班长。', '班级通知', 'normal', 'class', 1, 1005, false, NULL);

-- 更新活动参与人数（基于考勤记录）
UPDATE class_activities SET participant_count = 9 WHERE id = 1; -- 新学期见面会

-- 手动调用一些函数来更新计算字段
SELECT calculate_class_fund_balance(1);
SELECT calculate_class_fund_balance(2);
SELECT calculate_class_fund_balance(3);

-- 更新学生GPA
SELECT update_student_credits_and_gpa(id) FROM students WHERE id BETWEEN 1005 AND 1024;

-- 插入更多测试数据以便演示复杂查询
-- 添加更多考勤记录
INSERT INTO attendance (student_id, course_schedule_id, attendance_date, attendance_type, status, check_in_time) 
SELECT 
    s.id,
    1,
    '2024-09-09'::date,
    'course',
    CASE WHEN random() < 0.1 THEN 'absent'
         WHEN random() < 0.15 THEN 'late' 
         ELSE 'present' END,
    CASE WHEN random() < 0.1 THEN NULL
         ELSE '2024-09-09 08:00:00'::timestamp + (random() * 600)::int * INTERVAL '1 second'
         END
FROM students s WHERE s.class_id = 1;

-- 提交事务
COMMIT;

-- 数据验证查询
SELECT '用户总数：' || COUNT(*) FROM users;
SELECT '教师总数：' || COUNT(*) FROM teachers;
SELECT '学生总数：' || COUNT(*) FROM students;
SELECT '班级总数：' || COUNT(*) FROM classes;
SELECT '课程总数：' || COUNT(*) FROM courses;
SELECT '课程安排总数：' || COUNT(*) FROM course_schedule;
SELECT '活动总数：' || COUNT(*) FROM class_activities;
SELECT '考勤记录总数：' || COUNT(*) FROM attendance;
SELECT '成绩记录总数：' || COUNT(*) FROM grades;
SELECT '班费记录总数：' || COUNT(*) FROM class_funds;
SELECT '通知总数：' || COUNT(*) FROM notifications;
SELECT '权限总数：' || COUNT(*) FROM permissions;
SELECT '用户权限关联总数：' || COUNT(*) FROM user_permissions;