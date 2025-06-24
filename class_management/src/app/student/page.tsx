"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("info");

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
              onClick={() => setActiveTab("classmates")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "classmates"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              同班同学
            </button>
          </nav>
        </div>

        {activeTab === "info" && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <p className="mt-1 text-sm text-gray-900">{studentInfo?.real_name || user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">学号</label>
                <p className="mt-1 text-sm text-gray-900">{studentInfo?.student_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">专业</label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentInfo?.major_name || "未分配专业"}
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
          </div>
        )}

        {activeTab === "grades" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">我的成绩</h2>
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
        )}

        {activeTab === "classmates" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">同班同学</h2>
            {classmates && (classmates as any).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(classmates as any).map((classmate: any) => (
                  <div key={classmate.student_id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{classmate.real_name}</h3>
                    <p className="text-sm text-gray-600">学号: {classmate.student_id}</p>
                    <p className="text-sm text-gray-600">专业: {classmate.major_name}</p>
                    <p className="text-sm text-gray-600">年级: {classmate.grade}</p>
                    <p className="text-sm text-gray-600">班级: {classmate.class_number}</p>
                    {classmate.gpa && (
                      <p className="text-sm text-blue-600 font-medium">GPA: {Number(classmate.gpa).toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无同班同学信息</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}