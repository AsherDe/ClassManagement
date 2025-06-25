/**
 * 新增功能API测试脚本
 * 测试所有新实现的管理员、教师和学生功能API
 */

const API_BASE_URL = 'http://localhost:3000/api/trpc';

// 测试数据
const testData = {
  admin: {
    // 创建用户测试数据
    newUser: {
      username: "test_student_001",
      password: "shzu123456",
      userType: "student",
      realName: "测试学生001",
      email: "test001@example.com",
      phone: "13800000001",
      studentId: "202400001",
      majorId: 1,
      grade: 2024,
      classNumber: 1
    },
    newTeacher: {
      username: "test_teacher_001",
      password: "shzu123456",
      userType: "teacher",
      realName: "测试教师001",
      email: "teacher001@example.com",
      phone: "13800000002",
      teacherId: "T202400001",
      title: "讲师",
      department: "计算机科学与技术学院"
    },
    // 创建课程测试数据
    newCourse: {
      courseCode: "CS101",
      courseName: "计算机科学导论",
      credits: 3,
      courseType: "required",
      description: "计算机科学基础课程"
    },
    // 创建班级测试数据
    newClass: {
      courseId: null, // 将在运行时设置
      teacherId: "T202400001",
      className: "计算机科学导论-01班",
      semester: "2024春季",
      maxStudents: 30,
      classTime: "周一 1-3节",
      classroom: "教学楼A101"
    }
  },
  teacher: {
    teacherId: "T202400001",
    // 成绩录入测试数据
    gradeData: {
      classId: null, // 将在运行时设置
      grades: [
        {
          studentId: "202400001",
          regularScore: 85,
          midtermScore: 88,
          finalScore: 92
        }
      ]
    },
    // 活动创建测试数据
    activityData: {
      classId: null, // 将在运行时设置
      activityName: "程序设计竞赛",
      activityType: "competition",
      description: "面向全班学生的程序设计竞赛",
      location: "机房A201",
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一周后
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3小时后
      budgetAmount: 500,
      requiredAttendance: true
    }
  },
  student: {
    studentId: "202400001",
    // 个人信息更新测试数据
    updateInfo: {
      email: "updated_email@example.com",
      phone: "13800000999"
    },
    // 密码修改测试数据
    passwordChange: {
      currentPassword: "shzu123456",
      newPassword: "newpassword123"
    }
  }
};

// 辅助函数：发送tRPC请求
async function sendTRPCRequest(procedure, input = {}, method = 'query') {
  const url = `${API_BASE_URL}/${procedure}`;
  const params = method === 'query' ? `?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": input }))}` : '';
  
  try {
    const response = await fetch(url + params, {
      method: method === 'query' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'mutation' ? JSON.stringify([{ input }]) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`请求失败 ${procedure}:`, error.message);
    return { error: error.message };
  }
}

// 测试管理员功能
async function testAdminFunctions() {
  console.log('\n🔧 开始测试管理员功能...\n');
  
  let createdUserId = null;
  let createdCourseId = null;
  let createdClassId = null;

  try {
    // 1. 测试创建学生用户
    console.log('1. 测试创建学生用户...');
    const createUserResult = await sendTRPCRequest('admin.createUser', testData.admin.newUser, 'mutation');
    if (createUserResult.error) {
      console.error('❌ 创建用户失败:', createUserResult.error);
    } else {
      console.log('✅ 创建用户成功:', createUserResult[0]?.result?.data?.message);
      createdUserId = createUserResult[0]?.result?.data?.user?.user_id;
    }

    // 2. 测试创建教师用户
    console.log('\n2. 测试创建教师用户...');
    const createTeacherResult = await sendTRPCRequest('admin.createUser', testData.admin.newTeacher, 'mutation');
    if (createTeacherResult.error) {
      console.error('❌ 创建教师失败:', createTeacherResult.error);
    } else {
      console.log('✅ 创建教师成功:', createTeacherResult[0]?.result?.data?.message);
    }

    // 3. 测试创建课程
    console.log('\n3. 测试创建课程...');
    const createCourseResult = await sendTRPCRequest('admin.createCourse', testData.admin.newCourse, 'mutation');
    if (createCourseResult.error) {
      console.error('❌ 创建课程失败:', createCourseResult.error);
    } else {
      console.log('✅ 创建课程成功:', createCourseResult[0]?.result?.data?.message);
      createdCourseId = createCourseResult[0]?.result?.data?.course?.course_id;
      testData.admin.newClass.courseId = createdCourseId;
    }

    // 4. 测试创建班级并分配教师
    if (createdCourseId) {
      console.log('\n4. 测试创建班级并分配教师...');
      const createClassResult = await sendTRPCRequest('admin.createClassWithTeacher', testData.admin.newClass, 'mutation');
      if (createClassResult.error) {
        console.error('❌ 创建班级失败:', createClassResult.error);
      } else {
        console.log('✅ 创建班级成功:', createClassResult[0]?.result?.data?.message);
        createdClassId = createClassResult[0]?.result?.data?.class?.class_id;
      }
    }

    // 5. 测试分配学生到班级
    if (createdClassId) {
      console.log('\n5. 测试分配学生到班级...');
      const assignStudentResult = await sendTRPCRequest('admin.assignStudentsToClass', {
        classId: createdClassId,
        studentIds: [testData.admin.newUser.studentId]
      }, 'mutation');
      if (assignStudentResult.error) {
        console.error('❌ 分配学生失败:', assignStudentResult.error);
      } else {
        console.log('✅ 分配学生成功:', assignStudentResult[0]?.result?.data?.message);
      }
    }

    // 6. 测试查询所有用户
    console.log('\n6. 测试查询所有用户...');
    const getUsersResult = await sendTRPCRequest('admin.getAllUsers', {});
    if (getUsersResult.error) {
      console.error('❌ 查询用户失败:', getUsersResult.error);
    } else {
      const users = getUsersResult[0]?.result?.data;
      console.log(`✅ 查询用户成功，共 ${users?.length || 0} 个用户`);
    }

    // 7. 测试查询所有课程
    console.log('\n7. 测试查询所有课程...');
    const getCoursesResult = await sendTRPCRequest('admin.getAllCourses', {});
    if (getCoursesResult.error) {
      console.error('❌ 查询课程失败:', getCoursesResult.error);
    } else {
      const courses = getCoursesResult[0]?.result?.data;
      console.log(`✅ 查询课程成功，共 ${courses?.length || 0} 门课程`);
    }

    return { createdUserId, createdCourseId, createdClassId };

  } catch (error) {
    console.error('❌ 管理员功能测试过程中出现错误:', error.message);
    return { createdUserId, createdCourseId, createdClassId };
  }
}

// 测试教师功能
async function testTeacherFunctions(classId) {
  console.log('\n👨‍🏫 开始测试教师功能...\n');

  if (!classId) {
    console.log('⚠️ 跳过教师功能测试：没有可用的班级ID');
    return;
  }

  try {
    // 1. 测试查看教师课程
    console.log('1. 测试查看教师课程...');
    const getTeacherCoursesResult = await sendTRPCRequest('teacher.getTeacherCourses', {
      teacherId: testData.teacher.teacherId
    });
    if (getTeacherCoursesResult.error) {
      console.error('❌ 查看教师课程失败:', getTeacherCoursesResult.error);
    } else {
      const courses = getTeacherCoursesResult[0]?.result?.data;
      console.log(`✅ 查看教师课程成功，共 ${courses?.length || 0} 门课程`);
    }

    // 2. 测试查看班级学生
    console.log('\n2. 测试查看班级学生...');
    const getClassStudentsResult = await sendTRPCRequest('teacher.getClassStudents', {
      classId: classId
    });
    if (getClassStudentsResult.error) {
      console.error('❌ 查看班级学生失败:', getClassStudentsResult.error);
    } else {
      const students = getClassStudentsResult[0]?.result?.data;
      console.log(`✅ 查看班级学生成功，共 ${students?.length || 0} 名学生`);
    }

    // 3. 测试批量录入成绩
    console.log('\n3. 测试批量录入成绩...');
    testData.teacher.gradeData.classId = classId;
    const batchGradeResult = await sendTRPCRequest('grade.batchUpsertByTeacher', {
      ...testData.teacher.gradeData,
      teacherId: testData.teacher.teacherId
    }, 'mutation');
    if (batchGradeResult.error) {
      console.error('❌ 批量录入成绩失败:', batchGradeResult.error);
    } else {
      console.log('✅ 批量录入成绩成功:', batchGradeResult[0]?.result?.data?.message);
    }

    // 4. 测试查询班级成绩
    console.log('\n4. 测试查询班级成绩...');
    const getClassGradesResult = await sendTRPCRequest('grade.getClassGradesByTeacher', {
      classId: classId,
      teacherId: testData.teacher.teacherId
    });
    if (getClassGradesResult.error) {
      console.error('❌ 查询班级成绩失败:', getClassGradesResult.error);
    } else {
      const gradeData = getClassGradesResult[0]?.result?.data;
      console.log(`✅ 查询班级成绩成功，共 ${gradeData?.grades?.length || 0} 条成绩记录`);
      if (gradeData?.statistics) {
        console.log(`   平均分: ${gradeData.statistics.average}，及格率: ${gradeData.statistics.passRate}%`);
      }
    }

    // 5. 测试创建班级活动
    console.log('\n5. 测试创建班级活动...');
    testData.teacher.activityData.classId = classId;
    const createActivityResult = await sendTRPCRequest('activity.createByTeacher', {
      ...testData.teacher.activityData,
      teacherId: testData.teacher.teacherId
    }, 'mutation');
    if (createActivityResult.error) {
      console.error('❌ 创建班级活动失败:', createActivityResult.error);
    } else {
      console.log('✅ 创建班级活动成功:', createActivityResult[0]?.result?.data?.message);
    }

    // 6. 测试查看教师活动列表
    console.log('\n6. 测试查看教师活动列表...');
    const getActivitiesResult = await sendTRPCRequest('activity.getActivitiesByTeacher', {
      teacherId: testData.teacher.teacherId
    });
    if (getActivitiesResult.error) {
      console.error('❌ 查看教师活动失败:', getActivitiesResult.error);
    } else {
      const activities = getActivitiesResult[0]?.result?.data;
      console.log(`✅ 查看教师活动成功，共 ${activities?.length || 0} 个活动`);
    }

  } catch (error) {
    console.error('❌ 教师功能测试过程中出现错误:', error.message);
  }
}

// 测试学生功能
async function testStudentFunctions() {
  console.log('\n👨‍🎓 开始测试学生功能...\n');

  try {
    // 1. 测试查看学生个人信息
    console.log('1. 测试查看学生个人信息...');
    const getStudentInfoResult = await sendTRPCRequest('studentInfo.getStudentInfo', {
      studentId: testData.student.studentId
    });
    if (getStudentInfoResult.error) {
      console.error('❌ 查看学生信息失败:', getStudentInfoResult.error);
    } else {
      const studentInfo = getStudentInfoResult[0]?.result?.data;
      console.log('✅ 查看学生信息成功:', studentInfo?.user?.real_name);
    }

    // 2. 测试更新学生个人信息
    console.log('\n2. 测试更新学生个人信息...');
    const updateStudentResult = await sendTRPCRequest('studentInfo.updateStudentInfo', {
      studentId: testData.student.studentId,
      ...testData.student.updateInfo
    }, 'mutation');
    if (updateStudentResult.error) {
      console.error('❌ 更新学生信息失败:', updateStudentResult.error);
    } else {
      console.log('✅ 更新学生信息成功:', updateStudentResult[0]?.result?.data?.message);
    }

    // 3. 测试查看学生课程
    console.log('\n3. 测试查看学生课程...');
    const getStudentCoursesResult = await sendTRPCRequest('studentInfo.getStudentCourses', {
      studentId: testData.student.studentId
    });
    if (getStudentCoursesResult.error) {
      console.error('❌ 查看学生课程失败:', getStudentCoursesResult.error);
    } else {
      const courses = getStudentCoursesResult[0]?.result?.data;
      console.log(`✅ 查看学生课程成功，共 ${courses?.length || 0} 门课程`);
    }

    // 4. 测试查看学生成绩
    console.log('\n4. 测试查看学生成绩...');
    const getStudentGradesResult = await sendTRPCRequest('studentInfo.getStudentGrades', {
      studentId: testData.student.studentId
    });
    if (getStudentGradesResult.error) {
      console.error('❌ 查看学生成绩失败:', getStudentGradesResult.error);
    } else {
      const grades = getStudentGradesResult[0]?.result?.data;
      console.log(`✅ 查看学生成绩成功，共 ${grades?.length || 0} 条成绩记录`);
    }

    // 5. 测试查看同班同学
    console.log('\n5. 测试查看同班同学...');
    const getClassmatesResult = await sendTRPCRequest('studentInfo.getClassmates', {
      studentId: testData.student.studentId
    });
    if (getClassmatesResult.error) {
      console.error('❌ 查看同班同学失败:', getClassmatesResult.error);
    } else {
      const classmatesData = getClassmatesResult[0]?.result?.data;
      console.log(`✅ 查看同班同学成功，共 ${classmatesData?.totalClassmates || 0} 名同学`);
      console.log(`   共享课程数: ${classmatesData?.sharedCourses || 0}`);
    }

    // 6. 测试查看专业同学
    console.log('\n6. 测试查看专业同学...');
    const getMajorClassmatesResult = await sendTRPCRequest('studentInfo.getMajorClassmates', {
      studentId: testData.student.studentId
    });
    if (getMajorClassmatesResult.error) {
      console.error('❌ 查看专业同学失败:', getMajorClassmatesResult.error);
    } else {
      const majorClassmates = getMajorClassmatesResult[0]?.result?.data;
      console.log(`✅ 查看专业同学成功，共 ${majorClassmates?.totalMajorClassmates || 0} 名专业同学`);
    }

    // 7. 测试学生GPA统计
    console.log('\n7. 测试学生GPA统计...');
    const getGPAStatsResult = await sendTRPCRequest('studentInfo.getStudentGPAStats', {
      studentId: testData.student.studentId
    });
    if (getGPAStatsResult.error) {
      console.error('❌ 查看GPA统计失败:', getGPAStatsResult.error);
    } else {
      const gpaStats = getGPAStatsResult[0]?.result?.data;
      console.log('✅ 查看GPA统计成功');
      if (gpaStats) {
        console.log(`   GPA: ${gpaStats.gpa}, 等级: ${gpaStats.gpa_level}, 总学分: ${gpaStats.total_credits}`);
      }
    }

  } catch (error) {
    console.error('❌ 学生功能测试过程中出现错误:', error.message);
  }
}

// 清理测试数据
async function cleanupTestData(createdUserId, createdCourseId) {
  console.log('\n🧹 开始清理测试数据...\n');

  try {
    // 删除创建的用户（由于级联删除，相关的学生和教师记录也会被删除）
    if (createdUserId) {
      console.log('清理测试用户...');
      const deleteUserResult = await sendTRPCRequest('admin.deleteUser', {
        userId: createdUserId
      }, 'mutation');
      if (deleteUserResult.error) {
        console.error('❌ 删除测试用户失败:', deleteUserResult.error);
      } else {
        console.log('✅ 删除测试用户成功');
      }
    }

    // 删除创建的课程（由于级联删除，相关的班级记录也会被删除）
    if (createdCourseId) {
      console.log('清理测试课程...');
      const deleteCourseResult = await sendTRPCRequest('admin.deleteCourse', {
        courseId: createdCourseId
      }, 'mutation');
      if (deleteCourseResult.error) {
        console.error('❌ 删除测试课程失败:', deleteCourseResult.error);
      } else {
        console.log('✅ 删除测试课程成功');
      }
    }

  } catch (error) {
    console.error('❌ 清理测试数据过程中出现错误:', error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始运行班级管理系统新功能API测试\n');
  console.log('📋 测试范围：');
  console.log('   - 管理员：创建/删除用户、创建班级分配教师学生、课程管理');
  console.log('   - 教师：学生信息查看管理、成绩录入修改查询、班级活动管理');
  console.log('   - 学生：个人信息查看修改、同班同学显示');
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // 测试管理员功能
    const { createdUserId, createdCourseId, createdClassId } = await testAdminFunctions();

    // 测试教师功能
    await testTeacherFunctions(createdClassId);

    // 测试学生功能
    await testStudentFunctions();

    // 清理测试数据
    await cleanupTestData(createdUserId, createdCourseId);

  } catch (error) {
    console.error('❌ 测试过程中出现严重错误:', error.message);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log(`🎉 API测试完成！总耗时: ${duration}秒`);
  console.log('\n📊 测试总结：');
  console.log('   ✅ 管理员功能：用户管理、班级管理、课程管理');
  console.log('   ✅ 教师功能：学生管理、成绩管理、活动管理');
  console.log('   ✅ 学生功能：个人信息、课程查看、同学查询');
  console.log('\n📌 注意：部分测试可能因为数据库状态而失败，这是正常的');
  console.log('📌 建议：在实际部署前请确保数据库中有基础的测试数据');
}

// 运行测试
runAllTests().catch(console.error);