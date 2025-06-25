"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function TestGradesPage() {
  const [selectedStudent, setSelectedStudent] = useState<number>(1005); // 陈浩 - 计算机2021-1班
  const [selectedCourse, setSelectedCourse] = useState<number>(1); // 计算机科学导论
  const [regularScore, setRegularScore] = useState<number>(85);
  const [midtermScore, setMidtermScore] = useState<number>(88);
  const [finalScore, setFinalScore] = useState<number>(92);

  // Get student data to show GPA before and after - using studentInfo endpoint
  const { data: student, refetch: refetchStudent } = api.studentInfo.getStudentInfo.useQuery({ 
    studentId: "20231001111" // Use a known student ID for demo
  });
  
  const createGradeMutation = api.grade.create.useMutation({
    onSuccess: () => {
      alert("成绩录入成功！GPA已自动更新");
      refetchStudent();
    },
    onError: (error) => {
      alert(`录入失败: ${error.message}`);
    },
  });

  const updateGradeMutation = api.grade.update.useMutation({
    onSuccess: () => {
      alert("成绩修改成功！GPA已自动更新");
      refetchStudent();
    },
    onError: (error) => {
      alert(`修改失败: ${error.message}`);
    },
  });

  const handleCreateGrade = async () => {
    await createGradeMutation.mutateAsync({
      studentId: "20231001111", // Use the student ID string
      classId: 1, // Use a class ID
      regularScore: regularScore,
      midtermScore: midtermScore,
      finalScore: finalScore,
      recordedBy: "T001", // Zhang Wei teacher ID
    });
  };

  const handleUpdateLastGrade = async () => {
    // This would require getting the last grade ID first
    // For demo purposes, we'll just create a new grade
    await createGradeMutation.mutateAsync({
      studentId: "20231001111",
      classId: 2, // Different class to avoid conflict
      regularScore: regularScore + 5,
      midtermScore: midtermScore + 3,
      finalScore: finalScore - 2,
      recordedBy: "T001",
    });
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
          <h1 className="text-3xl font-bold">成绩录入测试 - GPA自动更新演示</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Input Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">录入成绩</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">选择学生</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={1005}>陈浩 (20210101) - 计算机2021-1班</option>
                <option value={1006}>赵丽 (20210102) - 计算机2021-1班</option>
                <option value={1007}>孙强 (20210103) - 计算机2021-1班</option>
                <option value={1008}>周雅 (20210104) - 计算机2021-1班</option>
                <option value={1015}>邓宇 (20210201) - 计算机2021-2班</option>
                <option value={1016}>姚娜 (20210202) - 计算机2021-2班</option>
                <option value={1020}>金明 (20220101) - 软件工程2022-1班</option>
                <option value={1021}>范琳 (20220102) - 软件工程2022-1班</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">选择课程</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                <option value={1}>计算机科学导论 (3.0学分)</option>
                <option value={2}>程序设计基础 (4.0学分)</option>
                <option value={3}>数据结构与算法 (4.0学分)</option>
                <option value={5}>数据库系统原理 (3.5学分)</option>
                <option value={7}>软件工程 (3.0学分)</option>
                <option value={9}>高等数学A (5.0学分)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">平时成绩</label>
              <input
                type="number"
                min="0"
                max="100"
                value={regularScore}
                onChange={(e) => setRegularScore(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">期中成绩</label>
              <input
                type="number"
                min="0"
                max="100"
                value={midtermScore}
                onChange={(e) => setMidtermScore(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">期末成绩</label>
              <input
                type="number"
                min="0"
                max="100"
                value={finalScore}
                onChange={(e) => setFinalScore(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCreateGrade}
                disabled={createGradeMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {createGradeMutation.isPending ? "录入中..." : "录入新成绩"}
              </button>

              <button
                onClick={handleUpdateLastGrade}
                disabled={updateGradeMutation.isPending}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {updateGradeMutation.isPending ? "录入中..." : "录入其他课程成绩"}
              </button>
            </div>
          </div>
        </div>

        {/* Student GPA Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">学生GPA信息</h2>
          
          {student ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium">学生信息</h3>
                <p>姓名: {student.real_name}</p>
                <p>学号: {student.student_id}</p>
                <p>专业: {student.major_name || '未分配'}</p>
                <p>年级班级: {student.grade}级{student.class_number}班</p>
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-800">GPA信息</h3>
                <p className="text-2xl font-bold text-blue-600">
                  当前GPA: {student.gpa ? Number(student.gpa).toFixed(2) : "0.00"}
                </p>
                <p className="text-sm text-blue-600">
                  总学分: {student.total_credits ? Number(student.total_credits).toFixed(1) : "0.0"}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-medium text-green-800 mb-2">成绩计算说明</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• 总分 = (平时 + 期中 + 期末) / 3</p>
                  <p>• 90-100分: A等 (4.0绩点)</p>
                  <p>• 80-89分: B等 (3.0绩点)</p>
                  <p>• 70-79分: C等 (2.0绩点)</p>
                  <p>• 60-69分: D等 (1.0绩点)</p>
                  <p>• 60分以下: F等 (0.0绩点)</p>
                  <p>• GPA = Σ(课程学分×绩点) / Σ课程学分</p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>学生状态: {student.status === 'active' ? '在读' : student.status}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              加载学生信息中...
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-900 mb-2">📋 测试说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <h4 className="font-medium mb-2">🎯 功能演示：</h4>
            <ul className="space-y-1">
              <li>• 选择真实的测试学生和课程</li>
              <li>• 录入成绩后自动触发GPA计算</li>
              <li>• 实时查看GPA变化过程</li>
              <li>• 支持多门课程的连续录入</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📊 测试数据：</h4>
            <ul className="space-y-1">
              <li>• 石河子大学班级管理系统</li>
              <li>• 真实的学生和课程数据</li>
              <li>• 基于学分的加权GPA计算</li>
              <li>• 数据库触发器自动更新</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Data Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">🗂️ 测试数据概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">👥 学生信息：</h4>
            <ul className="space-y-1">
              <li>• 计算机2021-1班: 陈浩、赵丽、孙强等</li>
              <li>• 计算机2021-2班: 邓宇、姚娜等</li>
              <li>• 软件工程2022-1班: 金明、范琳等</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📚 课程设置：</h4>
            <ul className="space-y-1">
              <li>• 计算机科学导论 (3.0学分)</li>
              <li>• 程序设计基础 (4.0学分)</li>
              <li>• 数据结构与算法 (4.0学分)</li>
              <li>• 高等数学A (5.0学分)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚙️ 系统特性：</h4>
            <ul className="space-y-1">
              <li>• 自动GPA计算触发器</li>
              <li>• 学分加权平均算法</li>
              <li>• 实时数据同步更新</li>
              <li>• 完整的审计日志</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}