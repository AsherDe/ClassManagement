"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">班级管理系统演示</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teacher Grades Management */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">老师成绩管理</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            完整的成绩录入与管理系统，支持成绩修改和GPA自动更新
          </p>
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              成绩录入与修改
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              实时GPA显示
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              学生详情查看
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              搜索和筛选
            </div>
          </div>
          <Link
            href="/teacher/grades"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors inline-block text-center"
          >
            进入成绩管理
          </Link>
        </div>

        {/* Test Grades Demo */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🧪</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">GPA测试演示</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            演示GPA自动计算功能，查看成绩录入后的实时更新效果
          </p>
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              GPA自动计算
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              触发器演示
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              实时数据更新
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              评分标准展示
            </div>
          </div>
          <Link
            href="/teacher/test-grades"
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors inline-block text-center"
          >
            查看测试演示
          </Link>
        </div>

        {/* System Features */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">系统特性</h2>
          </div>
          <p className="text-gray-600 mb-4 text-sm">
            基于现代技术栈构建的全栈班级管理系统
          </p>
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex items-center">
              <span className="text-purple-500 mr-2">•</span>
              Next.js + TypeScript
            </div>
            <div className="flex items-center">
              <span className="text-purple-500 mr-2">•</span>
              tRPC + Prisma ORM
            </div>
            <div className="flex items-center">
              <span className="text-purple-500 mr-2">•</span>
              PostgreSQL 数据库
            </div>
            <div className="flex items-center">
              <span className="text-purple-500 mr-2">•</span>
              自动化触发器
            </div>
          </div>
          <div className="w-full bg-purple-600 text-white py-2 px-4 rounded text-center">
            技术栈展示
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <div className="mt-12 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">核心功能展示</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-600">🎯 成绩管理核心功能</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">▸</span>
                <span><strong>智能成绩录入：</strong>支持平时、期中、期末三种成绩类型</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">▸</span>
                <span><strong>实时成绩修改：</strong>老师可以随时修改已录入的成绩</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">▸</span>
                <span><strong>自动计算系统：</strong>总分、等级、绩点自动计算</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">▸</span>
                <span><strong>批量操作：</strong>支持整个班级成绩的批量录入</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600">📈 GPA自动更新系统</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">▸</span>
                <span><strong>数据库触发器：</strong>成绩变更时自动触发GPA重算</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">▸</span>
                <span><strong>学分加权计算：</strong>基于课程学分的加权平均GPA</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">▸</span>
                <span><strong>实时数据同步：</strong>GPA与成绩数据保持完全同步</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">▸</span>
                <span><strong>历史记录：</strong>完整的GPA变更日志追踪</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Interface Features */}
      <div className="mt-8 bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">界面特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <h4 className="font-semibold mb-2">智能搜索</h4>
            <p className="text-sm text-gray-600">支持按姓名、学号、用户名快速搜索学生</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📱</span>
            </div>
            <h4 className="font-semibold mb-2">响应式设计</h4>
            <p className="text-sm text-gray-600">适配桌面、平板、手机等多种设备</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🎨</span>
            </div>
            <h4 className="font-semibold mb-2">直观界面</h4>
            <p className="text-sm text-gray-600">清晰的色彩编码和用户友好的交互设计</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">快速开始</h3>
        <p className="text-yellow-700 mb-3">
          点击上方的"进入成绩管理"开始体验完整的成绩录入和GPA管理功能。
        </p>
        <div className="text-sm text-yellow-600 space-y-1">
          <p>💡 <strong>数据准备：</strong>系统已加载石河子大学的完整测试数据</p>
          <p>🔧 <strong>数据库：</strong>PostgreSQL + Prisma ORM，包含GPA自动更新触发器</p>
          <p>👥 <strong>测试账户：</strong>teacher001 (张伟教师) 可管理多个班级的成绩</p>
          <p>📊 <strong>实时演示：</strong>成绩录入后立即看到GPA变化</p>
        </div>
      </div>

      {/* Database Status */}
      <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">📊 测试数据状态</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
          <div className="text-center">
            <div className="font-bold text-lg">20</div>
            <div>学生数据</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">4</div>
            <div>教师数据</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">10</div>
            <div>课程数据</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">186+</div>
            <div>成绩记录</div>
          </div>
        </div>
        <p className="text-green-600 mt-3 text-sm">
          ✅ 所有测试数据已就绪，GPA触发器运行正常，可以开始演示。
        </p>
      </div>
    </div>
  );
}