<template>
  <div class="courses-container">
    <el-card>
      <el-page-header :icon="Notebook" title="返回" content="课程列表">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加课程
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="courses" stripe v-loading="loading">
          <el-table-column prop="name" label="课程名称" width="200" />
          <el-table-column prop="code" label="课程代码" width="120" />
          <el-table-column prop="teacher" label="任课教师" width="120" />
          <el-table-column prop="credits" label="学分" width="80" />
          <el-table-column prop="semester" label="学期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '进行中' ? 'success' : 'info'">
                {{ scope.row.status }}
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
        </el-table>
      </div>
    </el-card>

    <!-- 添加/编辑课程对话框 -->
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
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入课程代码" />
        </el-form-item>
        <el-form-item label="任课教师" prop="teacher">
          <el-input v-model="form.teacher" placeholder="请输入任课教师" />
        </el-form-item>
        <el-form-item label="学分" prop="credits">
          <el-input-number v-model="form.credits" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="学期" prop="semester">
          <el-select v-model="form.semester" placeholder="请选择学期" style="width: 100%">
            <el-option label="2024春季" value="2024春季" />
            <el-option label="2024秋季" value="2024秋季" />
            <el-option label="2025春季" value="2025春季" />
            <el-option label="2025秋季" value="2025秋季" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="进行中" value="进行中" />
            <el-option label="已结束" value="已结束" />
            <el-option label="未开始" value="未开始" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入课程描述"
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
import { Notebook, Plus } from '@element-plus/icons-vue'
import { courseService } from '@/services/courses'

const router = useRouter()

const courses = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitLoading = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref()

const form = ref({
  name: '',
  code: '',
  teacher: '',
  credits: 1,
  semester: '',
  status: '未开始',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入任课教师', trigger: 'blur' }],
  credits: [{ required: true, message: '请输入学分', trigger: 'blur' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑课程' : '添加课程')

const loadCourses = async () => {
  try {
    loading.value = true
    const response = await courseService.getCourses()
    courses.value = response.data || []
  } catch (error) {
    ElMessage.error('加载课程列表失败')
    console.error('Load courses error:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
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
      `确定要删除课程"${row.name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await courseService.deleteCourse(row.id)
    ElMessage.success('删除成功')
    loadCourses()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('Delete course error:', error)
    }
  }
}

const handleDetail = (row) => {
  router.push(`/courses/${row.id}`)
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await courseService.updateCourse(currentId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await courseService.createCourse(form.value)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    loadCourses()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
    console.error('Submit course error:', error)
  } finally {
    submitLoading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    name: '',
    code: '',
    teacher: '',
    credits: 1,
    semester: '',
    status: '未开始',
    description: ''
  }
  currentId.value = null
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.courses-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}
</style>