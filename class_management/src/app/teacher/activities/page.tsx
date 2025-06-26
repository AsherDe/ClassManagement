"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

interface Activity {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  description?: string;
  location?: string;
  start_time: Date | string;
  end_time?: Date | string;
  organizer_id?: string;
  organizer_name?: string;
  budget_amount: number;
  actual_cost: number;
  participant_count: number;
  required_attendance: boolean;
  status: string;
  created_at: Date | string;
}

export default function TeacherActivitiesPage() {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state for creating activity
  const [formData, setFormData] = useState({
    classId: 1,
    activityName: "",
    activityType: "学习",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    budgetAmount: 0,
    requiredAttendance: false,
  });

  // 使用教师ID获取相关活动
  const teacherId = "T001"; // 张伟教师
  
  const { data: activities, refetch: refetchActivities } = api.activity.getActivitiesByTeacher.useQuery({
    teacherId,
    status: selectedTab === "all" ? undefined : (selectedTab as "planned" | "ongoing" | "completed" | "cancelled")
  });

  const { data: activityStats } = api.activity.getTeacherActivityStats.useQuery({ 
    teacherId 
  });

  const { data: teacherClasses } = api.teacher.getTeacherCourses.useQuery({ 
    teacherId 
  });

  const createActivityMutation = api.activity.createByTeacher.useMutation({
    onSuccess: () => {
      alert("活动创建成功！");
      setIsCreateModalOpen(false);
      setFormData({
        classId: 1,
        activityName: "",
        activityType: "学习",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        budgetAmount: 0,
        requiredAttendance: false,
      });
      refetchActivities();
    },
    onError: (error) => {
      alert(`创建失败: ${error.message}`);
    },
  });

  const updateActivityStatusMutation = api.activity.update.useMutation({
    onSuccess: () => {
      alert("活动状态更新成功！");
      refetchActivities();
    },
    onError: (error) => {
      alert(`更新失败: ${error.message}`);
    },
  });

  const handleCreateActivity = async () => {
    if (!formData.activityName || !formData.startTime) {
      alert("请填写活动名称和开始时间");
      return;
    }

    // Map Chinese activity types to English enum values
    const activityTypeMap: Record<string, string> = {
      "学习": "lecture",
      "文体": "sports",
      "志愿": "volunteer",
      "聚会": "social",
      "其他": "other"
    };

    try {
      await createActivityMutation.mutateAsync({
        classId: formData.classId,
        teacherId,
        activityName: formData.activityName,
        activityType: (activityTypeMap[formData.activityType] || "other") as "lecture" | "seminar" | "workshop" | "field_trip" | "competition" | "social" | "sports" | "cultural" | "volunteer" | "other",
        description: formData.description,
        location: formData.location,
        startTime: new Date(formData.startTime),
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        budgetAmount: formData.budgetAmount,
        requiredAttendance: formData.requiredAttendance,
      });
    } catch (error) {
      console.error("创建活动失败:", error);
    }
  };

  const handleStatusChange = async (activityId: number, newStatus: string) => {
    try {
      await updateActivityStatusMutation.mutateAsync({
        id: activityId,
        status: newStatus,
      });
    } catch (error) {
      console.error("更新状态失败:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned": return "bg-blue-100 text-blue-800";
      case "ongoing": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "planned": return "计划中";
      case "ongoing": return "进行中";
      case "completed": return "已完成";
      case "cancelled": return "已取消";
      default: return status;
    }
  };

  const filteredActivities = (activities as any[] || []).filter((activity: any) =>
    activity.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug: Log activities data
  console.log("Raw activities data:", activities);
  console.log("Activities type:", typeof activities);
  console.log("Activities is array?", Array.isArray(activities));
  console.log("Activities length:", activities?.length);
  console.log("Filtered activities:", filteredActivities);
  console.log("Filtered activities length:", filteredActivities.length);
  console.log("Selected tab:", selectedTab);
  console.log("Search term:", searchTerm);
  
  // Additional debug info
  if (activities && activities.length > 0) {
    console.log("First activity:", activities[0]);
    console.log("Activity structure:", Object.keys(activities[0] || {}));
  }

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
          <h1 className="text-3xl font-bold">班级活动管理</h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          创建新活动
        </button>
      </div>

      {/* Activity Stats */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{activityStats.total_activities || 0}</div>
            <div className="text-sm text-gray-600">总活动数</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{activityStats.planned_count || 0}</div>
            <div className="text-sm text-gray-600">计划中</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{activityStats.ongoing_count || 0}</div>
            <div className="text-sm text-gray-600">进行中</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{activityStats.completed_count || 0}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">¥{Number(activityStats.total_budget || 0).toFixed(2)}</div>
            <div className="text-sm text-gray-600">总预算</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: "all", label: "全部活动" },
              { key: "planned", label: "计划中" },
              { key: "ongoing", label: "进行中" },
              { key: "completed", label: "已完成" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b">
          <input
            type="text"
            placeholder="搜索活动名称或类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">活动列表</h2>
          <p className="text-gray-600 text-sm mt-1">
            共 {filteredActivities.length} 个活动
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div key={activity.activity_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {activity.activity_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {getStatusText(activity.status)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                        {activity.activity_type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{activity.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">时间:</span> {new Date(activity.start_time).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">地点:</span> {activity.location || '未指定'}
                      </div>
                      <div>
                        <span className="font-medium">预算:</span> ¥{Number(activity.budget_amount).toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">参与人数:</span> {activity.participant_count || 0}
                      </div>
                    </div>
                    
                    {activity.organizer_name && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">组织者:</span> {activity.organizer_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {activity.status === "planned" && (
                      <button
                        onClick={() => handleStatusChange(activity.activity_id, "ongoing")}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        开始活动
                      </button>
                    )}
                    {activity.status === "ongoing" && (
                      <button
                        onClick={() => handleStatusChange(activity.activity_id, "completed")}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        完成活动
                      </button>
                    )}
                    {(activity.status === "planned" || activity.status === "ongoing") && (
                      <button
                        onClick={() => handleStatusChange(activity.activity_id, "cancelled")}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p>暂无活动记录</p>
              <p className="text-sm mt-2">点击"创建新活动"开始添加活动</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Activity Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">创建新活动</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">选择班级</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                >
                  {(teacherClasses as any)?.map((cls: any) => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name}
                    </option>
                  )) || <option value={1}>数据库原理-1班</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">活动名称</label>
                <input
                  type="text"
                  value={formData.activityName}
                  onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="输入活动名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">活动类型</label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="学习">学习</option>
                  <option value="文体">文体</option>
                  <option value="志愿">志愿</option>
                  <option value="聚会">聚会</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">活动描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="输入活动描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">活动地点</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="输入活动地点"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">预算金额 (元)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budgetAmount}
                  onChange={(e) => setFormData({ ...formData, budgetAmount: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiredAttendance"
                  checked={formData.requiredAttendance}
                  onChange={(e) => setFormData({ ...formData, requiredAttendance: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="requiredAttendance" className="text-sm">必须参加</label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateActivity}
                disabled={createActivityMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {createActivityMutation.isPending ? "创建中..." : "创建活动"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}