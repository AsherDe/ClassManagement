<template>
  <div class="students-container">
    <el-card>
      <el-page-header :icon="UserFilled" title="返回" content="学生列表">
        <template #extra>
          <el-button 
            v-permission="'edit_students'"
            type="primary" 
            @click="handleAdd"
          >
            <el-icon><Plus /></el-icon>
            添加学生
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <!-- 搜索和筛选 -->
        <div class="search-filters">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-input
                v-model="searchForm.search"
                placeholder="搜索学生姓名或学号"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.class_id" placeholder="选择班级" clearable @change="handleSearch">
                <el-option
                  v-for="cls in classList"
                  :key="cls.id"
                  :label="cls.class_name"
                  :value="cls.id"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.status" placeholder="学生状态" clearable @change="handleSearch">
                <el-option label="在读" value="enrolled" />
                <el-option label="休学" value="suspended" />
                <el-option label="毕业" value="graduated" />
                <el-option label="退学" value="dropped" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-col>
          </el-row>
        </div>
        
        <el-table :data="students" stripe v-loading="loading">
          <el-table-column prop="student_code" label="学号" width="120" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="class_name" label="班级" width="120" />
          <el-table-column prop="phone" label="联系方式" width="140" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :type="getStatusType(scope.row.status)"
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
          
          <!-- 空状态 -->
          <template #empty>
            <el-empty 
              :image-size="200"
              description="暂无学生数据"
            >
              <el-button type="primary" @click="handleAdd">添加第一个学生</el-button>
            </el-empty>
          </template>
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
import { useRouter } from 'vue-router'
import { UserFilled, Plus, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { studentService, classService } from '@/services'

const router = useRouter()
const students = ref([])
const classList = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const searchForm = reactive({
  search: '',
  class_id: null,
  status: ''
})

const loadStudents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    // 清除空值
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key]
      }
    })

    const response = await studentService.getStudents(params)
    students.value = response.data || []
    pagination.total = response.pagination?.total || 0
  } catch (error) {
    console.error('加载学生数据失败:', error)
    ElMessage.error('加载学生数据失败: ' + error.message)
    students.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const loadClassList = async () => {
  try {
    const response = await classService.getClasses({ limit: 100 })
    classList.value = response.data || []
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

const handleAdd = () => {
  ElMessage.info('添加学生功能待开发')
}

const handleDetail = (row) => {
  router.push(`/students/${row.id}`)
}

const handleEdit = (row) => {
  ElMessage.info('编辑学生功能待开发')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除学生「${row.name}」吗？`, '确认删除', {
      type: 'warning'
    })
    ElMessage.info('删除功能待开发')
  } catch {
    // 用户取消删除
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  loadStudents()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadStudents()
}

const handleSearch = () => {
  pagination.page = 1
  loadStudents()
}

const handleReset = () => {
  searchForm.search = ''
  searchForm.class_id = null
  searchForm.status = ''
  pagination.page = 1
  loadStudents()
}

const getStatusType = (status) => {
  const statusMap = {
    enrolled: 'success',
    suspended: 'warning',
    graduated: 'info',
    dropped: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    enrolled: '在读',
    suspended: '休学',
    graduated: '毕业',
    dropped: '退学'
  }
  return statusMap[status] || status
}

onMounted(async () => {
  await Promise.all([
    loadClassList(),
    loadStudents()
  ])
})
</script>

<style scoped>
.students-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}

.search-filters {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>