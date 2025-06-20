<template>
  <div class="teachers-container">
    <div class="page-header">
      <div class="header-left">
        <h2>教师管理</h2>
        <p>管理系统中的教师信息</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加教师
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索教师姓名、工号"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
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
        <el-table-column prop="teacher_id" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="140" />
        <el-table-column prop="department" label="院系" width="150" />
        <el-table-column prop="title" label="职称" width="120" />
        <el-table-column prop="hire_date" label="入职日期" width="120">
          <template #default="scope">
            {{ formatDate(scope.row.hire_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
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
      :title="editingTeacher ? '编辑教师' : '添加教师'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="teacherFormRef"
        :model="teacherForm"
        :rules="teacherFormRules"
        label-width="80px"
      >
        <el-form-item label="工号" prop="teacher_id">
          <el-input v-model="teacherForm.teacher_id" placeholder="请输入教师工号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="teacherForm.name" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="teacherForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="teacherForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="院系" prop="department">
          <el-input v-model="teacherForm.department" placeholder="请输入所属院系" />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="teacherForm.title" placeholder="请选择职称">
            <el-option label="教授" value="教授" />
            <el-option label="副教授" value="副教授" />
            <el-option label="讲师" value="讲师" />
            <el-option label="助教" value="助教" />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期" prop="hire_date">
          <el-date-picker
            v-model="teacherForm.hire_date"
            type="date"
            placeholder="请选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="teacherForm.status">
            <el-radio label="active">在职</el-radio>
            <el-radio label="inactive">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const editingTeacher = ref(null)
const teacherFormRef = ref()

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const tableData = ref([])

const teacherForm = reactive({
  teacher_id: '',
  name: '',
  email: '',
  phone: '',
  department: '',
  title: '',
  hire_date: '',
  status: 'active'
})

const teacherFormRules = {
  teacher_id: [
    { required: true, message: '请输入教师工号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入教师姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请输入所属院系', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请选择职称', trigger: 'change' }
  ],
  hire_date: [
    { required: true, message: '请选择入职日期', trigger: 'change' }
  ]
}

const fetchTeachers = async () => {
  loading.value = true
  try {
    const mockData = [
      {
        id: 1,
        teacher_id: 'T001',
        name: '张教授',
        email: 'zhang@example.com',
        phone: '13800138001',
        department: '计算机学院',
        title: '教授',
        hire_date: '2010-03-15',
        status: 'active'
      },
      {
        id: 2,
        teacher_id: 'T002',
        name: '李副教授',
        email: 'li@example.com',
        phone: '13800138002',
        department: '计算机学院',
        title: '副教授',
        hire_date: '2015-09-01',
        status: 'active'
      }
    ]
    
    tableData.value = mockData
    pagination.total = mockData.length
  } catch (error) {
    console.error('获取教师列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchTeachers()
}

const handleReset = () => {
  searchForm.keyword = ''
  pagination.current = 1
  fetchTeachers()
}

const handleSizeChange = (val) => {
  pagination.size = val
  pagination.current = 1
  fetchTeachers()
}

const handleCurrentChange = (val) => {
  pagination.current = val
  fetchTeachers()
}

const handleEdit = (row) => {
  editingTeacher.value = row
  Object.assign(teacherForm, {
    ...row,
    hire_date: new Date(row.hire_date)
  })
  showAddDialog.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除教师 ${row.name} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
    fetchTeachers()
  } catch (error) {
    console.log('取消删除')
  }
}

const handleSubmit = async () => {
  if (!teacherFormRef.value) return
  
  try {
    await teacherFormRef.value.validate()
    submitting.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(editingTeacher.value ? '更新成功' : '添加成功')
    showAddDialog.value = false
    fetchTeachers()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  editingTeacher.value = null
  Object.assign(teacherForm, {
    teacher_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    title: '',
    hire_date: '',
    status: 'active'
  })
  teacherFormRef.value?.clearValidate()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  fetchTeachers()
})
</script>

<style scoped>
.teachers-container {
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
</style>