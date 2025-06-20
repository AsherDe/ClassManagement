<template>
  <div class="activities-container">
    <el-card>
      <el-page-header :icon="Trophy" title="返回" content="班级活动管理">
        <template #extra>
          <el-button type="primary" @click="handleAdd" :loading="loading">
            <el-icon><Plus /></el-icon>
            添加活动
          </el-button>
        </template>
      </el-page-header>
      
      <!-- 搜索筛选区域 -->
      <div class="search-wrapper">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="filters.activity_type" placeholder="活动类型" clearable @change="loadActivities">
              <el-option label="学习活动" value="学习" />
              <el-option label="文体活动" value="文体" />
              <el-option label="志愿活动" value="志愿" />
              <el-option label="聚会活动" value="聚会" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.status" placeholder="活动状态" clearable @change="loadActivities">
              <el-option label="计划中" value="planned" />
              <el-option label="进行中" value="ongoing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input v-model="searchKeyword" placeholder="搜索活动名称" clearable @keyup.enter="loadActivities">
              <template #append>
                <el-button @click="loadActivities" :loading="loading">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>
      
      <!-- 数据表格 -->
      <div class="content-wrapper">
        <el-table :data="activities" stripe v-loading="loading">
          <el-table-column prop="activity_name" label="活动名称" width="200" show-overflow-tooltip />
          <el-table-column prop="activity_type" label="活动类型" width="120">
            <template #default="scope">
              <el-tag :type="getTypeColor(scope.row.activity_type)" size="small">
                {{ scope.row.activity_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="start_time" label="开始时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.start_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="end_time" label="结束时间" width="180">
            <template #default="scope">
              {{ scope.row.end_time ? formatDate(scope.row.end_time) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="location" label="活动地点" show-overflow-tooltip />
          <el-table-column prop="participant_count" label="参与人数" width="100" align="center" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)" size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)" :disabled="scope.row.status === 'ongoing'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 添加/编辑活动对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑活动' : '添加活动'" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-width="120px"
        label-position="left"
      >
        <el-form-item label="活动名称" prop="activity_name">
          <el-input v-model="form.activity_name" placeholder="请输入活动名称" maxlength="200" show-word-limit />
        </el-form-item>
        
        <el-form-item label="活动类型" prop="activity_type">
          <el-select v-model="form.activity_type" placeholder="请选择活动类型" style="width: 100%">
            <el-option label="学习活动" value="学习" />
            <el-option label="文体活动" value="文体" />
            <el-option label="志愿活动" value="志愿" />
            <el-option label="聚会活动" value="聚会" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="班级" prop="class_id">
          <el-select v-model="form.class_id" placeholder="请选择班级" style="width: 100%" filterable>
            <el-option 
              v-for="cls in classes" 
              :key="cls.id" 
              :label="`${cls.class_name} (${cls.class_code})`" 
              :value="cls.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker
                v-model="form.start_time"
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
                v-model="form.end_time"
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
          <el-input v-model="form.location" placeholder="请输入活动地点" maxlength="200" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预算金额" prop="budget_amount">
              <el-input-number 
                v-model="form.budget_amount" 
                :min="0" 
                :precision="2" 
                style="width: 100%"
                placeholder="预算金额"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织者" prop="organizer_id">
              <el-select v-model="form.organizer_id" placeholder="选择组织者" style="width: 100%" filterable clearable>
                <el-option 
                  v-for="student in students" 
                  :key="student.id" 
                  :label="`${student.name} (${student.student_code})`" 
                  :value="student.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="活动描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入活动描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="是否必须参加">
          <el-switch v-model="form.required_attendance" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" :disabled="submitLoading">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Trophy, Plus, Search } from '@element-plus/icons-vue'
import { activityService } from '@/services/activities'
import { classService } from '@/services/classes'
import { studentService } from '@/services/students'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const activities = ref([])
const classes = ref([])
const students = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const submitLoading = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')

// 分页数据
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 筛选条件
const filters = reactive({
  activity_type: '',
  status: ''
})

// 表单数据
const form = reactive({
  class_id: '',
  activity_name: '',
  activity_type: '',
  description: '',
  location: '',
  start_time: '',
  end_time: '',
  organizer_id: '',
  budget_amount: 0,
  required_attendance: false
})

// 表单验证规则
const rules = {
  activity_name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 200, message: '活动名称长度在 2 到 200 个字符', trigger: 'blur' }
  ],
  activity_type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  class_id: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  location: [
    { max: 200, message: '活动地点长度不能超过 200 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '活动描述长度不能超过 500 个字符', trigger: 'blur' }
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

// 加载活动数据
const loadActivities = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }
    
    const response = await activityService.getActivities(params)
    activities.value = response.data.data || []
    pagination.total = response.data.pagination?.total || 0
  } catch (error) {
    console.error('加载活动数据失败:', error)
    ElMessage.error('加载活动数据失败')
  } finally {
    loading.value = false
  }
}

// 加载班级数据
const loadClasses = async () => {
  try {
    const response = await classService.getClasses({ limit: 1000 })
    classes.value = response.data.data || []
  } catch (error) {
    console.error('加载班级数据失败:', error)
  }
}

// 加载学生数据
const loadStudents = async () => {
  try {
    const response = await studentService.getStudents({ limit: 1000 })
    students.value = response.data.data || []
  } catch (error) {
    console.error('加载学生数据失败:', error)
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    class_id: '',
    activity_name: '',
    activity_type: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    organizer_id: '',
    budget_amount: 0,
    required_attendance: false
  })
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

// 重置筛选条件
const resetFilters = () => {
  filters.activity_type = ''
  filters.status = ''
  searchKeyword.value = ''
  pagination.page = 1
  loadActivities()
}

// 分页变化处理
const handlePageChange = (page) => {
  pagination.page = page
  loadActivities()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadActivities()
}

// 添加活动
const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑活动
const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  
  // 填充表单数据
  Object.assign(form, {
    class_id: row.class_id,
    activity_name: row.activity_name,
    activity_type: row.activity_type,
    description: row.description || '',
    location: row.location || '',
    start_time: row.start_time,
    end_time: row.end_time || '',
    organizer_id: row.organizer_id || '',
    budget_amount: row.budget_amount || 0,
    required_attendance: row.required_attendance || false
  })
  
  dialogVisible.value = true
}

// 删除活动
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除活动 "${row.activity_name}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await activityService.deleteActivity(row.id)
      ElMessage.success('删除成功')
      loadActivities()
    } catch (error) {
      console.error('删除活动失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 查看详情
const handleDetail = (row) => {
  router.push(`/activities/${row.id}`)
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const submitData = { ...form }
    
    if (isEdit.value) {
      await activityService.updateActivity(currentId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      await activityService.createActivity(submitData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadActivities()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

// 初始化数据
onMounted(() => {
  loadActivities()
  loadClasses()
  loadStudents()
})
</script>

<style scoped>
.activities-container {
  padding: 20px;
}

.search-wrapper {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.content-wrapper {
  margin-top: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
}

:deep(.el-pagination) {
  justify-content: flex-end;
}
</style>