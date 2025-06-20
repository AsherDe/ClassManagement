<template>
  <div class="course-schedule-container">
    <el-card>
      <el-page-header :icon="Calendar" title="返回" content="课程安排" @back="handleBack">
        <template #extra>
          <el-button type="primary" @click="handleAddSchedule">
            <el-icon><Plus /></el-icon>
            添加安排
          </el-button>
        </template>
      </el-page-header>
      
      <div class="schedule-content">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="日历视图" name="calendar">
            <el-calendar v-model="currentDate">
              <template #header="{ date }">
                <span>{{ date }}</span>
              </template>
              <template #date-cell="{ data }">
                <div class="date-cell" @click="handleDateClick(data.day)">
                  <p>{{ data.day.split('-').slice(2).join('-') }}</p>
                  <div v-if="getScheduleByDate(data.day).length > 0" class="schedule-items">
                    <div 
                      v-for="item in getScheduleByDate(data.day)" 
                      :key="item.id"
                      class="schedule-item"
                      @click.stop="handleScheduleClick(item)"
                    >
                      {{ item.course_name }}
                      <span class="time">{{ item.start_time }}-{{ item.end_time }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-calendar>
          </el-tab-pane>
          
          <el-tab-pane label="列表视图" name="list">
            <el-table :data="schedules" stripe v-loading="loading">
              <el-table-column prop="course_name" label="课程名称" width="150" />
              <el-table-column prop="classroom" label="教室" width="120" />
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="start_time" label="开始时间" width="100" />
              <el-table-column prop="end_time" label="结束时间" width="100" />
              <el-table-column prop="teacher" label="教师" width="100" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 添加/编辑课程安排对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="课程" prop="course_id">
          <el-select v-model="form.course_id" placeholder="请选择课程" style="width: 100%">
            <el-option 
              v-for="course in courses" 
              :key="course.id" 
              :label="course.name" 
              :value="course.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教室" prop="classroom">
          <el-input v-model="form.classroom" placeholder="请输入教室" />
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-time-picker
            v-model="form.start_time"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-time-picker
            v-model="form.end_time"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="教师" prop="teacher">
          <el-input v-model="form.teacher" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待开始" value="待开始" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已结束" value="已结束" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="form.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Plus } from '@element-plus/icons-vue'
import { courseService } from '@/services/courses'

const router = useRouter()

const currentDate = ref(new Date())
const schedules = ref([])
const courses = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const activeTab = ref('calendar')
const formRef = ref()

const form = ref({
  course_id: '',
  classroom: '',
  date: '',
  start_time: '',
  end_time: '',
  teacher: '',
  status: '待开始',
  remarks: ''
})

const rules = {
  course_id: [{ required: true, message: '请选择课程', trigger: 'change' }],
  classroom: [{ required: true, message: '请输入教室', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  teacher: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑课程安排' : '添加课程安排')

const getScheduleByDate = (date) => {
  return schedules.value.filter(item => item.date === date)
}

const getStatusType = (status) => {
  const statusMap = {
    '待开始': 'warning',
    '进行中': 'success',
    '已结束': 'info',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const loadSchedules = async () => {
  try {
    loading.value = true
    // TODO: 实现课程安排API
    // const response = await scheduleService.getSchedules()
    // schedules.value = response.data || []
    
    // 模拟数据
    schedules.value = [
      {
        id: 1,
        course_id: 1,
        course_name: '高等数学',
        classroom: 'A101',
        date: '2024-01-15',
        start_time: '08:00',
        end_time: '09:40',
        teacher: '张教授',
        status: '进行中',
        remarks: ''
      }
    ]
  } catch (error) {
    ElMessage.error('加载课程安排失败')
    console.error('Load schedules error:', error)
  } finally {
    loading.value = false
  }
}

const loadCourses = async () => {
  try {
    const response = await courseService.getCourses()
    courses.value = response.data || []
  } catch (error) {
    console.error('Load courses error:', error)
  }
}

const handleBack = () => {
  router.push('/courses')
}

const handleAddSchedule = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const handleDateClick = (date) => {
  form.value.date = date
  handleAddSchedule()
}

const handleScheduleClick = (schedule) => {
  // TODO: 显示课程安排详情
  console.log('课程安排详情', schedule)
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.keys(form.value).forEach(key => {
    if (row[key] !== undefined) {
      form.value[key] = row[key]
    }
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条课程安排吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 实现删除API
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('Delete schedule error:', error)
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // TODO: 实现课程安排创建/更新API
    if (isEdit.value) {
      ElMessage.success('更新成功')
    } else {
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    loadSchedules()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    console.error('Submit schedule error:', error)
  } finally {
    submitLoading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    course_id: '',
    classroom: '',
    date: '',
    start_time: '',
    end_time: '',
    teacher: '',
    status: '待开始',
    remarks: ''
  }
  currentId.value = null
}

onMounted(() => {
  loadSchedules()
  loadCourses()
})
</script>

<style scoped>
.course-schedule-container {
  padding: 20px;
}

.schedule-content {
  margin-top: 20px;
}

.date-cell {
  min-height: 60px;
  cursor: pointer;
}

.date-cell:hover {
  background-color: #f5f7fa;
}

.schedule-items {
  margin-top: 5px;
}

.schedule-item {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 5px;
  border-radius: 3px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: all 0.3s;
}

.schedule-item:hover {
  background: #409eff;
  color: white;
}

.schedule-item .time {
  display: block;
  font-size: 10px;
  opacity: 0.8;
}
</style>