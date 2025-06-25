"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

interface Student {
  student_id: string;
  real_name: string;
  major_name: string | null;
  grade: number | null;
  class_number: number | null;
  gpa: number | null;
  enrolled_at: string;
  grades: Array<{
    id: number;
    regular_score: number | null;
    midterm_score: number | null;
    final_score: number | null;
    total_score: number | null;
    letter_grade: string | null;
    grade_point: number | null;
    is_pass: boolean;
    course: {
      course_name: string;
      credits: number;
    };
  }>;
}

interface GradeInput {
  student_id: string;
  grade_id?: number; // For updates
  regular_score?: number;
  midterm_score?: number;
  final_score?: number;
}

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

// Student Detail Modal Component
function StudentDetailModal({ student, isOpen, onClose }: StudentDetailModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">学生详细信息</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-2">基本信息</h3>
            <p><strong>姓名:</strong> {student.real_name}</p>
            <p><strong>学号:</strong> {student.student_id}</p>
            <p><strong>专业:</strong> {student.major_name || '未分配'}</p>
            <p><strong>年级:</strong> {student.grade || '未知'}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">学术信息</h3>
            <p><strong>当前GPA:</strong> 
              <span className="text-2xl font-bold text-blue-600 ml-2">
                {student.gpa ? Number(student.gpa).toFixed(2) : "0.00"}
              </span>
            </p>
            <p><strong>班级号:</strong> {student.class_number || '未分配'}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">所有课程成绩</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">课程名称</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">学分</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">平时</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">期中</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">期末</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">总分</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">等级</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">绩点</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">状态</th>
                </tr>
              </thead>
              <tbody>
                {(student.grades || []).map((grade: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{grade.course_name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">--</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {grade.regular_score ?? '--'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {grade.midterm_score ?? '--'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {grade.final_score ?? '--'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {grade.total_score ? Number(grade.total_score).toFixed(1) : '--'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
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
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {grade.gpa_points ? Number(grade.gpa_points).toFixed(1) : '--'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        grade.total_score && Number(grade.total_score) >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {grade.total_score && Number(grade.total_score) >= 60 ? '通过' : '未通过'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(!student.grades || student.grades.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            暂无成绩记录
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherGradesPage() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [semester, setSemester] = useState("2024-1");
  const [academicYear, setAcademicYear] = useState("2024");
  const [grades, setGrades] = useState<Record<string, GradeInput>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 使用测试数据中的教师ID
  const teacherId = "T001"; // 张伟教师

  const { data: courses } = api.teacher.getTeacherCourses.useQuery({ teacherId });
  const { data: classes } = api.teacher.getTeacherCourses.useQuery({ teacherId }); // Use teacher courses for class selection
  
  const { data: students, refetch: refetchStudents } = api.teacher.getClassStudents.useQuery(
    { classId: selectedClass! },
    {
      enabled: !!selectedClass,
    }
  );

  const createGradeMutation = api.grade.create.useMutation({
    onSuccess: () => {
      alert("成绩录入成功！GPA已自动更新");
      refetchStudents();
    },
    onError: (error) => {
      alert(`录入失败: ${error.message}`);
    },
  });

  const updateGradeMutation = api.grade.update.useMutation({
    onSuccess: () => {
      alert("成绩修改成功！GPA已自动更新");
      refetchStudents();
    },
    onError: (error) => {
      alert(`修改失败: ${error.message}`);
    },
  });

  const handleScoreChange = (studentId: string, scoreType: 'regular_score' | 'midterm_score' | 'final_score', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    if (numValue !== undefined && (numValue < 0 || numValue > 100)) return;

    const existingGrade = getExistingGrade((students as any)?.find((s: any) => s.student_id === studentId));
    
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        grade_id: existingGrade?.id,
        [scoreType]: numValue,
      }
    }));
  };

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  const { data: studentDetail } = api.studentInfo.getStudentGrades.useQuery(
    { studentId: selectedStudentId! },
    { enabled: !!selectedStudentId }
  );

  const handleStudentDetailClick = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  // Update selectedStudent when studentDetail changes
  useEffect(() => {
    if (studentDetail && selectedStudentId) {
      // Get basic student info from the students list
      const basicInfo = (students as any)?.find((s: any) => s.student_id === selectedStudentId);
      if (basicInfo) {
        // Combine basic info with grades
        const studentWithGrades = {
          ...basicInfo,
          grades: studentDetail || []
        };
        setSelectedStudent(studentWithGrades);
        setIsModalOpen(true);
        setSelectedStudentId(null); // Reset for next time
      }
    }
  }, [studentDetail, selectedStudentId, students]);

  const handleUpdateGrade = async (studentId: string) => {
    const gradeData = grades[studentId];
    if (!gradeData || !gradeData.grade_id) {
      alert("请先选择要修改的成绩");
      return;
    }

    try {
      await updateGradeMutation.mutateAsync({
        gradeId: gradeData.grade_id,
        regularScore: gradeData.regular_score,
        midtermScore: gradeData.midterm_score,
        finalScore: gradeData.final_score,
        recordedBy: teacherId,
      });
      
      // Clear the input for this student
      setGrades(prev => {
        const newGrades = { ...prev };
        delete newGrades[studentId];
        return newGrades;
      });
    } catch (error) {
      console.error("更新成绩失败:", error);
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedClass) {
      alert("请选择班级");
      return;
    }

    const gradeInputs = Object.values(grades).filter(grade => 
      !grade.grade_id && (
        grade.regular_score !== undefined || 
        grade.midterm_score !== undefined || 
        grade.final_score !== undefined
      )
    );

    if (gradeInputs.length === 0) {
      alert("请至少输入一个新成绩");
      return;
    }

    setIsSubmitting(true);
    try {
      for (const gradeInput of gradeInputs) {
        const studentIdStr = gradeInput.student_id;
        await createGradeMutation.mutateAsync({
          studentId: studentIdStr,
          classId: selectedClass,
          regularScore: gradeInput.regular_score,
          midtermScore: gradeInput.midterm_score,
          finalScore: gradeInput.final_score,
          recordedBy: teacherId,
        });
      }
      setGrades({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExistingGrade = (student: Student | undefined) => {
    return student?.grades?.find(g => true); // There should be only one grade per student per course/semester
  };

  // Filter students based on search term
  const filteredStudents = (students as any)?.filter((student: any) => 
    student.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/teacher"
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
          >
            <span>←</span>
            <span>返回教师工作台</span>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-3xl font-bold">成绩录入与管理</h1>
        </div>
      </div>

      {/* Course and Class Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">选择课程和班级</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">课程</label>
            <select
              value={selectedCourse || ''}
              onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">选择课程</option>
              {(courses as any)?.map((course: any) => (
                <option key={course.class_id} value={course.class_id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">班级</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">选择班级</option>
              {(courses as any)?.map((course: any) => (
                <option key={course.class_id} value={course.class_id}>
                  {course.class_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">学期</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="2024-1">2024年第一学期</option>
              <option value="2024-2">2024年第二学期</option>
              <option value="2025-1">2025年第一学期</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">学年</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      {students && (students as any).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索学生（姓名、学号、用户名）..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div className="text-sm text-gray-600">
              共 {(students as any)?.length || 0} 名学生 {searchTerm && `（筛选后 ${filteredStudents?.length} 名）`}
            </div>
          </div>
        </div>
      )}

      {/* Students Grade Table */}
      {filteredStudents && filteredStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">学生成绩录入与管理</h2>
            <p className="text-gray-600 text-sm mt-1">
              输入分数 (0-100)，系统将自动计算总分、等级和GPA。点击学生姓名查看详细信息。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前GPA
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
                    当前总分
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    等级
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student: any) => {
                  const existingGrade = getExistingGrade(student);
                  const currentGrade = grades[student.student_id];
                  const hasChanges = currentGrade && (
                    currentGrade.regular_score !== undefined ||
                    currentGrade.midterm_score !== undefined ||
                    currentGrade.final_score !== undefined
                  );
                  
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleStudentDetailClick(student.student_id)}
                          className="text-sm text-blue-600 hover:text-blue-900 hover:underline font-medium"
                        >
                          {student.real_name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-sm font-semibold ${
                          student.gpa 
                            ? Number(student.gpa) >= 3.5 ? 'text-green-600' :
                              Number(student.gpa) >= 3.0 ? 'text-blue-600' :
                              Number(student.gpa) >= 2.0 ? 'text-yellow-600' :
                              'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {student.gpa ? Number(student.gpa).toFixed(2) : '0.00'}
                        </span>
                        <div className="text-xs text-gray-500">
                          {student.major_name || '未分配专业'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={existingGrade?.regular_score?.toString() || ""}
                          value={currentGrade?.regular_score || ''}
                          onChange={(e) => handleScoreChange(student.student_id, 'regular_score', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-sm text-center"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={existingGrade?.midterm_score?.toString() || ""}
                          value={currentGrade?.midterm_score || ''}
                          onChange={(e) => handleScoreChange(student.student_id, 'midterm_score', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-sm text-center"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={existingGrade?.final_score?.toString() || ""}
                          value={currentGrade?.final_score || ''}
                          onChange={(e) => handleScoreChange(student.student_id, 'final_score', e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-sm text-center"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <span className={`font-semibold ${
                          existingGrade?.total_score 
                            ? Number(existingGrade.total_score) >= 90 ? 'text-green-600' :
                              Number(existingGrade.total_score) >= 80 ? 'text-blue-600' :
                              Number(existingGrade.total_score) >= 70 ? 'text-yellow-600' :
                              Number(existingGrade.total_score) >= 60 ? 'text-orange-600' :
                              'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {existingGrade?.total_score ? Number(existingGrade.total_score).toFixed(1) : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          existingGrade?.letter_grade === 'A' ? 'bg-green-100 text-green-800' :
                          existingGrade?.letter_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          existingGrade?.letter_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          existingGrade?.letter_grade === 'D' ? 'bg-orange-100 text-orange-800' :
                          existingGrade?.letter_grade === 'F' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {existingGrade?.letter_grade || '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col gap-1">
                          {existingGrade && hasChanges && (
                            <button
                              onClick={() => handleUpdateGrade(student.student_id)}
                              disabled={updateGradeMutation.isPending}
                              className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
                            >
                              修改
                            </button>
                          )}
                          <button
                            onClick={() => handleStudentDetailClick(student.student_id)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            详情
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {(students as any)?.length || 0} 名学生 {searchTerm && `（筛选后 ${filteredStudents?.length} 名）`}
                <div className="mt-1 text-xs text-blue-600">
                  提交成绩后将自动计算总分、等级和GPA
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setGrades({})}
                  disabled={Object.keys(grades).length === 0}
                  className={`px-4 py-2 rounded font-medium ${
                    Object.keys(grades).length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  清空输入
                </button>
                <button
                  onClick={handleSubmitGrades}
                  disabled={isSubmitting || Object.values(grades).filter(g => !g.grade_id).length === 0}
                  className={`px-4 py-2 rounded font-medium ${
                    isSubmitting || Object.values(grades).filter(g => !g.grade_id).length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? '提交中...' : '提交新成绩（自动计算GPA）'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal 
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">功能说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">成绩管理：</h4>
            <ul className="space-y-1">
              <li>• 选择课程和班级查看学生列表</li>
              <li>• 输入成绩范围：0-100分</li>
              <li>• 支持平时、期中、期末成绩录入</li>
              <li>• 修改已有成绩会显示"修改"按钮</li>
              <li>• <strong>自动计算：</strong>总分 = 平时×30% + 期中×30% + 期末×40%</li>
              <li>• <strong>GPA实时更新：</strong>根据学分加权计算学生总GPA</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">查看功能：</h4>
            <ul className="space-y-1">
              <li>• 实时显示每个学生的当前GPA</li>
              <li>• 点击学生姓名查看详细成绩记录</li>
              <li>• 搜索功能支持姓名、学号、用户名</li>
              <li>• GPA颜色编码：绿色(≥3.5)、蓝色(≥3.0)、黄色(≥2.0)、红色(&lt;2.0)</li>
              <li>• 总分颜色编码：绿色(≥90)、蓝色(≥80)、黄色(≥70)、橙色(≥60)、红色(&lt;60)</li>
              <li>• <strong>显示总学分和通过状态，每次录入后GPA自动更新</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}