"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function GPARankingPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 使用测试数据中的教师ID
  const teacherId = "T001"; // 张伟教师

  const { data: courses } = api.teacher.getTeacherCourses.useQuery({ teacherId });
  
  const { data: students } = api.teacher.getClassStudents.useQuery(
    { classId: selectedClass! },
    {
      enabled: !!selectedClass,
    }
  );

  const { data: allStudentsRanking } = api.studentInfo.getAllStudentsGPARanking.useQuery();
  const { data: majorRanking } = api.studentInfo.getMajorGPARanking.useQuery();

  // Filter students based on search term
  const filteredStudents = (students as any)?.filter((student: any) => 
    student.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGPALevel = (gpa: number) => {
    if (gpa >= 3.70) return { level: '优秀', color: 'text-green-600' };
    if (gpa >= 3.00) return { level: '良好', color: 'text-blue-600' };
    if (gpa >= 2.30) return { level: '中等', color: 'text-yellow-600' };
    if (gpa >= 2.00) return { level: '及格', color: 'text-orange-600' };
    return { level: '不及格', color: 'text-red-600' };
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (ranking === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (ranking === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (ranking <= 10) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

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
          <h1 className="text-3xl font-bold">GPA查询与排名</h1>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">选择班级查看GPA详情</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">选择班级</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">选择班级</option>
              {(courses as any)?.map((course: any) => (
                <option key={course.class_id} value={course.class_id}>
                  {course.class_name} - {course.course_name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedClass && (
            <div>
              <label className="block text-sm font-medium mb-2">搜索学生</label>
              <input
                type="text"
                placeholder="搜索学生（姓名、学号）..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Class Students GPA Table */}
      {filteredStudents && filteredStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">班级学生GPA详情</h2>
            <p className="text-gray-600 text-sm mt-1">
              共 {filteredStudents.length} 名学生，按GPA从高到低排序
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    班级排名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    专业
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前GPA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPA等级
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总学分
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents
                  .sort((a: any, b: any) => (Number(b.gpa) || 0) - (Number(a.gpa) || 0))
                  .map((student: any, index: number) => {
                    const gpaInfo = getGPALevel(Number(student.gpa) || 0);
                    return (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankingBadge(index + 1)}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                          {student.real_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {student.major_name || '未分配'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-lg font-bold ${gpaInfo.color}`}>
                            {student.gpa ? Number(student.gpa).toFixed(2) : '0.00'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            gpaInfo.level === '优秀' ? 'bg-green-100 text-green-800' :
                            gpaInfo.level === '良好' ? 'bg-blue-100 text-blue-800' :
                            gpaInfo.level === '中等' ? 'bg-yellow-100 text-yellow-800' :
                            gpaInfo.level === '及格' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {gpaInfo.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {student.total_credits || 0}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Students Ranking */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">全校学生GPA排名（前20名）</h2>
            <p className="text-gray-600 text-sm mt-1">
              全校所有学生按GPA排名
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GPA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(allStudentsRanking as any)?.slice(0, 20).map((student: any) => {
                  const gpaInfo = getGPALevel(Number(student.gpa) || 0);
                  return (
                    <tr key={student.student_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankingBadge(Number(student.ranking))}`}>
                          #{student.ranking}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {student.real_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`text-sm font-bold ${gpaInfo.color}`}>
                          {Number(student.gpa).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Major Ranking */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">各专业平均GPA排名</h2>
            <p className="text-gray-600 text-sm mt-1">
              按专业平均GPA排名
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    排名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    专业名称
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学生数
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均GPA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(majorRanking as any)?.map((major: any) => {
                  const gpaInfo = getGPALevel(Number(major.avg_gpa) || 0);
                  return (
                    <tr key={major.major_name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankingBadge(Number(major.ranking))}`}>
                          #{major.ranking}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {major.major_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                        {major.student_count}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`text-sm font-bold ${gpaInfo.color}`}>
                          {Number(major.avg_gpa).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">GPA说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">GPA计算规则：</h4>
            <ul className="space-y-1">
              <li>• GPA采用4.0制计算</li>
              <li>• 按学分加权平均计算总GPA</li>
              <li>• A+/A: 4.0, A-: 3.7, B+: 3.3, B: 3.0</li>
              <li>• B-: 2.7, C+: 2.3, C: 2.0, C-: 1.7</li>
              <li>• D+: 1.3, D: 1.0, D-: 0.7, F: 0.0</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">GPA等级划分：</h4>
            <ul className="space-y-1">
              <li>• <span className="text-green-600 font-semibold">优秀：</span>GPA ≥ 3.70</li>
              <li>• <span className="text-blue-600 font-semibold">良好：</span>3.00 ≤ GPA &lt; 3.70</li>
              <li>• <span className="text-yellow-600 font-semibold">中等：</span>2.30 ≤ GPA &lt; 3.00</li>
              <li>• <span className="text-orange-600 font-semibold">及格：</span>2.00 ≤ GPA &lt; 2.30</li>
              <li>• <span className="text-red-600 font-semibold">不及格：</span>GPA &lt; 2.00</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}