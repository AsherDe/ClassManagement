<template>
  <div class="notifications-container">
    <div class="page-header">
      <div class="header-left">
        <h2>通知管理</h2>
        <p>管理系统通知和公告</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          发布通知
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索通知标题、内容"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已撤回" value="withdrawn" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.type" placeholder="类型" clearable>
            <el-option label="系统通知" value="system" />
            <el-option label="重要公告" value="announcement" />
            <el-option label="活动通知" value="activity" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <div class="notification-title">
              <el-icon v-if="scope.row.is_important" color="#f56c6c" class="important-icon">
                <Warning />
              </el-icon>
              {{ scope.row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_type" label="目标" width="120">
          <template #default="scope">
            {{ getTargetLabel(scope.row.target_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="published_at" label="发布时间" width="160">
          <template #default="scope">
            {{ scope.row.published_at ? formatDateTime(scope.row.published_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleView(scope.row)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              type="success"
              size="small"
              @click="handlePublish(scope.row)"
            >
              发布
            </el-button>
            <el-button
              v-if="scope.row.status === 'published'"
              type="warning"
              size="small"
              @click="handleWithdraw(scope.row)"
            >
              撤回
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="showAddDialog"
      :title="editingNotification ? '编辑通知' : '发布通知'"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="notificationFormRef"
        :model="notificationForm"
        :rules="notificationFormRules"
        label-width="100px"
      >
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="notificationForm.title"
            placeholder="请输入通知标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="notificationForm.type" placeholder="请选择通知类型">
            <el-option label="系统通知" value="system" />
            <el-option label="重要公告" value="announcement" />
            <el-option label="活动通知" value="activity" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标对象" prop="target_type">
          <el-select v-model="notificationForm.target_type" placeholder="请选择目标对象">
            <el-option label="全体用户" value="all" />
            <el-option label="指定班级" value="class" />
            <el-option label="指定学生" value="student" />
            <el-option label="教师" value="teacher" />
          </el-select>
        </el-form-item>
        <el-form-item label="重要程度">
          <el-switch
            v-model="notificationForm.is_important"
            active-text="重要"
            inactive-text="普通"
          />
        </el-form-item>
        <el-form-item label="通知内容" prop="content">
          <el-input
            v-model="notificationForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入通知内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="定时发布">
          <el-switch
            v-model="notificationForm.is_scheduled"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item v-if="notificationForm.is_scheduled" label="发布时间" prop="scheduled_at">
          <el-date-picker
            v-model="notificationForm.scheduled_at"
            type="datetime"
            placeholder="请选择发布时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button @click="handleSaveDraft" :loading="submitting">
          保存草稿
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ notificationForm.is_scheduled ? '定时发布' : '立即发布' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showViewDialog"
      :title="viewingNotification?.title"
      width="600px"
    >
      <div v-if="viewingNotification" class="notification-detail">
        <div class="detail-item">
          <span class="label">类型：</span>
          <el-tag :type="getTypeTagType(viewingNotification.type)">
            {{ getTypeLabel(viewingNotification.type) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="label">状态：</span>
          <el-tag :type="getStatusTagType(viewingNotification.status)">
            {{ getStatusLabel(viewingNotification.status) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="label">目标对象：</span>
          {{ getTargetLabel(viewingNotification.target_type) }}
        </div>
        <div class="detail-item">
          <span class="label">重要程度：</span>
          <el-tag :type="viewingNotification.is_important ? 'danger' : 'info'">
            {{ viewingNotification.is_important ? '重要' : '普通' }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="label">创建时间：</span>
          {{ formatDateTime(viewingNotification.created_at) }}
        </div>
        <div v-if="viewingNotification.published_at" class="detail-item">
          <span class="label">发布时间：</span>
          {{ formatDateTime(viewingNotification.published_at) }}
        </div>
        <div class="content-section">
          <div class="label">通知内容：</div>
          <div class="content">{{ viewingNotification.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Warning } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const showViewDialog = ref(false)
const editingNotification = ref(null)
const viewingNotification = ref(null)
const notificationFormRef = ref()

const searchForm = reactive({
  keyword: '',
  status: '',
  type: ''
})

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const tableData = ref([])

const notificationForm = reactive({
  title: '',
  type: '',
  target_type: '',
  content: '',
  is_important: false,
  is_scheduled: false,
  scheduled_at: ''
})

const notificationFormRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  target_type: [
    { required: true, message: '请选择目标对象', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' }
  ],
  scheduled_at: [
    { required: true, message: '请选择发布时间', trigger: 'change' }
  ]
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const mockData = [
      {
        id: 1,
        title: '期末考试安排通知',
        type: 'announcement',
        status: 'published',
        target_type: 'all',
        content: '各位同学，期末考试将于下周开始，请做好复习准备...',
        is_important: true,
        created_at: '2024-01-15 10:00:00',
        published_at: '2024-01-15 14:00:00'
      },
      {
        id: 2,
        title: '班级活动报名通知',
        type: 'activity',
        status: 'published',
        target_type: 'class',
        content: '本周六将举办班级团建活动，欢迎大家积极参与...',
        is_important: false,
        created_at: '2024-01-14 09:30:00',
        published_at: '2024-01-14 15:30:00'
      },
      {
        id: 3,
        title: '系统维护通知',
        type: 'system',
        status: 'draft',
        target_type: 'all',
        content: '系统将于本周日进行维护升级，届时将暂停服务...',
        is_important: false,
        created_at: '2024-01-13 16:20:00',
        published_at: null
      }
    ]
    
    tableData.value = mockData
    pagination.total = mockData.length
  } catch (error) {
    console.error('获取通知列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchNotifications()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    type: ''
  })
  pagination.current = 1
  fetchNotifications()
}

const handleSizeChange = (val) => {
  pagination.size = val
  pagination.current = 1
  fetchNotifications()
}

const handleCurrentChange = (val) => {
  pagination.current = val
  fetchNotifications()
}

const handleView = (row) => {
  viewingNotification.value = row
  showViewDialog.value = true
}

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布通知 "${row.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    ElMessage.success('通知发布成功')
    fetchNotifications()
  } catch (error) {
    console.log('取消发布')
  }
}

const handleWithdraw = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤回通知 "${row.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('通知撤回成功')
    fetchNotifications()
  } catch (error) {
    console.log('取消撤回')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除通知 "${row.title}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
    fetchNotifications()
  } catch (error) {
    console.log('取消删除')
  }
}

const handleSaveDraft = async () => {
  if (!notificationFormRef.value) return
  
  try {
    const rules = { ...notificationFormRules }
    delete rules.scheduled_at
    
    await notificationFormRef.value.validate()
    submitting.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('草稿保存成功')
    showAddDialog.value = false
    fetchNotifications()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  if (!notificationFormRef.value) return
  
  try {
    await notificationFormRef.value.validate()
    submitting.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(notificationForm.is_scheduled ? '定时发布设置成功' : '通知发布成功')
    showAddDialog.value = false
    fetchNotifications()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  editingNotification.value = null
  Object.assign(notificationForm, {
    title: '',
    type: '',
    target_type: '',
    content: '',
    is_important: false,
    is_scheduled: false,
    scheduled_at: ''
  })
  notificationFormRef.value?.clearValidate()
}

const getTypeTagType = (type) => {
  const typeMap = {
    system: 'info',
    announcement: 'danger',
    activity: 'success',
    other: 'warning'
  }
  return typeMap[type] || 'info'
}

const getTypeLabel = (type) => {
  const typeMap = {
    system: '系统通知',
    announcement: '重要公告',
    activity: '活动通知',
    other: '其他'
  }
  return typeMap[type] || type
}

const getStatusTagType = (status) => {
  const statusMap = {
    draft: 'info',
    published: 'success',
    withdrawn: 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const statusMap = {
    draft: '草稿',
    published: '已发布',
    withdrawn: '已撤回'
  }
  return statusMap[status] || status
}

const getTargetLabel = (target) => {
  const targetMap = {
    all: '全体用户',
    class: '指定班级',
    student: '指定学生',
    teacher: '教师'
  }
  return targetMap[target] || target
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString()
}

onMounted(() => {
  fetchNotifications()
})
</script>

<style scoped>
.notifications-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-bar {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.search-form {
  margin: 0;
}

.table-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.important-icon {
  font-size: 16px;
}

.notification-detail {
  line-height: 1.8;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.content-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.label {
  font-weight: 600;
  color: #606266;
  min-width: 80px;
  margin-right: 8px;
}

.content {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>