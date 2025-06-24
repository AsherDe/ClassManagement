import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== 数据库连接检查 ===');
    
    // 检查学生数据
    const studentCount = await prisma.students.count();
    console.log(`学生数量: ${studentCount}`);
    
    if (studentCount > 0) {
      const students = await prisma.students.findMany({
        include: {
          user: {
            select: {
              username: true,
              real_name: true,
              email: true
            }
          },
          major: {
            select: {
              major_name: true
            }
          }
        },
        take: 5
      });
      
      console.log('\n=== 前5个学生数据 ===');
      students.forEach((student, index) => {
        console.log(`${index + 1}. 学号: ${student.student_id}`);
        console.log(`   姓名: ${student.user.real_name}`);
        console.log(`   用户名: ${student.user.username}`);
        console.log(`   邮箱: ${student.user.email || '未设置'}`);
        console.log(`   专业: ${student.major?.major_name || '未分配'}`);
        console.log(`   年级: ${student.grade}级${student.class_number}班`);
        console.log(`   状态: ${student.status}`);
        console.log('---');
      });
    }
    
    // 检查其他数据
    const userCount = await prisma.users.count();
    const classCount = await prisma.classes.count();
    const courseCount = await prisma.courses.count();
    const gradeCount = await prisma.grades.count();
    const majorCount = await prisma.majors.count();
    
    console.log('\n=== 数据统计 ===');
    console.log(`用户数量: ${userCount}`);
    console.log(`专业数量: ${majorCount}`);
    console.log(`班级数量: ${classCount}`);
    console.log(`课程数量: ${courseCount}`);
    console.log(`成绩数量: ${gradeCount}`);
    
    // 检查用户类型分布
    const adminCount = await prisma.users.count({ where: { user_type: 'admin' } });
    const teacherCount = await prisma.users.count({ where: { user_type: 'teacher' } });
    const studentUserCount = await prisma.users.count({ where: { user_type: 'student' } });
    
    console.log('\n=== 用户类型分布 ===');
    console.log(`管理员: ${adminCount}`);
    console.log(`教师: ${teacherCount}`);
    console.log(`学生用户: ${studentUserCount}`);
    
  } catch (error) {
    console.error('数据库查询出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();