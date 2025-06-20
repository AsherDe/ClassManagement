<template>
  <div class="grades-container">
    <el-card>
      <el-page-header :icon="DocumentChecked" title="返回" content="成绩管理">
        <template #extra>
          <el-button type="success" @click="handleBulkImport">
            <el-icon><Upload /></el-icon>
            批量导入
          </el-button>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            录入成绩
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <!-- 筛选条件 -->
        <el-row :gutter="20" class="filter-row">
          <el-col :span="6">
            <el-select v-model="filters.course_id" placeholder="选择课程" clearable @change="loadGrades">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.semester" placeholder="选择学期" clearable @change="loadGrades">
              <el-option label="2024春季" value="2024春季" />
              <el-option label="2024秋季" value="2024秋季" />
              <el-option label="2025春季" value="2025春季" />
              <el-option label="2025秋季" value="2025秋季" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input v-model="filters.student_name" placeholder="搜索学生姓名" clearable @change="loadGrades" />
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="loadGrades">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>

        <el-table :data="grades" stripe v-loading="loading">
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="student_id" label="学号" width="120" />
          <el-table-column prop="course_name" label="课程名称" width="150" />
          <el-table-column prop="score" label="成绩" width="100">
            <template #default="scope">
              <el-tag :type="getScoreType(scope.row.score)">
                {{ scope.row.score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="grade_type" label="成绩类型" width="100" />
          <el-table-column prop="semester" label="学期" width="120" />
          <el-table-column prop="academic_year" label="学年" width="120" />
          <el-table-column prop="exam_date" label="考试日期" width="120" />
          <el-table-column prop="created_at" label="录入时间" width="150" />
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

    <!-- 录入/编辑成绩对话框 -->
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
        <el-form-item label="学生" prop="student_id">
          <el-select v-model="form.student_id" placeholder="请选择学生" style="width: 100%" filterable>
            <el-option
              v-for="student in students"
              :key="student.id"
              :label="`${student.name} (${student.student_id})`"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
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
        <el-form-item label="成绩" prop="score">
          <el-input-number v-model="form.score" :min="0" :max="100" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成绩类型" prop="grade_type">
          <el-select v-model="form.grade_type" placeholder="请选择成绩类型" style="width: 100%">
            <el-option label="期末考试" value="期末考试" />
            <el-option label="期中考试" value="期中考试" />
            <el-option label="平时成绩" value="平时成绩" />
            <el-option label="作业成绩" value="作业成绩" />
            <el-option label="实验成绩" value="实验成绩" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期" prop="semester">
          <el-select v-model="form.semester" placeholder="请选择学期" style="width: 100%">
            <el-option label="2024春季" value="2024春季" />
            <el-option label="2024秋季" value="2024秋季" />
            <el-option label="2025春季" value="2025春季" />
            <el-option label="2025秋季" value="2025秋季" />
          </el-select>
        </el-form-item>
        <el-form-item label="学年" prop="academic_year">
          <el-select v-model="form.academic_year" placeholder="请选择学年" style="width: 100%">
            <el-option label="2023-2024" value="2023-2024" />
            <el-option label="2024-2025" value="2024-2025" />
            <el-option label="2025-2026" value="2025-2026" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试日期" prop="exam_date">
          <el-date-picker
            v-model="form.exam_date"
            type="date"
            placeholder="请选择考试日期"
            style="width: 100%"
          />
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

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入成绩"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <div>请下载模板文件，按照格式填写后上传。支持.xlsx和.csv格式</div>
        </el-alert>
        <el-button type="success" @click="downloadTemplate" style="margin-bottom: 20px;">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-upload
          ref="uploadRef"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.csv"
          @change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传.xlsx/.csv文件，且不超过10MB
            </div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importLoading">
          开始导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { DocumentChecked, Plus, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { gradeService } from '@/services/grades'
import { courseService } from '@/services/courses'
import { studentService } from '@/services/students'

const grades = ref([])
const courses = ref([])
const students = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const submitLoading = ref(false)
const importLoading = ref(false)
const isEdit = ref(false)
const currentId = ref(null)
const formRef = ref()
const uploadRef = ref()
const uploadFile = ref(null)

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const filters = reactive({
  course_id: '',
  semester: '',
  student_name: ''
})

const form = ref({
  student_id: '',
  course_id: '',
  score: 0,
  grade_type: '',
  semester: '',
  academic_year: '',
  exam_date: '',
  remarks: ''
})

const rules = {
  student_id: [{ required: true, message: '请选择学生', trigger: 'change' }],
  course_id: [{ required: true, message: '请选择课程', trigger: 'change' }],
  score: [{ required: true, message: '请输入成绩', trigger: 'blur' }],
  grade_type: [{ required: true, message: '请选择成绩类型', trigger: 'change' }],
  semester: [{ required: true, message: '请选择学期', trigger: 'change' }],
  academic_year: [{ required: true, message: '请选择学年', trigger: 'change' }]
}

const dialogTitle = computed(() => isEdit.value ? '编辑成绩' : '录入成绩')

const getScoreType = (score) => {
  const s = parseFloat(score)
  if (isNaN(s)) return 'info'
  if (s >= 85) return 'success'
  if (s >= 60) return 'warning'
  return 'danger'
}

const loadGrades = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    const response = await gradeService.getGrades(params)
    grades.value = response.data || []
    pagination.total = response.pagination?.total || 0
  } catch (error) {
    ElMessage.error('加载成绩数据失败')
    console.error('Load grades error:', error)
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

const loadStudents = async () => {
  try {
    const response = await studentService.getStudents()
    students.value = response.data || []
  } catch (error) {
    console.error('Load students error:', error)
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
      `确定要删除学生"${row.student_name}"在"${row.course_name}"的成绩记录吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await gradeService.deleteGrade(row.id)
    ElMessage.success('删除成功')
    loadGrades()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('Delete grade error:', error)
    }
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value) {
      await gradeService.updateGrade(currentId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await gradeService.createGrade(form.value)
      ElMessage.success('录入成功')
    }
    
    dialogVisible.value = false
    loadGrades()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '录入失败')
    console.error('Submit grade error:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleBulkImport = () => {
  importDialogVisible.value = true
}

const downloadTemplate = () => {
  // TODO: 实现模板下载
  ElMessage.info('模板下载功能待实现')
}

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const handleImport = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  try {
    importLoading.value = true
    const formData = new FormData()
    formData.append('file', uploadFile.value)
    
    // TODO: 实现批量导入API
    await gradeService.bulkImportGrades(formData)
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    loadGrades()
  } catch (error) {
    ElMessage.error('导入失败')
    console.error('Import grades error:', error)
  } finally {
    importLoading.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    student_id: '',
    course_id: '',
    score: 0,
    grade_type: '',
    semester: '',
    academic_year: '',
    exam_date: '',
    remarks: ''
  }
  currentId.value = null
}

const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = ''
  })
  loadGrades()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadGrades()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  loadGrades()
}

onMounted(() => {
  loadGrades()
  loadCourses()
  loadStudents()
})
</script>

<style scoped>
.grades-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}

.filter-row {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.import-content {
  text-align: center;
}
</style>