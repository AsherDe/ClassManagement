"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import SqlDisplay from "~/components/SqlDisplay";

type User = {
  id: number;
  username: string;
  email: string | null;
  user_type: string;
  status: string | null;
  phone?: string | null;
  created_at: Date | null;
};

type Class = {
  id: number;
  class_name: string;
  class_code: string;
  grade_level: number;
  major: string;
  department: string;
  total_students: number | null;
  status: string | null;
  students?: unknown[];
  class_teacher?: {
    user: {
      username: string;
    };
  };
};

type Student = {
  id: number;
  student_id: string;
  name: string;
  status: string;
  user: {
    username: string;
    email: string;
  };
  class?: {
    class_name: string;
  };
};

type Course = {
  id: number;
  course_name: string;
  course_code: string;
  credits: number;
  course_type: string;
  description?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({ isOpen: false, userId: null, username: "" });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/");
      return;
    }
    setUser(parsedUser);
  }, [router]);

  // Data queries
  const { data: users, refetch: refetchUsers } = api.admin.getAllUsers.useQuery();
  const { data: systemStats } = api.admin.getSystemStats.useQuery();
  const { data: classes } = api.teacher.getTeacherCourses.useQuery({ teacherId: "T001" }); // Sample data
  const { data: students } = api.teacher.getClassStudents.useQuery({ classId: 1 }); // Sample data
  const { data: courses } = api.teacher.getTeacherCourses.useQuery({ teacherId: "T001" }); // Sample data
  const { data: activities } = api.activity.getAll.useQuery();
  const { data: teacherWorkloadStats } = api.admin.getTeacherWorkloadStats.useQuery();

  // Mutations
  const resetPasswordMutation = api.admin.resetUserPassword.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setResetPasswordModal({ isOpen: false, userId: null, username: "" });
      setNewPassword("");
      refetchUsers();
    },
    onError: (error) => {
      alert(`密码重置失败: ${error.message}`);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleResetPassword = () => {
    if (!resetPasswordModal.userId || !newPassword.trim()) {
      alert("请输入新密码");
      return;
    }
    
    if (newPassword.length < 6) {
      alert("密码至少6位");
      return;
    }

    resetPasswordMutation.mutate({
      username: resetPasswordModal.username,
      newPassword: newPassword.trim(),
    });
  };

  const openResetPasswordModal = (userId: number, username: string) => {
    setResetPasswordModal({ isOpen: true, userId, username });
    setNewPassword("");
  };

  if (!user) return <div>Loading...</div>;

  const tabs = [
    { id: "overview", name: "总览" },
    { id: "users", name: "用户管理" },
    { id: "classes", name: "班级管理" },
    { id: "students", name: "学生管理" },
    { id: "courses", name: "课程管理" },
    { id: "activities", name: "活动管理" },
    { id: "analytics", name: "数据分析" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">管理员后台</h1>
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
        <nav className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </nav>

        {/* 总览页面 */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">总用户数</h3>
                <p className="text-2xl font-semibold text-gray-900">{systemStats?.totalUsers ?? users?.length ?? 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">教师数</h3>
                <p className="text-2xl font-semibold text-gray-900">{systemStats?.totalTeachers ?? 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">学生数</h3>
                <p className="text-2xl font-semibold text-gray-900">{systemStats?.totalStudents ?? (students as any)?.length ?? 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">班级数</h3>
                <p className="text-2xl font-semibold text-gray-900">{systemStats?.totalClasses ?? (classes as any)?.length ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">用户类型分布</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>管理员</span>
                    <span>{systemStats?.userTypeDistribution?.admin ?? users?.filter((u) => u.user_type === "admin").length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>教师</span>
                    <span>{systemStats?.userTypeDistribution?.teacher ?? users?.filter((u) => u.user_type === "teacher").length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>学生</span>
                    <span>{systemStats?.userTypeDistribution?.student ?? users?.filter((u) => u.user_type === "student").length ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">最近活动</h3>
                <div className="space-y-3">
                  {activities && activities.length > 0 ? (
                    activities.slice(0, 5).map((activity: any) => (
                      <div key={activity.activity_id || activity.id || activity.activity_name} className="text-sm">
                        <div className="font-medium">{activity.activity_name || activity.title}</div>
                        <div className="text-gray-500">{activity.class?.class_name || "未指定班级"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm">暂无活动</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户管理页面 */}
        {activeTab === "users" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">用户列表</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users?.map((userItem) => (
                    <tr key={userItem.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email || "未设置"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.user_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          正常
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : "未知"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openResetPasswordModal(userItem.user_id, userItem.username)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          重置密码
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 班级管理页面 */}
        {activeTab === "classes" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">班级列表</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(classes as any)?.map((classItem: any) => (
                <div key={classItem.class_id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{classItem.class_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">学期: {classItem.semester}</p>
                  <p className="text-sm text-gray-600 mt-1">课程: {classItem.course_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    学生数: {classItem.current_students || 0} / {classItem.max_students || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    教师: {classItem.teacher_name}
                  </p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 bg-green-100 text-green-800">
                    活跃
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 学生管理页面 */}
        {activeTab === "students" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">学生列表</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">专业</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(students as any)?.map((student: any) => (
                    <tr key={student.student_id || student.student_code || student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id || student.student_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.real_name || student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.user?.username || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.major_name || '计算机科学'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          正常
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 课程管理页面 */}
        {activeTab === "courses" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">课程列表</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(courses as any)?.map((course: any) => (
                <div key={course.class_id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{course.course_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">课程代码: {course.course_code}</p>
                  <p className="text-sm text-gray-600 mt-1">班级: {course.class_name}</p>
                  <p className="text-sm text-gray-600 mt-1">学期: {course.semester}</p>
                  <p className="text-sm text-gray-600 mt-1">教师: {course.teacher_name}</p>
                  <p className="text-sm text-gray-600 mt-1">学生数: {course.current_students}/{course.max_students}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 活动管理页面 */}
        {activeTab === "activities" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">活动列表</h2>
            <div className="space-y-4">
              {activities && activities.length > 0 ? (
                activities.map((activity: any) => (
                  <div key={activity.activity_id || activity.id || activity.title} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{activity.activity_name || activity.title || "活动"}</h3>
                        <p className="text-sm text-gray-600">{activity.description || "暂无描述"}</p>
                        <p className="text-sm text-gray-500 mt-1">状态: {activity.status || "未知"}</p>
                        <p className="text-sm text-gray-500">类型: {activity.activity_type || "未分类"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  暂无活动数据
                </div>
              )}
            </div>
          </div>
        )}

        {/* 数据分析页面 */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">数据分析中心</h2>
              <p className="text-gray-600">
                查看系统复杂查询结果，包括教师工作量统计等。所有查询均显示对应的SQL代码。
              </p>
            </div>

            {/* Teacher Workload Stats */}
            {teacherWorkloadStats && (
              <SqlDisplay
                title="教师工作量统计"
                sql={teacherWorkloadStats.sql}
                data={teacherWorkloadStats.data as any[]}
                columns={[
                  { key: 'teacher_id', label: '教师ID', type: 'text' },
                  { key: 'teacher_name', label: '教师姓名', type: 'text' },
                  { key: 'title', label: '职称', type: 'text' },
                  { key: 'class_count', label: '授课班级数', type: 'number' },
                  { key: 'total_students', label: '总学生数', type: 'number' },
                  { key: 'total_credits', label: '总学分', type: 'number' },
                  { key: 'avg_class_size', label: '平均班级人数', type: 'number' },
                ]}
              />
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">💡 数据分析说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-2">教师工作量统计：</h4>
                  <ul className="space-y-1">
                    <li>• 显示所有教师的工作负荷情况</li>
                    <li>• 包含授课班级数、学生总数等指标</li>
                    <li>• 按学生总数降序排列</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">使用说明：</h4>
                  <ul className="space-y-1">
                    <li>• 点击"显示SQL"查看查询代码</li>
                    <li>• 数据实时从数据库获取</li>
                    <li>• 支持复杂的多表连接查询</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 密码重置模态框 */}
      {resetPasswordModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">重置用户密码</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  为用户 <span className="font-medium">{resetPasswordModal.username}</span> 设置新密码
                </p>
                <div className="mt-4">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                  />
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setResetPasswordModal({ isOpen: false, userId: null, username: "" })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? "重置中..." : "确认重置"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}