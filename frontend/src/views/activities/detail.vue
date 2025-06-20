<template>
  <div class="activity-detail-container">
    <el-card>
      <el-page-header @back="$router.back()" :icon="Trophy" title="返回" content="活动详情">
        <template #extra>
          <el-button-group>
            <el-button type="primary" @click="handleEdit" :disabled="activity.status === 'completed'">
              <el-icon><Edit /></el-icon>
              编辑活动
            </el-button>
            <el-button type="success" @click="handleAttendance" v-if="activity.status === 'ongoing'">
              <el-icon><UserFilled /></el-icon>
              考勤管理
            </el-button>
            <el-button type="warning" @click="handleBudget">
              <el-icon><Money /></el-icon>
              预算管理
            </el-button>
          </el-button-group>
        </template>
      </el-page-header>

      <div class="detail-content" v-loading="loading">
        <!-- 基本信息卡片 -->
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card title="基本信息" class="info-card">
              <div class="info-item">
                <span class="label">活动名称：</span>
                <span class="value">{{ activity.activity_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">活动类型：</span>
                <el-tag :type="getTypeColor(activity.activity_type)" size="small">
                  {{ activity.activity_type }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">活动状态：</span>
                <el-tag :type="getStatusType(activity.status)" size="small">
                  {{ getStatusText(activity.status) }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">活动地点：</span>
                <span class="value">{{ activity.location || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">开始时间：</span>
                <span class="value">{{ formatDate(activity.start_time) }}</span>
              </div>
              <div class="info-item">
                <span class="label">结束时间：</span>
                <span class="value">{{ activity.end_time ? formatDate(activity.end_time) : '待定' }}</span>
              </div>
              <div class="info-item">
                <span class="label">组织者：</span>
                <span class="value">{{ activity.organizer?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">是否必须参加：</span>
                <el-tag :type="activity.required_attendance ? 'danger' : 'info'" size="small">
                  {{ activity.required_attendance ? '必须参加' : '自愿参加' }}
                </el-tag>
              </div>
              <div class="info-item" v-if="activity.description">
                <span class="label">活动描述：</span>
                <div class="description">{{ activity.description }}</div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <!-- 统计信息卡片 -->
            <el-card title="统计信息" class="stats-card">
              <div class="stat-item">
                <div class="stat-value">{{ activity.participant_count || 0 }}</div>
                <div class="stat-label">参与人数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ activity.attendance_stats?.present_count || 0 }}</div>
                <div class="stat-label">实际到场</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ activity.attendance_stats?.absent_count || 0 }}</div>
                <div class="stat-label">缺席人数</div>
              </div>
            </el-card>

            <!-- 预算信息卡片 -->
            <el-card title="预算信息" class="budget-card">
              <div class="budget-item">
                <span class="label">预算金额：</span>
                <span class="value">¥{{ (activity.budget_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="budget-item">
                <span class="label">实际花费：</span>
                <span class="value">¥{{ (activity.actual_cost || 0).toFixed(2) }}</span>
              </div>
              <div class="budget-item">
                <span class="label">剩余预算：</span>
                <span class="value" :class="getRemainingBudgetClass()">
                  ¥{{ ((activity.budget_amount || 0) - (activity.actual_cost || 0)).toFixed(2) }}
                </span>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 考勤记录 -->
        <el-card title="考勤记录" class="attendance-card" v-if="attendance.length > 0">
          <el-table :data="attendance" stripe>
            <el-table-column prop="student_name" label="学生姓名" width="120" />
            <el-table-column prop="student_code" label="学号" width="120" />
            <el-table-column prop="status" label="考勤状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'present' ? 'success' : 'danger'" size="small">
                  {{ scope.row.status === 'present' ? '出席' : '缺席' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="check_in_time" label="签到时间" width="180">
              <template #default="scope">
                {{ scope.row.check_in_time ? formatDate(scope.row.check_in_time) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
          </el-table>
        </el-card>
      </div>
    </el-card>

    <!-- 编辑活动对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑活动" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="editFormRef" 
        :model="editForm" 
        :rules="editRules" 
        label-width="120px"
      >
        <el-form-item label="活动名称" prop="activity_name">
          <el-input v-model="editForm.activity_name" placeholder="请输入活动名称" />
        </el-form-item>
        
        <el-form-item label="活动类型" prop="activity_type">
          <el-select v-model="editForm.activity_type" placeholder="请选择活动类型" style="width: 100%">
            <el-option label="学习活动" value="学习" />
            <el-option label="文体活动" value="文体" />
            <el-option label="志愿活动" value="志愿" />
            <el-option label="聚会活动" value="聚会" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker
                v-model="editForm.start_time"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker
                v-model="editForm.end_time"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="editForm.location" placeholder="请输入活动地点" />
        </el-form-item>
        
        <el-form-item label="预算金额" prop="budget_amount">
          <el-input-number 
            v-model="editForm.budget_amount" 
            :min="0" 
            :precision="2" 
            style="width: 100%"
            placeholder="预算金额"
          />
        </el-form-item>
        
        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="editForm.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入活动描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit" :loading="editLoading">
            更新
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Trophy, Edit, UserFilled, Money } from '@element-plus/icons-vue'
import { activityService } from '@/services/activities'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const activity = ref({})
const attendance = ref([])
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref(null)

// 编辑表单数据
const editForm = reactive({
  activity_name: '',
  activity_type: '',
  start_time: '',
  end_time: '',
  location: '',
  budget_amount: 0,
  description: ''
})

// 编辑表单验证规则
const editRules = {
  activity_name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' }
  ],
  activity_type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ]
}

// 状态类型映射
const getStatusType = (status) => {
  const statusMap = {
    'planned': 'info',
    'ongoing': 'success',
    'completed': 'warning',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const statusMap = {
    'planned': '计划中',
    'ongoing': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 活动类型颜色映射
const getTypeColor = (type) => {
  const colorMap = {
    '学习': 'primary',
    '文体': 'success',
    '志愿': 'warning',
    '聚会': 'info',
    '其他': 'danger'
  }
  return colorMap[type] || ''
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取剩余预算样式类
const getRemainingBudgetClass = () => {
  const remaining = (activity.value.budget_amount || 0) - (activity.value.actual_cost || 0)
  if (remaining < 0) return 'budget-over'
  if (remaining < (activity.value.budget_amount || 0) * 0.1) return 'budget-low'
  return 'budget-normal'
}

// 加载活动详情
const loadActivityDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id
    const response = await activityService.getActivityById(id)
    activity.value = response.data.data || {}
  } catch (error) {
    console.error('加载活动详情失败:', error)
    ElMessage.error('加载活动详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 加载考勤记录
const loadAttendance = async () => {
  try {
    const id = route.params.id
    const response = await activityService.getActivityAttendance(id)
    attendance.value = response.data.data || []
  } catch (error) {
    console.error('加载考勤记录失败:', error)
  }
}

// 编辑活动
const handleEdit = () => {
  // 填充编辑表单
  Object.assign(editForm, {
    activity_name: activity.value.activity_name,
    activity_type: activity.value.activity_type,
    start_time: activity.value.start_time,
    end_time: activity.value.end_time,
    location: activity.value.location || '',
    budget_amount: activity.value.budget_amount || 0,
    description: activity.value.description || ''
  })
  
  editDialogVisible.value = true
}

// 提交编辑
const handleEditSubmit = async () => {
  try {
    await editFormRef.value.validate()
    editLoading.value = true
    
    const id = route.params.id
    await activityService.updateActivity(id, editForm)
    
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    loadActivityDetail()
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

// 考勤管理
const handleAttendance = () => {
  ElMessage.info('考勤管理功能正在开发中')
}

// 预算管理
const handleBudget = () => {
  ElMessage.info('预算管理功能正在开发中')
}

// 初始化
onMounted(() => {
  loadActivityDetail()
  loadAttendance()
})
</script>

<style scoped>
.activity-detail-container {
  padding: 20px;
}

.detail-content {
  margin-top: 20px;
}

.info-card, .stats-card, .budget-card, .attendance-card {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-item .label {
  min-width: 100px;
  font-weight: 500;
  color: #606266;
}

.info-item .value {
  flex: 1;
  color: #303133;
}

.description {
  white-space: pre-wrap;
  line-height: 1.6;
  margin-top: 8px;
}

.stats-card .stat-item {
  text-align: center;
  margin-bottom: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.budget-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.budget-item .label {
  font-weight: 500;
  color: #606266;
}

.budget-normal {
  color: #67C23A;
}

.budget-low {
  color: #E6A23C;
}

.budget-over {
  color: #F56C6C;
}

:deep(.el-card__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
}
</style>