<template>
  <div class="attendance-container">
    <el-card>
      <el-page-header :icon="Timer" title="返回" content="考勤记录">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            记录考勤
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="attendances" stripe v-loading="loading">
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="event_name" label="课程/活动" width="150" />
          <el-table-column prop="attendance_date" label="日期" width="120" />
          <el-table-column prop="status" label="考勤状态" width="120">
            <template #default="scope">
              <el-tag 
                :type="getStatusType(scope.row.status)"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Timer, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { attendanceService } from '@/services/attendance'

const attendances = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const getStatusType = (status) => {
  const statusMap = {
    'present': 'success',
    'late': 'warning', 
    'absent': 'danger',
    'leave': 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'present': '出勤',
    'late': '迟到',
    'absent': '缺勤', 
    'leave': '请假'
  }
  return statusMap[status] || status
}

const loadAttendances = async () => {
  loading.value = true
  try {
    const response = await attendanceService.getAttendanceList({
      page: pagination.page,
      limit: pagination.limit
    })
    attendances.value = response.data
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载考勤数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  ElMessage.info('考勤记录功能待开发')
}

const handleEdit = (row) => {
  ElMessage.info('编辑考勤功能待开发')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条考勤记录吗？', '确认删除', {
      type: 'warning'
    })
    ElMessage.info('删除功能待开发')
  } catch {
    // 用户取消删除
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadAttendances()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadAttendances()
}

onMounted(() => {
  loadAttendances()
})
</script>

<style scoped>
.attendance-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>