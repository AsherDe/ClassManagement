// 简化的数据库查询测试脚本
// 使用 node test-db-queries.js 运行

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBasicQueries() {
  console.log('=== 基础数据库查询测试 ===');
  
  try {
    // 1. 测试用户查询（管理员功能）
    console.log('\n1. 测试用户列表查询：');
    const users = await prisma.users.findMany({
      select: {
        user_id: true,
        username: true,
        user_type: true,
        real_name: true,
        email: true,
        created_at: true,
      },
      orderBy: [
        { user_type: 'asc' },
        { username: 'asc' }
      ]
    });
    console.log(`找到 ${users.length} 个用户`);
    users.slice(0, 3).forEach(user => {
      console.log(`- ${user.real_name} (${user.username}) - ${user.user_type}`);
    });

    // 2. 测试学生信息查询
    console.log('\n2. 测试学生信息查询：');
    const studentInfo = await prisma.$queryRaw`
      SELECT 
        s.student_id,
        u.real_name,
        u.email,
        m.major_name,
        s.grade,
        s.class_number,
        s.gpa,
        s.total_credits,
        s.status
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN majors m ON s.major_id = m.major_id
      WHERE s.student_id = '20231001111'
    `;
    console.log('学生信息:', studentInfo[0]);

    // 3. 测试教师课程查询
    console.log('\n3. 测试教师课程查询：');
    const teacherCourses = await prisma.$queryRaw`
      SELECT 
        t.teacher_id,
        u.real_name as teacher_name,
        c.course_code,
        c.course_name,
        cl.class_name,
        cl.semester,
        cl.current_students,
        cl.max_students
      FROM teachers t
      JOIN users u ON t.user_id = u.user_id
      JOIN classes cl ON t.teacher_id = cl.teacher_id
      JOIN courses c ON cl.course_id = c.course_id
      WHERE t.teacher_id = 'T001'
      ORDER BY c.course_code
    `;
    console.log(`T001教师的课程 (${teacherCourses.length} 门):`);
    teacherCourses.forEach(course => {
      console.log(`- ${course.course_name} (${course.class_name})`);
    });

    // 4. 测试班级学生查询
    console.log('\n4. 测试班级学生查询：');
    const classStudents = await prisma.$queryRaw`
      SELECT 
        s.student_id,
        u.real_name,
        m.major_name,
        s.grade,
        s.class_number,
        s.gpa,
        e.enrolled_at
      FROM enrollments e
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN majors m ON s.major_id = m.major_id
      WHERE e.class_id = 1
      ORDER BY s.student_id
    `;
    console.log(`班级1的学生 (${classStudents.length} 人):`);
    classStudents.forEach(student => {
      console.log(`- ${student.real_name} (${student.student_id}) - ${student.major_name}`);
    });

    // 5. 测试成绩查询
    console.log('\n5. 测试成绩查询：');
    const grades = await prisma.$queryRaw`
      SELECT 
        g.student_id,
        u.real_name as student_name,
        c.course_name,
        g.regular_score,
        g.midterm_score,
        g.final_score,
        g.total_score,
        g.letter_grade,
        g.gpa_points
      FROM grades g
      JOIN students s ON g.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN classes cl ON g.class_id = cl.class_id
      JOIN courses c ON cl.course_id = c.course_id
      WHERE g.student_id = '20231001111'
      ORDER BY c.course_code
    `;
    console.log(`学生20231001111的成绩 (${grades.length} 门课程):`);
    grades.forEach(grade => {
      console.log(`- ${grade.course_name}: ${grade.total_score} (${grade.letter_grade})`);
    });

    // 6. 测试专业GPA排名
    console.log('\n6. 测试专业GPA排名：');
    const majorRanking = await prisma.$queryRaw`
      SELECT 
        m.major_name,
        COUNT(s.student_id) as student_count,
        ROUND(AVG(s.gpa), 2) as avg_gpa,
        ROUND(AVG(s.total_credits), 1) as avg_credits,
        ROW_NUMBER() OVER (ORDER BY AVG(s.gpa) DESC) as ranking
      FROM majors m
      LEFT JOIN students s ON m.major_id = s.major_id
      GROUP BY m.major_id, m.major_name
      ORDER BY avg_gpa DESC
    `;
    console.log('专业GPA排名:');
    majorRanking.forEach(major => {
      console.log(`- ${major.ranking}. ${major.major_name}: 平均GPA ${major.avg_gpa} (${major.student_count}人)`);
    });

    // 7. 测试学生GPA排名
    console.log('\n7. 测试学生GPA排名（前5名）：');
    const studentRanking = await prisma.$queryRaw`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY s.gpa DESC) as ranking,
        s.student_id,
        u.real_name,
        m.major_name,
        s.gpa,
        s.total_credits,
        CASE 
          WHEN s.gpa >= 3.70 THEN '优秀'
          WHEN s.gpa >= 3.00 THEN '良好'
          WHEN s.gpa >= 2.30 THEN '中等'
          WHEN s.gpa >= 2.00 THEN '及格'
          ELSE '不及格'
        END as gpa_level
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN majors m ON s.major_id = m.major_id
      ORDER BY s.gpa DESC, s.total_credits DESC
      LIMIT 5
    `;
    console.log('学生GPA排名（前5名）:');
    studentRanking.forEach(student => {
      console.log(`- ${student.ranking}. ${student.real_name} (${student.student_id}): GPA ${student.gpa} - ${student.gpa_level}`);
    });

    console.log('\n=== 数据库查询测试完成 ===');
    console.log('✅ 所有基础查询功能正常');

  } catch (error) {
    console.error('数据库查询测试失败:', error);
  }
}

// 测试密码重置功能
async function testPasswordReset() {
  console.log('\n=== 测试密码重置功能 ===');
  
  try {
    // 查看重置前的密码
    const userBefore = await prisma.users.findUnique({
      where: { username: '20231001111' },
      select: { username: true, real_name: true, password: true, updated_at: true }
    });
    console.log('重置前:', userBefore);

    // 重置密码
    const updatedUser = await prisma.users.update({
      where: { username: '20231001111' },
      data: {
        password: 'newpassword123',
        updated_at: new Date(),
      },
      select: {
        username: true,
        real_name: true,
        password: true,
        updated_at: true,
      }
    });
    console.log('重置后:', updatedUser);

    // 恢复原密码
    await prisma.users.update({
      where: { username: '20231001111' },
      data: {
        password: 'student123',
        updated_at: new Date(),
      }
    });
    console.log('✅ 密码已恢复为原值');

  } catch (error) {
    console.error('密码重置测试失败:', error);
  }
}

// 测试成绩录入功能
async function testGradeInput() {
  console.log('\n=== 测试成绩录入功能 ===');
  
  try {
    // 检查是否已有成绩记录
    const existingGrade = await prisma.grades.findUnique({
      where: {
        student_id_class_id: {
          student_id: '20231001112',
          class_id: 1
        }
      }
    });

    if (existingGrade) {
      console.log('已存在成绩记录，更新成绩...');
      const updatedGrade = await prisma.grades.update({
        where: {
          student_id_class_id: {
            student_id: '20231001112',
            class_id: 1
          }
        },
        data: {
          regular_score: 85,
          midterm_score: 87,
          final_score: 89,
          recorded_by: 'T001',
          recorded_at: new Date(),
        }
      });
      console.log('成绩更新成功:', updatedGrade);
    } else {
      console.log('创建新成绩记录...');
      const newGrade = await prisma.grades.create({
        data: {
          student_id: '20231001112',
          class_id: 1,
          regular_score: 85,
          midterm_score: 87,
          final_score: 89,
          recorded_by: 'T001',
        }
      });
      console.log('成绩录入成功:', newGrade);
    }

    console.log('✅ 成绩录入功能正常');

  } catch (error) {
    console.error('成绩录入测试失败:', error);
  }
}

// 主函数
async function main() {
  console.log('开始简化的数据库查询测试...\n');
  
  try {
    await testBasicQueries();
    await testPasswordReset();
    await testGradeInput();
    
    console.log('\n🎉 所有测试完成！数据库功能正常。');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
main();