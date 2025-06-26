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
  const [createUserModal, setCreateUserModal] = useState({
    isOpen: false,
  });
  const [newUser, setNewUser] = useState({
    username: "",
    password: "shzu123456",
    userType: "student" as "admin" | "teacher" | "student",
    realName: "",
    email: "",
    phone: "",
    studentId: "",
    teacherId: "",
    majorId: 1,
    grade: new Date().getFullYear(),
    classNumber: 1,
    title: "",
    department: "",
  });
  const [createClassModal, setCreateClassModal] = useState({ isOpen: false });
  const [newClass, setNewClass] = useState({
    courseId: 0,
    teacherId: "",
    className: "",
    semester: "",
    maxStudents: 50,
    classTime: "",
    classroom: "",
  });
  const [classDetailModal, setClassDetailModal] = useState<{
    isOpen: boolean;
    classData: any;
  }>({ isOpen: false, classData: null });
  const [studentAssignModal, setStudentAssignModal] = useState<{
    isOpen: boolean;
    classId: number | null;
    className: string;
  }>({ isOpen: false, classId: null, className: "" });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [createCourseModal, setCreateCourseModal] = useState({ isOpen: false });
  const [editCourseModal, setEditCourseModal] = useState<{
    isOpen: boolean;
    courseData: any;
  }>({ isOpen: false, courseData: null });
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    courseName: "",
    credits: 1,
    courseType: "required" as "required" | "optional" | "elective",
    description: "",
  });

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
  const { data: classes, refetch: refetchClasses } = api.admin.getAllClasses.useQuery();
  const { data: allStudents } = api.admin.getAllUsers.useQuery({ userType: "student" });
  const { data: allTeachers } = api.admin.getAllTeachers.useQuery();
  const { data: courses, refetch: refetchCourses } = api.admin.getAllCourses.useQuery();
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

  const createUserMutation = api.admin.createUser.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setCreateUserModal({ isOpen: false });
      setNewUser({
        username: "",
        password: "shzu123456",
        userType: "student",
        realName: "",
        email: "",
        phone: "",
        studentId: "",
        teacherId: "",
        majorId: 1,
        grade: new Date().getFullYear(),
        classNumber: 1,
        title: "",
        department: "",
      });
      refetchUsers();
    },
    onError: (error) => {
      alert(`创建用户失败: ${error.message}`);
    },
  });

  const deleteUserMutation = api.admin.deleteUser.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      refetchUsers();
    },
    onError: (error) => {
      alert(`删除用户失败: ${error.message}`);
    },
  });

  const createClassMutation = api.admin.createClassWithTeacher.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setCreateClassModal({ isOpen: false });
      setNewClass({
        courseId: 0,
        teacherId: "",
        className: "",
        semester: "",
        maxStudents: 50,
        classTime: "",
        classroom: "",
      });
      refetchClasses();
    },
    onError: (error) => {
      alert(`创建班级失败: ${error.message}`);
    },
  });

  const assignStudentsMutation = api.admin.assignStudentsToClass.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setStudentAssignModal({ isOpen: false, classId: null, className: "" });
      setSelectedStudents([]);
      refetchClasses();
    },
    onError: (error) => {
      alert(`分配学生失败: ${error.message}`);
    },
  });

  const reassignTeacherMutation = api.admin.reassignClassTeacher.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      refetchClasses();
    },
    onError: (error) => {
      alert(`重新分配教师失败: ${error.message}`);
    },
  });

  const createCourseMutation = api.admin.createCourse.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setCreateCourseModal({ isOpen: false });
      setNewCourse({
        courseCode: "",
        courseName: "",
        credits: 1,
        courseType: "required",
        description: "",
      });
      refetchCourses();
    },
    onError: (error) => {
      alert(`创建课程失败: ${error.message}`);
    },
  });

  const updateCourseMutation = api.admin.updateCourse.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      setEditCourseModal({ isOpen: false, courseData: null });
      refetchCourses();
    },
    onError: (error) => {
      alert(`更新课程失败: ${error.message}`);
    },
  });

  const deleteCourseMutation = api.admin.deleteCourse.useMutation({
    onSuccess: (result) => {
      alert(result.message);
      refetchCourses();
    },
    onError: (error) => {
      alert(`删除课程失败: ${error.message}`);
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

  const handleCreateUser = () => {
    if (!newUser.username.trim() || !newUser.realName.trim()) {
      alert("请输入用户名和真实姓名");
      return;
    }

    if (newUser.userType === "student" && !newUser.studentId.trim()) {
      alert("学生用户请输入学号");
      return;
    }

    if (newUser.userType === "teacher" && !newUser.teacherId.trim()) {
      alert("教师用户请输入教师编号");
      return;
    }

    createUserMutation.mutate({
      username: newUser.username,
      password: newUser.password,
      userType: newUser.userType,
      realName: newUser.realName,
      email: newUser.email || undefined,
      phone: newUser.phone || undefined,
      ...(newUser.userType === "student" && {
        studentId: newUser.studentId,
        majorId: newUser.majorId,
        grade: newUser.grade,
        classNumber: newUser.classNumber,
      }),
      ...(newUser.userType === "teacher" && {
        teacherId: newUser.teacherId,
        title: newUser.title || undefined,
        department: newUser.department || undefined,
      }),
    });
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (confirm(`确定要删除用户 ${username} 吗？此操作不可撤销。`)) {
      deleteUserMutation.mutate({ userId });
    }
  };

  const openCreateUserModal = () => {
    setCreateUserModal({ isOpen: true });
  };

  const handleCreateClass = () => {
    if (!newClass.courseId || !newClass.className.trim()) {
      alert("请填写必填项：课程和班级名称");
      return;
    }

    createClassMutation.mutate({
      courseId: newClass.courseId,
      teacherId: newClass.teacherId || undefined, // 允许为空
      className: newClass.className,
      semester: newClass.semester || "2024年春季",
      maxStudents: newClass.maxStudents,
      classTime: newClass.classTime || undefined,
      classroom: newClass.classroom || undefined,
    });
  };

  const openCreateClassModal = () => {
    setCreateClassModal({ isOpen: true });
  };

  const openClassDetail = (classData: any) => {
    setClassDetailModal({ isOpen: true, classData });
  };

  const openStudentAssign = (classId: number, className: string) => {
    setStudentAssignModal({ isOpen: true, classId, className });
    setSelectedStudents([]);
  };

  const handleAssignStudents = () => {
    if (!studentAssignModal.classId || selectedStudents.length === 0) {
      alert("请选择要分配的学生");
      return;
    }

    assignStudentsMutation.mutate({
      classId: studentAssignModal.classId,
      studentIds: selectedStudents,
    });
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleCreateCourse = () => {
    if (!newCourse.courseCode.trim() || !newCourse.courseName.trim()) {
      alert("请填写课程代码和课程名称");
      return;
    }

    createCourseMutation.mutate({
      courseCode: newCourse.courseCode,
      courseName: newCourse.courseName,
      credits: newCourse.credits,
      courseType: newCourse.courseType,
      description: newCourse.description || undefined,
    });
  };

  const openCreateCourseModal = () => {
    setCreateCourseModal({ isOpen: true });
  };

  const openEditCourseModal = (courseData: any) => {
    setEditCourseModal({ isOpen: true, courseData });
    setNewCourse({
      courseCode: courseData.course_code,
      courseName: courseData.course_name,
      credits: courseData.credits,
      courseType: courseData.course_type,
      description: courseData.description || "",
    });
  };

  const handleUpdateCourse = () => {
    if (!newCourse.courseName.trim()) {
      alert("请填写课程名称");
      return;
    }

    updateCourseMutation.mutate({
      courseId: editCourseModal.courseData.course_id,
      courseName: newCourse.courseName,
      credits: newCourse.credits,
      courseType: newCourse.courseType,
      description: newCourse.description || undefined,
    });
  };

  const handleDeleteCourse = (courseId: number, courseName: string) => {
    if (confirm(`确定要删除课程 ${courseName} 吗？此操作不可撤销。`)) {
      deleteCourseMutation.mutate({ courseId });
    }
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
                <p className="text-2xl font-semibold text-gray-900">{systemStats?.totalStudents ?? 0}</p>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">用户列表</h2>
              <button
                onClick={openCreateUserModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                创建用户
              </button>
            </div>
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
                        <button
                          onClick={() => handleDeleteUser(userItem.user_id, userItem.username)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteUserMutation.isPending}
                        >
                          删除
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">班级列表</h2>
              <button
                onClick={openCreateClassModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                创建班级
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes?.map((classItem: any) => (
                <div key={classItem.class_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{classItem.class_name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      classItem.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {classItem.status === "active" ? "活跃" : classItem.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">学期: {classItem.semester}</p>
                  <p className="text-sm text-gray-600 mt-1">课程: {classItem.course?.course_name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    学生数: {classItem.current_students || 0} / {classItem.max_students || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    教师: {classItem.teacher?.user?.real_name || "未分配"}
                  </p>
                  {classItem.class_time && (
                    <p className="text-sm text-gray-600 mt-1">时间: {classItem.class_time}</p>
                  )}
                  {classItem.classroom && (
                    <p className="text-sm text-gray-600 mt-1">教室: {classItem.classroom}</p>
                  )}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => openClassDetail(classItem)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => openStudentAssign(classItem.class_id, classItem.class_name)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      分配学生
                    </button>
                  </div>
                </div>
              ))}
              {(!classes || classes.length === 0) && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  暂无班级数据
                </div>
              )}
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
                  {allStudents?.map((student: any) => (
                    <tr key={student.students?.student_id || student.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.students?.student_id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.real_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.students?.major?.major_name || '未指定专业'}</td>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">课程列表</h2>
              <button
                onClick={openCreateCourseModal}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                创建课程
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses?.map((course: any) => (
                <div key={course.course_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{course.course_name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      course.course_type === "required" ? "bg-red-100 text-red-800" :
                      course.course_type === "optional" ? "bg-yellow-100 text-yellow-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {course.course_type === "required" ? "必修" :
                       course.course_type === "optional" ? "选修" : "任选"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">课程代码: {course.course_code}</p>
                  <p className="text-sm text-gray-600 mt-1">学分: {course.credits}</p>
                  {course.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">描述: {course.description}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">班级数: {course.classes?.length || 0}</p>
                  
                  {/* 显示关联的班级 */}
                  {course.classes && course.classes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">关联班级:</p>
                      <div className="flex flex-wrap gap-1">
                        {course.classes.slice(0, 3).map((classItem: any, index: number) => (
                          <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {classItem.class_name}
                          </span>
                        ))}
                        {course.classes.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{course.classes.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course.course_id, course.course_name)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={deleteCourseMutation.isPending}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              {(!courses || courses.length === 0) && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  暂无课程数据
                </div>
              )}
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

      {/* 创建用户模态框 */}
      {createUserModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">创建新用户</h3>
              <div className="px-7 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 基本信息 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名 *</label>
                    <input
                      type="text"
                      value={newUser.realName}
                      onChange={(e) => setNewUser({ ...newUser, realName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入真实姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">用户类型 *</label>
                    <select
                      value={newUser.userType}
                      onChange={(e) => setNewUser({ ...newUser, userType: e.target.value as "admin" | "teacher" | "student" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="student">学生</option>
                      <option value="teacher">教师</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="默认: shzu123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入邮箱（可选）"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入手机号（可选）"
                    />
                  </div>

                  {/* 学生特有字段 */}
                  {newUser.userType === "student" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">学号 *</label>
                        <input
                          type="text"
                          value={newUser.studentId}
                          onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入学号"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                        <input
                          type="number"
                          value={newUser.grade}
                          onChange={(e) => setNewUser({ ...newUser, grade: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="2020"
                          max="2030"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">班号</label>
                        <input
                          type="number"
                          value={newUser.classNumber}
                          onChange={(e) => setNewUser({ ...newUser, classNumber: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="20"
                        />
                      </div>
                    </>
                  )}

                  {/* 教师特有字段 */}
                  {newUser.userType === "teacher" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">教师编号 *</label>
                        <input
                          type="text"
                          value={newUser.teacherId}
                          onChange={(e) => setNewUser({ ...newUser, teacherId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入教师编号"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">职称</label>
                        <input
                          type="text"
                          value={newUser.title}
                          onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="如：讲师、副教授等"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="默认：计算机科学与技术学院"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setCreateUserModal({ isOpen: false })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createUserMutation.isPending ? "创建中..." : "创建用户"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 创建班级模态框 */}
      {createClassModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">创建新班级</h3>
              <div className="px-7 py-3">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">班级名称 *</label>
                    <input
                      type="text"
                      value={newClass.className}
                      onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入班级名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程 *</label>
                    <select
                      value={newClass.courseId}
                      onChange={(e) => setNewClass({ ...newClass, courseId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>请选择课程</option>
                      {courses?.map((course: any) => (
                        <option key={course.course_id} value={course.course_id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">授课教师 (可选)</label>
                    <select
                      value={newClass.teacherId}
                      onChange={(e) => setNewClass({ ...newClass, teacherId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">请选择教师（可不选）</option>
                      {allTeachers?.map((teacher: any) => (
                        <option key={teacher.teacher_id} value={teacher.teacher_id}>
                          {teacher.user?.real_name || 'Unknown Teacher'} ({teacher.teacher_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学期</label>
                    <input
                      type="text"
                      value={newClass.semester}
                      onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：2024年春季"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最大学生数</label>
                    <input
                      type="number"
                      value={newClass.maxStudents}
                      onChange={(e) => setNewClass({ ...newClass, maxStudents: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
                    <input
                      type="text"
                      value={newClass.classTime}
                      onChange={(e) => setNewClass({ ...newClass, classTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：周一 9:00-11:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">教室</label>
                    <input
                      type="text"
                      value={newClass.classroom}
                      onChange={(e) => setNewClass({ ...newClass, classroom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：A101"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setCreateClassModal({ isOpen: false })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={createClassMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createClassMutation.isPending ? "创建中..." : "创建班级"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 班级详情模态框 */}
      {classDetailModal.isOpen && classDetailModal.classData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                班级详情 - {classDetailModal.classData.class_name}
              </h3>
              <div className="px-7 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">班级名称</label>
                    <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.class_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">课程</label>
                    <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.course?.course_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">授课教师</label>
                    <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.teacher?.user?.real_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">学期</label>
                    <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.semester}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">学生数</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {classDetailModal.classData.current_students || 0} / {classDetailModal.classData.max_students || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">状态</label>
                    <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.status}</p>
                  </div>
                  {classDetailModal.classData.class_time && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">上课时间</label>
                      <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.class_time}</p>
                    </div>
                  )}
                  {classDetailModal.classData.classroom && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">教室</label>
                      <p className="mt-1 text-sm text-gray-900">{classDetailModal.classData.classroom}</p>
                    </div>
                  )}
                </div>
                
                {/* 学生列表 */}
                {classDetailModal.classData.enrollments && classDetailModal.classData.enrollments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">已注册学生</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {classDetailModal.classData.enrollments.map((enrollment: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-900">
                              {enrollment.student?.user?.real_name} ({enrollment.student?.student_id})
                            </span>
                            <span className="text-xs text-gray-500">{enrollment.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setClassDetailModal({ isOpen: false, classData: null })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学生分配模态框 */}
      {studentAssignModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                分配学生到班级 - {studentAssignModal.className}
              </h3>
              <div className="px-7 py-3">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">请选择要分配到此班级的学生（已选择 {selectedStudents.length} 人）</p>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-md">
                  {allStudents && allStudents.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {allStudents.map((student: any) => (
                        <div key={student.user_id} className="p-3 flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.username)}
                            onChange={(e) => handleStudentSelection(student.username, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{student.real_name}</p>
                            <p className="text-sm text-gray-500">用户名: {student.username}</p>
                            {student.email && (
                              <p className="text-sm text-gray-500">邮箱: {student.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">暂无学生数据</div>
                  )}
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setStudentAssignModal({ isOpen: false, classId: null, className: "" })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleAssignStudents}
                  disabled={assignStudentsMutation.isPending || selectedStudents.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {assignStudentsMutation.isPending ? "分配中..." : `分配 ${selectedStudents.length} 名学生`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 创建课程模态框 */}
      {createCourseModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">创建新课程</h3>
              <div className="px-7 py-3">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程代码 *</label>
                    <input
                      type="text"
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：CS101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 *</label>
                    <input
                      type="text"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入课程名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学分</label>
                    <input
                      type="number"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程类型</label>
                    <select
                      value={newCourse.courseType}
                      onChange={(e) => setNewCourse({ ...newCourse, courseType: e.target.value as "required" | "optional" | "elective" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="required">必修</option>
                      <option value="optional">选修</option>
                      <option value="elective">任选</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入课程描述（可选）"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setCreateCourseModal({ isOpen: false })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={createCourseMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createCourseMutation.isPending ? "创建中..." : "创建课程"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑课程模态框 */}
      {editCourseModal.isOpen && editCourseModal.courseData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                编辑课程 - {editCourseModal.courseData.course_name}
              </h3>
              <div className="px-7 py-3">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程代码</label>
                    <input
                      type="text"
                      value={newCourse.courseCode}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">课程代码不可修改</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程名称 *</label>
                    <input
                      type="text"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入课程名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学分</label>
                    <input
                      type="number"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程类型</label>
                    <select
                      value={newCourse.courseType}
                      onChange={(e) => setNewCourse({ ...newCourse, courseType: e.target.value as "required" | "optional" | "elective" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="required">必修</option>
                      <option value="optional">选修</option>
                      <option value="elective">任选</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">课程描述</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入课程描述（可选）"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => setEditCourseModal({ isOpen: false, courseData: null })}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateCourse}
                  disabled={updateCourseMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateCourseMutation.isPending ? "更新中..." : "更新课程"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}