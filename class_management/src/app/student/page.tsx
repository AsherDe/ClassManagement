"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{username: string; role: string} | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedInfo, setEditedInfo] = useState({ email: "", phone: "" });
  const [activityFilter, setActivityFilter] = useState("all");
  const [feedbackModal, setFeedbackModal] = useState({ show: false, activityId: null, participantId: null });
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "student") {
      router.push("/");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  // 使用固定的学生ID for testing - 在实际使用中应该从用户信息中获取
  const studentId = "20231001111"; // 测试学生
  
  const { data: studentInfo } = api.studentInfo.getStudentInfo.useQuery(
    { studentId },
    { enabled: !!user }
  );
  
  const { data: grades } = api.studentInfo.getStudentGrades.useQuery(
    { studentId },
    { enabled: !!user }
  );
  
  const { data: gpaStats } = api.studentInfo.getStudentGPAStats.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const { data: classmates } = api.studentInfo.getClassmates.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const { data: courses } = api.studentInfo.getStudentCourses.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const { data: majorClassmates } = api.studentInfo.getMajorClassmates.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const updateProfileMutation = api.studentInfo.updateStudentInfo.useMutation({
    onSuccess: () => {
      setIsEditingProfile(false);
      // Refresh student info
    }
  });

  const { data: activities } = api.activity.getActivitiesForStudent.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const { data: activityHistory } = api.activity.getStudentActivityHistory.useQuery(
    { studentId },
    { enabled: !!user }
  );

  const registerActivityMutation = api.activity.registerForActivity.useMutation({
    onSuccess: () => {
      // Refresh activities data
      void api.activity.getActivitiesForStudent.invalidate();
      void api.activity.getStudentActivityHistory.invalidate();
    }
  });
  const unregisterActivityMutation = api.activity.unregisterFromActivity.useMutation({
    onSuccess: () => {
      void api.activity.getActivitiesForStudent.invalidate();
      void api.activity.getStudentActivityHistory.invalidate();
    }
  });
  const checkInActivityMutation = api.activity.checkInActivity.useMutation({
    onSuccess: () => {
      void api.activity.getActivitiesForStudent.invalidate();
      void api.activity.getStudentActivityHistory.invalidate();
    }
  });
  const submitFeedbackMutation = api.activity.submitActivityFeedback.useMutation({
    onSuccess: () => {
      setFeedbackModal({ show: false, activityId: null, participantId: null });
      setFeedbackText("");
      void api.activity.getStudentActivityHistory.invalidate();
    }
  });

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
            <h1 className="text-xl font-semibold text-gray-900">学生门户</h1>
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
              onClick={() => setActiveTab("info")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "info"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              个人信息
            </button>
            <button
              onClick={() => setActiveTab("grades")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "grades"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              我的成绩
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "courses"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              我的课程
            </button>
            <button
              onClick={() => setActiveTab("classmates")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "classmates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              同学交流
            </button>
            <button
              onClick={() => setActiveTab("activities")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "activities"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              活动参与
            </button>
          </nav>
        </div>

        {activeTab === "info" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
              <div className="flex items-center space-x-4">
                {gpaStats && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">学术水平</p>
                    <p className={`text-lg font-bold ${
                      Number(gpaStats.gpa) >= 3.5 ? 'text-green-600' :
                      Number(gpaStats.gpa) >= 3.0 ? 'text-blue-600' :
                      Number(gpaStats.gpa) >= 2.0 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {gpaStats.gpa_level}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsEditingProfile(!isEditingProfile);
                    if (!isEditingProfile && studentInfo) {
                      setEditedInfo({
                        email: studentInfo.user?.email || "",
                        phone: studentInfo.user?.phone || ""
                      });
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isEditingProfile ? "取消编辑" : "编辑信息"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <p className="mt-1 text-sm text-gray-900">{studentInfo?.user?.real_name || user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">学号</label>
                <p className="mt-1 text-sm text-gray-900">{studentInfo?.student_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">专业</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.major?.major_name || "未分配专业"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">年级</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.grade || "未分配"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">班级</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.class_number || "未分配班级"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">邮箱</label>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={editedInfo.email}
                    onChange={(e) => setEditedInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {studentInfo?.user?.email || "未设置"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">电话</label>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={editedInfo.phone}
                    onChange={(e) => setEditedInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {studentInfo?.user?.phone || "未设置"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">当前GPA</label>
                <p className="mt-1 text-sm font-semibold text-blue-600">
                  {studentInfo?.gpa ? Number(studentInfo.gpa).toFixed(2) : "0.00"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">总学分</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.total_credits ? Number(studentInfo.total_credits).toFixed(1) : "0.0"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">状态</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.status || "正常"}
                </p>
              </div>
            </div>
            {isEditingProfile && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    updateProfileMutation.mutate({
                      studentId,
                      email: editedInfo.email,
                      phone: editedInfo.phone
                    });
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "保存中..." : "保存"}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "courses" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">我的课程</h2>
            {courses && (courses as any).length > 0 ? (
              <div className="space-y-4">
                {(courses as any).map((course: any) => (
                  <div key={`${course.course_code}-${course.semester}`} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {course.course_name}
                          <span className="ml-2 text-sm text-gray-500">({course.course_code})</span>
                        </h3>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">学分：</span>
                            {course.credits}
                          </div>
                          <div>
                            <span className="font-medium">学期：</span>
                            {course.semester}
                          </div>
                          <div>
                            <span className="font-medium">教师：</span>
                            {course.teacher_name || "未分配"}
                          </div>
                          <div>
                            <span className="font-medium">类型：</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              course.course_type === 'required' ? 'bg-red-100 text-red-800' :
                              course.course_type === 'elective' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {course.course_type === 'required' ? '必修' : 
                               course.course_type === 'elective' ? '选修' : '其他'}
                            </span>
                          </div>
                        </div>
                        {course.class_time && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">上课时间：</span>
                            {course.class_time}
                          </div>
                        )}
                        {course.classroom && (
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">教室：</span>
                            {course.classroom}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无课程信息</p>
            )}
          </div>
        )}

        {activeTab === "grades" && (
          <div className="space-y-6">
            {/* GPA 统计卡片 */}
            {gpaStats && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">学术表现总览</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Number(gpaStats.gpa).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">当前GPA</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      gpaStats.gpa_level === '优秀' ? 'text-green-600' :
                      gpaStats.gpa_level === '良好' ? 'text-blue-600' :
                      gpaStats.gpa_level === '中等' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {gpaStats.gpa_level}
                    </p>
                    <p className="text-sm text-gray-600">学术等级</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {Number(gpaStats.total_credits || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">总学分</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">
                      {grades ? (grades as any).length : 0}
                    </p>
                    <p className="text-sm text-gray-600">已修课程</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 成绩详情 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">成绩详情</h2>
              {grades && (grades as any).length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        课程名称
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平时成绩
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        期中成绩
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        期末成绩
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        总分
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        等级
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        绩点
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(grades as any).map((grade: any) => (
                      <tr key={grade.grade_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {grade.course_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.regular_score ?? '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.midterm_score ?? '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.final_score ?? '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.total_score ? Number(grade.total_score).toFixed(1) : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            grade.letter_grade === 'A' ? 'bg-green-100 text-green-800' :
                            grade.letter_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            grade.letter_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            grade.letter_grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            grade.letter_grade === 'F' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {grade.letter_grade || '--'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                          {grade.gpa_points ? Number(grade.gpa_points).toFixed(1) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无成绩记录</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "classmates" && (
          <div className="space-y-6">
            {/* 课程同学 */}
            {classmates && (classmates as any).classmates && (classmates as any).classmates.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  课程同学 
                  <span className="ml-2 text-sm text-gray-500">
                    (共 {(classmates as any).totalClassmates} 人，{(classmates as any).sharedCourses} 门共同课程)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(classmates as any).classmates.map((classmate: any) => (
                    <div key={classmate.student_id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h3 className="font-medium text-gray-900">{classmate.real_name}</h3>
                      <p className="text-sm text-gray-600">学号: {classmate.student_id}</p>
                      <p className="text-sm text-gray-600">专业: {classmate.major_name}</p>
                      <p className="text-sm text-gray-600">年级: {classmate.grade}</p>
                      <p className="text-sm text-gray-600">班级: {classmate.class_number}</p>
                      {classmate.gpa && (
                        <p className="text-sm text-blue-600 font-medium">GPA: {Number(classmate.gpa).toFixed(2)}</p>
                      )}
                      {classmate.shared_classes && classmate.shared_classes.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">共同课程:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {classmate.shared_classes.slice(0, 3).map((course: any) => (
                              <span key={`${classmate.student_id}-${course.course_code}`} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {course.course_code}
                              </span>
                            ))}
                            {classmate.shared_classes.length > 3 && (
                              <span className="text-xs text-gray-500">+{classmate.shared_classes.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex space-x-2">
                        {classmate.email && (
                          <a href={`mailto:${classmate.email}`} className="text-blue-600 hover:text-blue-800 text-xs">
                            邮箱
                          </a>
                        )}
                        {classmate.phone && (
                          <span className="text-green-600 text-xs">电话</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 专业同学 */}
            {majorClassmates && (majorClassmates as any).majorClassmates && (majorClassmates as any).majorClassmates.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  专业同学 
                  <span className="ml-2 text-sm text-gray-500">
                    (共 {(majorClassmates as any).totalMajorClassmates} 人)
                  </span>
                </h2>
                
                {/* 按班级分组显示 */}
                {Object.entries((majorClassmates as any).classmatesByClassNumber || {}).map(([classNumber, students]) => (
                  <div key={`class-${classNumber}`} className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-3">
                      {classNumber} 班 ({(students as any).length} 人)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {(students as any).map((student: any) => (
                        <div 
                          key={student.student_id} 
                          className={`border rounded-lg p-3 text-sm ${
                            student.is_same_class ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{student.real_name}</h4>
                              <p className="text-xs text-gray-600">{student.student_id}</p>
                              {student.gpa && (
                                <p className="text-xs text-blue-600 font-medium">
                                  GPA: {Number(student.gpa).toFixed(2)}
                                </p>
                              )}
                            </div>
                            {student.is_same_class && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">同班</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 如果没有任何同学信息 */}
            {(!classmates || !(classmates as any).classmates || (classmates as any).classmates.length === 0) &&
             (!majorClassmates || !(majorClassmates as any).majorClassmates || (majorClassmates as any).majorClassmates.length === 0) && (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500 text-center py-8">暂无同学信息</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-6">
            {/* 可参与的活动 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">可参与的活动</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">全部活动</option>
                    <option value="registered">已报名</option>
                    <option value="unregistered">未报名</option>
                    <option value="planned">计划中</option>
                    <option value="ongoing">进行中</option>
                  </select>
                </div>
              </div>
              {activities && (activities as any).length > 0 ? (
                <div className="space-y-4">
                  {(activities as any)
                    .filter((activity: any) => {
                      if (activityFilter === "all") return true;
                      if (activityFilter === "registered") return activity.is_registered;
                      if (activityFilter === "unregistered") return !activity.is_registered;
                      if (activityFilter === "planned") return activity.status === 'planned';
                      if (activityFilter === "ongoing") return activity.status === 'ongoing';
                      return true;
                    })
                    .map((activity: any) => (
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
                            {activity.is_registered && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">已报名</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">课程：</span>
                              {activity.class?.course?.course_name || 'Unknown Course'}
                            </div>
                            <div>
                              <span className="font-medium">类型：</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                activity.activity_type === '学习' ? 'bg-blue-100 text-blue-800' :
                                activity.activity_type === '文体' ? 'bg-green-100 text-green-800' :
                                activity.activity_type === '志愿' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.activity_type}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">开始时间：</span>
                              {new Date(activity.start_time).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div>
                              <span className="font-medium">参与人数：</span>
                              <span className="font-semibold text-blue-600">{activity.participant_count}</span>
                            </div>
                          </div>

                          {activity.end_time && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">结束时间：</span>
                              {new Date(activity.end_time).toLocaleString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          )}

                          {activity.budget_amount && Number(activity.budget_amount) > 0 && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">预算：</span>
                              ¥{Number(activity.budget_amount).toFixed(2)}
                              {activity.actual_cost && Number(activity.actual_cost) > 0 && (
                                <span className="ml-2 text-green-600">
                                  (实际花费: ¥{Number(activity.actual_cost).toFixed(2)})
                                </span>
                              )}
                            </div>
                          )}

                          {activity.location && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">地点：</span>
                              {activity.location}
                            </div>
                          )}

                          {activity.description && (
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">描述：</span>
                              <div className="mt-1 p-2 bg-gray-50 rounded text-gray-700">
                                {activity.description}
                              </div>
                            </div>
                          )}

                          {activity.organizer && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">组织者：</span>
                              <span className="text-blue-600 font-medium">
                                {activity.organizer?.user?.real_name || 'Unknown Organizer'}
                              </span>
                            </div>
                          )}

                          {activity.required_attendance && (
                            <div className="text-sm mb-2">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                必须参加
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {!activity.is_registered && activity.status === 'planned' && (
                            <button
                              onClick={() => {
                                registerActivityMutation.mutate({
                                  activityId: activity.activity_id,
                                  studentId
                                });
                              }}
                              disabled={registerActivityMutation.isPending}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {registerActivityMutation.isPending ? "报名中..." : "报名"}
                            </button>
                          )}

                          {activity.is_registered && activity.status === 'planned' && (
                            <button
                              onClick={() => {
                                unregisterActivityMutation.mutate({
                                  activityId: activity.activity_id,
                                  studentId
                                });
                              }}
                              disabled={unregisterActivityMutation.isPending}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {unregisterActivityMutation.isPending ? "取消中..." : "取消报名"}
                            </button>
                          )}

                          {activity.is_registered && activity.status === 'ongoing' && (
                            activity.my_participation?.attendance_status !== 'attended' ? (
                              <button
                                onClick={() => {
                                  checkInActivityMutation.mutate({
                                    activityId: activity.activity_id,
                                    studentId
                                  });
                                }}
                                disabled={checkInActivityMutation.isPending}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {checkInActivityMutation.isPending ? "签到中..." : "签到"}
                              </button>
                            ) : (
                              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded text-center">
                                已签到
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">
                    {activityFilter === 'all' ? '暂无可参与的活动' :
                     activityFilter === 'registered' ? '暂无已报名的活动' :
                     activityFilter === 'unregistered' ? '暂无未报名的活动' :
                     activityFilter === 'planned' ? '暂无计划中的活动' :
                     '暂无进行中的活动'}
                  </p>
                </div>
              )}
            </div>

            {/* 我的活动记录 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                我的活动记录 
                {activityHistory && (
                  <span className="ml-2 text-sm text-gray-500">
                    (共参与 {(activityHistory as any).length} 次活动)
                  </span>
                )}
              </h2>
              {activityHistory && (activityHistory as any).length > 0 ? (
                <div className="space-y-3">
                  {(activityHistory as any).map((participation: any) => (
                    <div key={participation.participant_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {participation.activity.activity_name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              participation.attendance_status === 'attended' ? 'bg-green-100 text-green-800' :
                              participation.attendance_status === 'registered' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {participation.attendance_status === 'attended' ? '已参加' :
                               participation.attendance_status === 'registered' ? '已报名' : '缺席'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">课程：</span>
                              {participation.activity?.class?.course?.course_name || 'Unknown Course'}
                            </div>
                            <div>
                              <span className="font-medium">报名时间：</span>
                              {new Date(participation.registration_time).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">活动时间：</span>
                              {new Date(participation.activity.start_time).toLocaleDateString()}
                            </div>
                          </div>

                          {participation.feedback ? (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">我的反馈：</span>
                              <div className="mt-1 p-2 bg-blue-50 rounded text-gray-700">
                                {participation.feedback}
                              </div>
                            </div>
                          ) : (
                            participation.attendance_status === 'attended' && (
                              <div className="mt-2">
                                <button
                                  onClick={() => {
                                    setFeedbackModal({
                                      show: true,
                                      activityId: participation.activity.activity_id,
                                      participantId: participation.participant_id
                                    });
                                    setFeedbackText('');
                                  }}
                                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                                >
                                  提交反馈
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">暂无活动参与记录</p>
                  <p className="text-sm text-gray-400 mt-1">参与活动后，记录会显示在这里</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 反馈提交模态框 */}
      {feedbackModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">提交活动反馈</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请分享您对这次活动的感想和建议：
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入您的反馈..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setFeedbackModal({ show: false, activityId: null, participantId: null });
                  setFeedbackText('');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (feedbackModal.activityId && feedbackText.trim()) {
                    submitFeedbackMutation.mutate({
                      activityId: feedbackModal.activityId,
                      studentId: studentId,
                      feedback: feedbackText.trim()
                    });
                  }
                }}
                disabled={submitFeedbackMutation.isPending || !feedbackText.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitFeedbackMutation.isPending ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}