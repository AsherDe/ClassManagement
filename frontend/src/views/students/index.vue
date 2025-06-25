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
    
    <!-- 编辑学生对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑学生信息"
      width="600px"
      :before-close="handleEditCancel"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="editForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="editForm.gender" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期" prop="birth_date">
              <el-date-picker
                v-model="editForm.birth_date"
                type="date"
                placeholder="请选择出生日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="在读" value="enrolled" />
                <el-option label="休学" value="suspended" />
                <el-option label="毕业" value="graduated" />
                <el-option label="退学" value="dropped" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="editForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="家庭住址" prop="home_address">
          <el-input
            v-model="editForm.home_address"
            type="textarea"
            :rows="2"
            placeholder="请输入家庭住址"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="紧急联系人" prop="emergency_contact">
              <el-input v-model="editForm.emergency_contact" placeholder="请输入紧急联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系电话" prop="emergency_phone">
              <el-input v-model="editForm.emergency_phone" placeholder="请输入紧急联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleEditCancel">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确认</el-button>
        </div>
      </template>
    </el-dialog>
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

const editDialogVisible = ref(false)
const editForm = ref({
  id: null,
  name: '',
  gender: '',
  birth_date: '',
  phone: '',
  email: '',
  home_address: '',
  emergency_contact: '',
  emergency_phone: '',
  status: 'enrolled'
})
const editFormRef = ref()
const editRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  emergency_phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的紧急联系人电话', trigger: 'blur' }]
}

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
  editForm.value = { ...row }
  editDialogVisible.value = true
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

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  
  try {
    const valid = await editFormRef.value.validate()
    if (!valid) return
    
    const { id, ...updateData } = editForm.value
    
    // 格式化日期
    if (updateData.birth_date) {
      updateData.birth_date = new Date(updateData.birth_date).toISOString().split('T')[0]
    }
    
    await studentService.updateStudent(id, updateData)
    ElMessage.success('学生信息更新成功')
    editDialogVisible.value = false
    loadStudents()
  } catch (error) {
    console.error('更新学生信息失败:', error)
    ElMessage.error('更新学生信息失败: ' + error.message)
  }
}

const handleEditCancel = () => {
  editDialogVisible.value = false
  editFormRef.value?.resetFields()
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