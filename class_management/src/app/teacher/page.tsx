"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";
import SqlDisplay from "~/components/SqlDisplay";

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("classes");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "teacher") {
      router.push("/");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  // 使用固定的教师ID for testing - 在实际使用中应该从用户信息中获取
  const teacherId = "T001"; // Zhang Wei teacher
  
  const { data: teacherCourses } = api.teacher.getTeacherCourses.useQuery(
    { teacherId },
    { enabled: !!user }
  );

  const { data: majorGpaRanking } = api.teacher.getMajorGpaRanking.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: courseGradeAnalysis } = api.teacher.getCourseGradeAnalysis.useQuery(
    { teacherId },
    { enabled: !!user }
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">教师工作台</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">欢迎，{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("classes")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "classes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              班级管理
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "grades"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              成绩管理
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activities"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              班级活动
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              数据分析
            </button>
          </nav>
        </div>

        {activeTab === "classes" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">我的班级</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(teacherCourses as any)?.map((course: any) => (
                <div key={course.class_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{course.class_name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {course.course_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">课程代码: {course.course_code}</p>
                  <p className="text-sm text-gray-600 mb-2">学期: {course.semester}</p>
                  <p className="text-sm text-gray-600 mb-2">上课时间: {course.class_time}</p>
                  <p className="text-sm text-gray-600 mb-2">教室: {course.classroom}</p>
                  <p className="text-sm text-gray-600">
                    学生数: {course.current_students}/{course.max_students}
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <Link
                      href="/teacher/grades"
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      管理成绩
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {(!teacherCourses || (teacherCourses as any).length === 0) && (
              <p className="text-gray-500 text-center py-8">暂无分配的课程</p>
            )}
          </div>
        )}

        {activeTab === "grades" && (
          <div className="space-y-6">
            {/* Grade Management Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">成绩管理中心</h2>
                <div className="flex space-x-3">
                  <Link
                    href="/teacher/grades"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    完整成绩管理
                  </Link>
                  <Link
                    href="/teacher/test-grades"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    GPA演示
                  </Link>
                </div>
              </div>
              <p className="text-gray-600">
                管理学生成绩、查看GPA变化、录入考试成绩等功能。系统支持自动GPA计算和实时数据更新。
              </p>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Grade Entry Card */}
              <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">成绩录入</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  录入和修改学生的平时、期中、期末成绩
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    批量成绩录入
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    成绩修改功能
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    自动计算总分
                  </li>
                </ul>
                <Link
                  href="/teacher/grades"
                  className="block w-full text-center bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  开始录入
                </Link>
              </div>

              {/* GPA Management Card */}
              <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">GPA管理</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  查看和管理学生GPA，自动更新学术表现
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    实时GPA显示
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    自动触发更新
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    学分加权计算
                  </li>
                </ul>
                <Link
                  href="/teacher/grades"
                  className="block w-full text-center bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  查看GPA
                </Link>
              </div>

              {/* Student Overview Card */}
              <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">学生概览</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  查看学生详细信息和完整成绩记录
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    学生成绩历史
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    快速搜索学生
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    详细信息查看
                  </li>
                </ul>
                <Link
                  href="/teacher/grades"
                  className="block w-full text-center bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  查看学生
                </Link>
              </div>
            </div>

            {/* Statistics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Classes */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">我的班级</h3>
                <div className="space-y-3">
                  {(teacherCourses as any)?.map((course: any) => (
                    <div key={course.class_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{course.class_name}</h4>
                        <p className="text-sm text-gray-600">
                          {course.current_students} 名学生 • {course.course_name}
                        </p>
                      </div>
                      <Link
                        href="/teacher/grades"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        管理成绩
                      </Link>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">暂无分配的课程</p>
                  )}
                </div>
              </div>

              {/* System Features */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">系统特性</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <span className="text-lg">⚡</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">自动GPA计算</h4>
                      <p className="text-sm text-gray-600">成绩录入后立即触发GPA重新计算</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <span className="text-lg">🔄</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">实时数据同步</h4>
                      <p className="text-sm text-gray-600">所有数据变更实时反映在界面上</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <span className="text-lg">📈</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">学分加权计算</h4>
                      <p className="text-sm text-gray-600">基于课程学分的标准GPA算法</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                      <span className="text-lg">🔍</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">智能搜索</h4>
                      <p className="text-sm text-gray-600">快速查找和筛选学生信息</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">💡 使用提示</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">成绩录入：</h4>
                  <ul className="space-y-1">
                    <li>• 选择课程和班级后开始录入</li>
                    <li>• 支持平时、期中、期末三种成绩</li>
                    <li>• 修改已有成绩会显示修改按钮</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">GPA查看：</h4>
                  <ul className="space-y-1">
                    <li>• 绿色表示优秀（≥3.5）</li>
                    <li>• 蓝色表示良好（≥3.0）</li>
                    <li>• 点击学生姓名查看详情</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">班级活动管理</h2>
              <Link
                href="/teacher/activities"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                管理活动
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Activity Management Card */}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">创建活动</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    创建班级学习、文体、志愿等各类活动
                  </p>
                  <Link
                    href="/teacher/activities"
                    className="inline-block bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
                  >
                    创建新活动
                  </Link>
                </div>
              </div>

              {/* Activity Stats Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="text-center">
                  <div className="bg-green-200 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">活动统计</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    查看活动参与情况和统计数据
                  </p>
                  <Link
                    href="/teacher/activities"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    查看统计
                  </Link>
                </div>
              </div>

              {/* Recent Activities Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="text-center">
                  <div className="bg-purple-200 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">近期活动</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    查看最近的活动安排和状态
                  </p>
                  <Link
                    href="/teacher/activities"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    查看活动
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">✨ 活动管理功能</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">活动创建与管理</h4>
                    <p className="text-sm text-gray-600">支持学习、文体、志愿等多种活动类型</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <span className="text-lg">👥</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">参与者管理</h4>
                    <p className="text-sm text-gray-600">跟踪学生参与情况和出勤状态</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">预算管理</h4>
                    <p className="text-sm text-gray-600">活动预算制定和支出跟踪</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">状态跟踪</h4>
                    <p className="text-sm text-gray-600">活动从计划到完成的全流程管理</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">数据分析中心</h2>
              <p className="text-gray-600">
                查看各种复杂查询结果，包括专业GPA排名、课程成绩分析等。所有查询均显示对应的SQL代码。
              </p>
            </div>

            {/* Major GPA Ranking */}
            {majorGpaRanking && (
              <SqlDisplay
                title="各专业学生平均GPA排名"
                sql={majorGpaRanking.sql}
                data={majorGpaRanking.data as any[]}
                columns={[
                  { key: 'ranking', label: '排名', type: 'ranking' },
                  { key: 'major_name', label: '专业名称', type: 'text' },
                  { key: 'student_count', label: '学生数量', type: 'number' },
                  { key: 'avg_gpa', label: '平均GPA', type: 'number' },
                  { key: 'avg_credits', label: '平均学分', type: 'number' },
                ]}
              />
            )}

            {/* Course Grade Analysis */}
            {courseGradeAnalysis && (
              <SqlDisplay
                title="我的课程成绩分析"
                sql={courseGradeAnalysis.sql}
                data={courseGradeAnalysis.data as any[]}
                columns={[
                  { key: 'course_name', label: '课程名称', type: 'text' },
                  { key: 'student_count', label: '学生数', type: 'number' },
                  { key: 'avg_score', label: '平均分', type: 'number' },
                  { key: 'min_score', label: '最低分', type: 'number' },
                  { key: 'max_score', label: '最高分', type: 'number' },
                  { key: 'excellent_count', label: '优秀人数', type: 'number' },
                  { key: 'fail_count', label: '不及格人数', type: 'number' },
                  { key: 'excellent_rate', label: '优秀率(%)', type: 'number' },
                ]}
              />
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">💡 数据分析说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">专业GPA排名：</h4>
                  <ul className="space-y-1">
                    <li>• 显示所有专业学生的平均GPA排名</li>
                    <li>• 包含学生数量和平均学分信息</li>
                    <li>• 金牌🥇银牌🥈铜牌🥉标识前三名</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">课程成绩分析：</h4>
                  <ul className="space-y-1">
                    <li>• 仅显示您教授的课程数据</li>
                    <li>• 包含分数分布和优秀率统计</li>
                    <li>• 点击"显示SQL"查看查询代码</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}