// 后端API测试脚本
// 使用 node test-apis.js 运行

const BASE_URL = 'http://localhost:3001/api/trpc';

async function makeRequest(endpoint, data = null) {
  const url = `${BASE_URL}/${endpoint}`;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error in ${endpoint}:`, error.message);
    return null;
  }
}

async function testLogin() {
  console.log('=== 测试登录功能 ===');
  
  const loginData = {
    username: 'admin',
    password: 'admin123'
  };

  const result = await makeRequest('auth.login', loginData);
  console.log('管理员登录结果:', result);
  
  // 测试学生登录
  const studentLogin = {
    username: '20231001111',
    password: 'student123'
  };
  
  const studentResult = await makeRequest('auth.login', studentLogin);
  console.log('学生登录结果:', studentResult);
  
  return result;
}

async function testAdminAPIs() {
  console.log('\n=== 测试管理员功能 ===');
  
  // 查询所有用户
  const users = await makeRequest('admin.getAllUsers');
  console.log('用户列表:', users?.result?.data?.slice(0, 3)); // 只显示前3个
  
  // 重置密码
  const resetData = {
    username: '20231001111',
    newPassword: 'newpassword123'
  };
  
  const resetResult = await makeRequest('admin.resetUserPassword', resetData);
  console.log('密码重置结果:', resetResult);
  
  // 查看密码重置后的用户信息
  const userInfo = await makeRequest('admin.getUserByUsername', { username: '20231001111' });
  console.log('重置后用户信息:', userInfo);
  
  // 获取系统统计
  const stats = await makeRequest('admin.getSystemStats');
  console.log('系统统计:', stats);
}

async function testTeacherAPIs() {
  console.log('\n=== 测试教师功能 ===');
  
  // 查看教师课程
  const courses = await makeRequest('teacher.getTeacherCourses', { teacherId: 'T001' });
  console.log('T001教师课程:', courses);
  
  // 查看班级学生
  const students = await makeRequest('teacher.getClassStudents', { classId: 1 });
  console.log('班级1学生:', students);
  
  // 查看班级成绩
  const grades = await makeRequest('teacher.getClassGrades', { classId: 1 });
  console.log('班级1成绩:', grades);
  
  // 录入成绩
  const gradeData = {
    studentId: '20231001112',
    classId: 1,
    regularScore: 85,
    midtermScore: 87,
    finalScore: 89,
    recordedBy: 'T001'
  };
  
  const gradeResult = await makeRequest('teacher.upsertGrade', gradeData);
  console.log('成绩录入结果:', gradeResult);
  
  // 教师工作量统计
  const workload = await makeRequest('teacher.getTeacherWorkload');
  console.log('教师工作量:', workload);
  
  // 课程成绩分析
  const analysis = await makeRequest('teacher.getCourseGradeAnalysis', { teacherId: 'T001' });
  console.log('课程成绩分析:', analysis);
}

async function testStudentAPIs() {
  console.log('\n=== 测试学生功能 ===');
  
  // 查看学生个人信息
  const studentInfo = await makeRequest('studentInfo.getStudentInfo', { studentId: '20231001111' });
  console.log('学生个人信息:', studentInfo);
  
  // 查看学生课程
  const courses = await makeRequest('studentInfo.getStudentCourses', { studentId: '20231001111' });
  console.log('学生课程:', courses);
  
  // 查看学生成绩
  const grades = await makeRequest('studentInfo.getStudentGrades', { studentId: '20231001111' });
  console.log('学生成绩:', grades);
  
  // 学生GPA统计
  const gpaStats = await makeRequest('studentInfo.getStudentGPAStats', { studentId: '20231001111' });
  console.log('学生GPA统计:', gpaStats);
  
  // 获取同班同学
  const classmates = await makeRequest('studentInfo.getClassmates', { studentId: '20231001111' });
  console.log('同班同学:', classmates);
}

async function testComplexQueries() {
  console.log('\n=== 测试复杂查询 ===');
  
  // 各专业GPA排名
  const majorRanking = await makeRequest('studentInfo.getMajorGPARanking');
  console.log('专业GPA排名:', majorRanking);
  
  // 学生GPA排名
  const studentRanking = await makeRequest('studentInfo.getAllStudentsGPARanking');
  console.log('学生GPA排名:', studentRanking?.result?.data?.slice(0, 5)); // 前5名
}

async function testGradeAPIs() {
  console.log('\n=== 测试成绩管理 ===');
  
  // 获取所有成绩
  const allGrades = await makeRequest('grade.getAll', { classId: 1 });
  console.log('班级1所有成绩:', allGrades?.result?.data?.slice(0, 3));
  
  // 根据学生获取成绩
  const studentGrades = await makeRequest('grade.getByStudent', { studentId: '20231001111' });
  console.log('学生20231001111成绩:', studentGrades);
  
  // 获取成绩统计
  const gradeStats = await makeRequest('grade.getStatistics', { classId: 1 });
  console.log('班级1成绩统计:', gradeStats);
}

// 主测试函数
async function runAllTests() {
  console.log('开始测试所有API功能...\n');
  
  try {
    // 测试登录
    await testLogin();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试管理员功能
    await testAdminAPIs();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试教师功能
    await testTeacherAPIs();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试学生功能
    await testStudentAPIs();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试复杂查询
    await testComplexQueries();
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试成绩管理
    await testGradeAPIs();
    
    console.log('\n=== 所有API测试完成 ===');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
}

// 检查是否直接运行此脚本
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testLogin,
  testAdminAPIs,
  testTeacherAPIs,
  testStudentAPIs,
  testComplexQueries,
  testGradeAPIs,
  runAllTests
};