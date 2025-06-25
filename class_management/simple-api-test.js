/**
 * 简化的API测试脚本
 * 测试基本的API连通性和现有功能
 */

// 测试现有的API端点
async function testExistingAPIs() {
  console.log('🚀 开始测试现有API功能...\n');

  try {
    // 测试系统统计API
    console.log('1. 测试系统统计API...');
    const response = await fetch('http://localhost:3000/api/trpc/admin.getSystemStats?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 系统统计API正常工作');
      console.log('系统数据:', data[0]?.result?.data);
    } else {
      console.log('❌ 系统统计API响应错误:', response.status);
    }

    // 测试用户查询API
    console.log('\n2. 测试用户查询API...');
    const userResponse = await fetch('http://localhost:3000/api/trpc/user.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ 用户查询API正常工作');
      console.log('用户数量:', userData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 用户查询API响应错误:', userResponse.status);
    }

    // 测试课程查询API
    console.log('\n3. 测试课程查询API...');
    const courseResponse = await fetch('http://localhost:3000/api/trpc/course.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (courseResponse.ok) {
      const courseData = await courseResponse.json();
      console.log('✅ 课程查询API正常工作');
      console.log('课程数量:', courseData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 课程查询API响应错误:', courseResponse.status);
    }

    // 测试班级查询API
    console.log('\n4. 测试班级查询API...');
    const classResponse = await fetch('http://localhost:3000/api/trpc/class.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (classResponse.ok) {
      const classData = await classResponse.json();
      console.log('✅ 班级查询API正常工作');
      console.log('班级数量:', classData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 班级查询API响应错误:', classResponse.status);
    }

    // 测试学生查询API
    console.log('\n5. 测试学生查询API...');
    const studentResponse = await fetch('http://localhost:3000/api/trpc/student.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (studentResponse.ok) {
      const studentData = await studentResponse.json();
      console.log('✅ 学生查询API正常工作');
      console.log('学生数量:', studentData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 学生查询API响应错误:', studentResponse.status);
    }

    // 测试成绩查询API
    console.log('\n6. 测试成绩查询API...');
    const gradeResponse = await fetch('http://localhost:3000/api/trpc/grade.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (gradeResponse.ok) {
      const gradeData = await gradeResponse.json();
      console.log('✅ 成绩查询API正常工作');
      console.log('成绩数量:', gradeData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 成绩查询API响应错误:', gradeResponse.status);
    }

    // 测试活动查询API
    console.log('\n7. 测试活动查询API...');
    const activityResponse = await fetch('http://localhost:3000/api/trpc/activity.getAll?batch=1&input=%7B%220%22%3A%7B%7D%7D');
    
    if (activityResponse.ok) {
      const activityData = await activityResponse.json();
      console.log('✅ 活动查询API正常工作');
      console.log('活动数量:', activityData[0]?.result?.data?.length || 0);
    } else {
      console.log('❌ 活动查询API响应错误:', activityResponse.status);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 API测试完成');
  console.log('📌 所有查询类API都已测试，创建/更新类API需要在前端界面中测试');
}

// 运行测试
testExistingAPIs().catch(console.error);