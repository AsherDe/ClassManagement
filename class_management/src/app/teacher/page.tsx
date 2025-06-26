"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";
import SqlDisplay from "~/components/SqlDisplay";

export default function TeacherDashboard() {
  const router = useRouter();
  const utils = api.useUtils();
  const [user, setUser] = useState<{username: string; role: string} | null>(null);
  const [activeTab, setActiveTab] = useState("classes");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showStudentDetail, setShowStudentDetail] = useState<{
    isOpen: boolean;
    student: any;
  }>({ isOpen: false, student: null });
  const [editingStudent, setEditingStudent] = useState<{
    isOpen: boolean;
    student: any;
  }>({ isOpen: false, student: null });
  const [editForm, setEditForm] = useState({
    realName: "",
    email: "",
    phone: "",
  });
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activityName: "",
    activityType: "lecture",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    budgetAmount: "",
    requiredAttendance: false,
    classId: ""
  });
  const [showActivityDetail, setShowActivityDetail] = useState({ show: false, activity: null });

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

  const { data: classStudents, refetch: refetchStudents } = api.teacher.getClassStudents.useQuery(
    { classId: selectedClass?.class_id },
    { enabled: !!selectedClass }
  );

  const { data: teacherActivities } = api.activity.getActivitiesByTeacher.useQuery(
    { teacherId },
    { enabled: !!user }
  );

  const { data: activityParticipants } = api.activity.getParticipants.useQuery(
    { activityId: showActivityDetail.activity?.activity_id },
    { enabled: showActivityDetail.show && !!showActivityDetail.activity }
  );

  const { data: activityStats } = api.activity.getTeacherActivityStats.useQuery(
    { teacherId },
    { enabled: !!user }
  );

  const updateStudentMutation = api.teacher.updateStudentInfo.useMutation({
    onSuccess: () => {
      alert("学生信息更新成功");
      setEditingStudent({ isOpen: false, student: null });
      refetchStudents();
    },
    onError: (error) => {
      alert(`更新失败: ${error.message}`);
    },
  });

  const createActivityMutation = api.activity.createByTeacher.useMutation({
    onSuccess: () => {
      alert("活动创建成功");
      setShowCreateActivity(false);
      setActivityForm({
        activityName: "",
        activityType: "lecture",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        budgetAmount: "",
        requiredAttendance: false,
        classId: ""
      });
      void utils.activity.getActivitiesByTeacher.invalidate();
      void utils.activity.getTeacherActivityStats.invalidate();
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const openStudentDetail = (student: any) => {
    setShowStudentDetail({ isOpen: true, student });
  };

  const openEditStudent = (student: any) => {
    setEditingStudent({ isOpen: true, student });
    setEditForm({
      realName: student.user?.real_name || "",
      email: student.user?.email || "",
      phone: student.user?.phone || "",
    });
  };

  const handleUpdateStudent = () => {
    if (!editingStudent.student || !editForm.realName.trim()) {
      alert("请填写学生姓名");
      return;
    }

    updateStudentMutation.mutate({
      teacherId,
      studentId: editingStudent.student.student_id,
      email: editForm.email || undefined,
      phone: editForm.phone || undefined,
    });
  };

  const handleCreateActivity = () => {
    if (!activityForm.activityName.trim()) {
      alert("请填写活动名称");
      return;
    }
    if (!activityForm.startTime) {
      alert("请选择开始时间");
      return;
    }
    if (!activityForm.classId) {
      alert("请选择班级");
      return;
    }

    createActivityMutation.mutate({
      classId: parseInt(activityForm.classId),
      teacherId: teacherId,
      activityName: activityForm.activityName,
      activityType: activityForm.activityType as "lecture" | "seminar" | "workshop" | "field_trip" | "competition" | "social" | "sports" | "cultural" | "volunteer" | "other",
      description: activityForm.description || undefined,
      location: activityForm.location || undefined,
      startTime: new Date(activityForm.startTime),
      endTime: activityForm.endTime ? new Date(activityForm.endTime) : undefined,
      organizerId: undefined, // Teacher-created activities don't have student organizer
      budgetAmount: activityForm.budgetAmount ? parseFloat(activityForm.budgetAmount) : 0,
      requiredAttendance: activityForm.requiredAttendance
    });
  };

  const openActivityDetail = (activity: any) => {
    setShowActivityDetail({ show: true, activity });
  };

  const selectClass = (classItem: any) => {
    setSelectedClass(classItem);
  };

  const backToClassList = () => {
    setSelectedClass(null);
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
            {!selectedClass ? (
              <>
                <h2 className="text-lg font-medium text-gray-900 mb-4">我的班级</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(teacherCourses as any)?.map((course: any) => (
                    <div key={course.class_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{course.class_name}</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {course.course_name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">课程代码: {course.course_code}</p>
                      <p className="text-sm text-gray-600 mb-2">学期: {course.semester}</p>
                      {course.class_time && (
                        <p className="text-sm text-gray-600 mb-2">上课时间: {course.class_time}</p>
                      )}
                      {course.classroom && (
                        <p className="text-sm text-gray-600 mb-2">教室: {course.classroom}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        学生数: {course.current_students || 0}/{course.max_students || 0}
                      </p>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => selectClass(course)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          管理学生
                        </button>
                        <Link
                          href="/teacher/grades"
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <button
                      onClick={backToClassList}
                      className="mr-3 text-blue-600 hover:text-blue-800"
                    >
                      ← 返回班级列表
                    </button>
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedClass.class_name} - 学生管理
                    </h2>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                    {selectedClass.course_name}
                  </span>
                </div>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">课程代码:</span>
                      <p className="font-medium">{selectedClass.course_code}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">学期:</span>
                      <p className="font-medium">{selectedClass.semester}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">学生数:</span>
                      <p className="font-medium">{selectedClass.current_students || 0}/{selectedClass.max_students || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">教室:</span>
                      <p className="font-medium">{selectedClass.classroom || "未指定"}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">专业</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {classStudents?.map((student: any) => (
                        <tr key={student.student_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.user?.real_name || student.real_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.major?.major_name || "未指定"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {student.user?.email && (
                                <div>📧 {student.user.email}</div>
                              )}
                              {student.user?.phone && (
                                <div>📞 {student.user.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              正常
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openStudentDetail(student)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={() => openEditStudent(student)}
                              className="text-green-600 hover:text-green-900"
                            >
                              编辑信息
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!classStudents || classStudents.length === 0) && (
                    <div className="text-center text-gray-500 py-8">
                      暂无学生数据
                    </div>
                  )}
                </div>
              </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  href="/teacher/gpa-ranking"
                  className="block w-full text-center bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  查看GPA排名
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

              {/* GPA Ranking Card */}
              <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">GPA排名</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  查看班级和全校学生GPA排名
                </p>
                <ul className="text-sm text-gray-700 space-y-1 mb-4">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    班级GPA排名
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    全校排名对比
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    专业排名统计
                  </li>
                </ul>
                <Link
                  href="/teacher/gpa-ranking"
                  className="block w-full text-center bg-yellow-50 text-yellow-700 py-2 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  查看排名
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
                          {course.current_students || 0} 名学生 • {course.course_name}
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
          <div className="space-y-6">
            {/* Activity Stats Overview */}
            {activityStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-blue-600">
                        {(activityStats as any).total_activities || 0}
                      </p>
                      <p className="text-sm text-gray-600">总活动数</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-green-600">
                        {(activityStats as any).completed_count || 0}
                      </p>
                      <p className="text-sm text-gray-600">已完成</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-2xl font-bold text-yellow-600">
                        {(activityStats as any).ongoing_count || 0}
                      </p>
                      <p className="text-sm text-gray-600">进行中</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-lg font-bold text-purple-600">
                        ¥{Number((activityStats as any).total_budget || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">总预算</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Management */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">我的活动</h2>
                <button
                  onClick={() => setShowCreateActivity(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  创建新活动
                </button>
              </div>

              {teacherActivities && (teacherActivities as any).length > 0 ? (
                <div className="space-y-4">
                  {(teacherActivities as any).map((activity: any) => (
                    <div key={activity.activity_id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{activity.activity_name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              activity.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                              activity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                              activity.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {activity.status === 'planned' ? '计划中' :
                               activity.status === 'ongoing' ? '进行中' :
                               activity.status === 'completed' ? '已完成' : '已取消'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              activity.activity_type === 'lecture' ? 'bg-purple-100 text-purple-800' :
                              activity.activity_type === 'workshop' ? 'bg-blue-100 text-blue-800' :
                              activity.activity_type === 'field_trip' ? 'bg-green-100 text-green-800' :
                              activity.activity_type === 'sports' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.activity_type}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">课程：</span>
                              {activity.class?.course?.course_name || 'Unknown Course'}
                            </div>
                            <div>
                              <span className="font-medium">班级：</span>
                              {activity.class?.class_name || 'Unknown Class'}
                            </div>
                            <div>
                              <span className="font-medium">开始时间：</span>
                              {new Date(activity.start_time).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">参与人数：</span>
                              {activity.participant_count} / {activity.class?.current_students || 0}
                            </div>
                          </div>

                          {activity.location && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">地点：</span>
                              {activity.location}
                            </div>
                          )}

                          {activity.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">描述：</span>
                              {activity.description}
                            </div>
                          )}

                          {activity.budget_amount > 0 && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">预算：</span>
                              ¥{Number(activity.budget_amount).toLocaleString()}
                              {activity.actual_cost > 0 && (
                                <span className="ml-2">
                                  (实际支出: ¥{Number(activity.actual_cost).toLocaleString()})
                                </span>
                              )}
                            </div>
                          )}

                          {activity.organizer && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">组织者：</span>
                              {activity.organizer?.user?.real_name || 'Unknown Organizer'}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => openActivityDetail(activity)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                          >
                            查看详情
                          </button>
                          {activity.participant_count > 0 && (
                            <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded text-center">
                              {activity.participant_count} 人参与
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-lg inline-block mb-4">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有创建活动</h3>
                  <p className="text-gray-600 mb-4">
                    开始创建班级活动，增强学生参与度和班级凝聚力
                  </p>
                  <button
                    onClick={() => setShowCreateActivity(true)}
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    创建第一个活动
                  </button>
                </div>
              )}
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Activity Creation Guide */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">活动创建指南</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    了解如何创建和管理各类班级活动
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-1 mb-4">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      学习类活动（讲座、研讨会）
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      文体活动（运动会、文艺表演）
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      志愿服务活动
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      社会实践活动
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowCreateActivity(true)}
                    className="block w-full text-center bg-blue-50 text-blue-600 py-2 rounded hover:bg-blue-100"
                  >
                    开始创建
                  </button>
                </div>
              </div>

              {/* Participation Management */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <div className="bg-green-100 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">参与管理</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    跟踪学生报名和参与情况
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-1 mb-4">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      学生报名状态
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      出勤签到管理
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      活动反馈收集
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      参与度统计
                    </li>
                  </ul>
                  <button
                    onClick={() => setActiveTab("activities")}
                    className="block w-full text-center bg-green-50 text-green-600 py-2 rounded hover:bg-green-100"
                  >
                    查看参与情况
                  </button>
                </div>
              </div>

              {/* Activity Analytics */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <div className="bg-purple-100 p-3 rounded-lg inline-block mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">活动分析</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    查看活动效果和数据统计
                  </p>
                  <ul className="text-left text-sm text-gray-700 space-y-1 mb-4">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      活动完成率统计
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      学生参与度分析
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      预算使用情况
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      活动效果评估
                    </li>
                  </ul>
                  <button
                    onClick={() => setActiveTab("activities")}
                    className="block w-full text-center bg-purple-50 text-purple-600 py-2 rounded hover:bg-purple-100"
                  >
                    查看统计
                  </button>
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

      {/* 学生详情模态框 */}
      {showStudentDetail.isOpen && showStudentDetail.student && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                学生详情 - {showStudentDetail.student.user?.real_name || showStudentDetail.student.real_name}
              </h3>
              <div className="px-7 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">学号</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.student_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">姓名</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {showStudentDetail.student.user?.real_name || showStudentDetail.student.real_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">用户名</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.user?.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">专业</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.major?.major_name || "未指定"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">年级</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.grade || "未指定"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">班号</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.class_number || "未指定"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">邮箱</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.user?.email || "未设置"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">手机号</label>
                    <p className="mt-1 text-sm text-gray-900">{showStudentDetail.student.user?.phone || "未设置"}</p>
                  </div>
                </div>

                {/* 选课记录 */}
                {showStudentDetail.student.enrollments && showStudentDetail.student.enrollments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">选课记录</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {showStudentDetail.student.enrollments.map((enrollment: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                            <span>{enrollment.class?.class_name || "未知班级"}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              enrollment.status === "enrolled" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {enrollment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 成绩记录 */}
                {showStudentDetail.student.grades && showStudentDetail.student.grades.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">成绩记录</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {showStudentDetail.student.grades.map((grade: any, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{grade.class?.course?.course_name || "未知课程"}</span>
                              <span className="font-medium">总分: {grade.final_score || "未录入"}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              平时: {grade.regular_score || "N/A"} | 
                              期中: {grade.midterm_score || "N/A"} | 
                              期末: {grade.final_score || "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowStudentDetail({ isOpen: false, student: null })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑学生信息模态框 */}
      {editingStudent.isOpen && editingStudent.student && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                编辑学生信息 - {editingStudent.student.student_id}
              </h3>
              <div className="px-7 py-3">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名 *</label>
                    <input
                      type="text"
                      value={editForm.realName}
                      onChange={(e) => setEditForm({ ...editForm, realName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入真实姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入手机号"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setEditingStudent({ isOpen: false, student: null })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateStudent}
                  disabled={updateStudentMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateStudentMutation.isPending ? "更新中..." : "确认更新"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 创建活动模态框 */}
      {showCreateActivity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                创建新活动
              </h3>
              <div className="px-7 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">活动名称 *</label>
                    <input
                      type="text"
                      value={activityForm.activityName}
                      onChange={(e) => setActivityForm({ ...activityForm, activityName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入活动名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">活动类型</label>
                    <select
                      value={activityForm.activityType}
                      onChange={(e) => setActivityForm({ ...activityForm, activityType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="lecture">讲座</option>
                      <option value="seminar">研讨会</option>
                      <option value="workshop">工作坊</option>
                      <option value="field_trip">实地考察</option>
                      <option value="competition">竞赛</option>
                      <option value="social">社交活动</option>
                      <option value="sports">体育活动</option>
                      <option value="cultural">文化活动</option>
                      <option value="volunteer">志愿服务</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择班级 *</label>
                    <select
                      value={activityForm.classId}
                      onChange={(e) => setActivityForm({ ...activityForm, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择班级</option>
                      {(teacherCourses as any)?.map((course: any) => (
                        <option key={course.class_id} value={course.class_id}>
                          {course.class_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">活动地点</label>
                    <input
                      type="text"
                      value={activityForm.location}
                      onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入活动地点"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间 *</label>
                    <input
                      type="datetime-local"
                      value={activityForm.startTime}
                      onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input
                      type="datetime-local"
                      value={activityForm.endTime}
                      onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预算金额</label>
                    <input
                      type="number"
                      step="0.01"
                      value={activityForm.budgetAmount}
                      onChange={(e) => setActivityForm({ ...activityForm, budgetAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiredAttendance"
                      checked={activityForm.requiredAttendance}
                      onChange={(e) => setActivityForm({ ...activityForm, requiredAttendance: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requiredAttendance" className="ml-2 block text-sm text-gray-900">
                      必须参加
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                  <textarea
                    value={activityForm.description}
                    onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入活动详细描述..."
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateActivity(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateActivity}
                  disabled={createActivityMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createActivityMutation.isPending ? "创建中..." : "创建活动"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 活动详情模态框 */}
      {showActivityDetail.show && showActivityDetail.activity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                活动详情 - {(showActivityDetail.activity as any).activity_name}
              </h3>
              <div className="px-7 py-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 活动基本信息 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">活动信息</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">活动名称：</span>
                        <span className="font-medium">{(showActivityDetail.activity as any).activity_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">活动类型：</span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {(showActivityDetail.activity as any).activity_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">状态：</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          (showActivityDetail.activity as any).status === 'planned' ? 'bg-blue-100 text-blue-800' :
                          (showActivityDetail.activity as any).status === 'ongoing' ? 'bg-green-100 text-green-800' :
                          (showActivityDetail.activity as any).status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(showActivityDetail.activity as any).status === 'planned' ? '计划中' :
                           (showActivityDetail.activity as any).status === 'ongoing' ? '进行中' :
                           (showActivityDetail.activity as any).status === 'completed' ? '已完成' : '已取消'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">班级：</span>
                        <span className="font-medium">{(showActivityDetail.activity as any).class?.class_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">开始时间：</span>
                        <span className="font-medium">
                          {new Date((showActivityDetail.activity as any).start_time).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {(showActivityDetail.activity as any).end_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">结束时间：</span>
                          <span className="font-medium">
                            {new Date((showActivityDetail.activity as any).end_time).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      )}
                      {(showActivityDetail.activity as any).location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">地点：</span>
                          <span className="font-medium">{(showActivityDetail.activity as any).location}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">参与人数：</span>
                        <span className="font-medium text-blue-600">
                          {(showActivityDetail.activity as any).participant_count} / {(showActivityDetail.activity as any).class?.current_students || 0}
                        </span>
                      </div>
                      {(showActivityDetail.activity as any).budget_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">预算：</span>
                          <span className="font-medium text-green-600">
                            ¥{Number((showActivityDetail.activity as any).budget_amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {(showActivityDetail.activity as any).required_attendance && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">出勤要求：</span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">必须参加</span>
                        </div>
                      )}
                    </div>
                    {(showActivityDetail.activity as any).description && (
                      <div className="mt-4">
                        <span className="text-gray-600 text-sm">活动描述：</span>
                        <div className="mt-2 p-3 bg-white rounded border text-sm text-gray-700">
                          {(showActivityDetail.activity as any).description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 参与学生列表 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      参与学生 ({(showActivityDetail.activity as any).participant_count || 0} 人)
                    </h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {(showActivityDetail.activity as any).participants && (showActivityDetail.activity as any).participants.length > 0 ? (
                        (showActivityDetail.activity as any).participants.map((participant: any) => (
                          <div key={participant.participant_id} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {participant.student?.user?.real_name || participant.student?.real_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  学号: {participant.student?.student_id}
                                </div>
                                <div className="text-xs text-gray-500">
                                  报名时间: {new Date(participant.registration_time).toLocaleString('zh-CN')}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  participant.attendance_status === 'attended' ? 'bg-green-100 text-green-800' :
                                  participant.attendance_status === 'registered' ? 'bg-blue-100 text-blue-800' :
                                  participant.attendance_status === 'absent' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {participant.attendance_status === 'attended' ? '已参加' :
                                   participant.attendance_status === 'registered' ? '已报名' :
                                   participant.attendance_status === 'absent' ? '缺席' : '已取消'}
                                </span>
                              </div>
                            </div>
                            {participant.feedback && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <span className="font-medium text-blue-800">反馈：</span>
                                <div className="text-blue-700 mt-1">{participant.feedback}</div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <div className="text-4xl mb-2">👥</div>
                          <p>暂无学生报名参与</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowActivityDetail({ show: false, activity: null })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}