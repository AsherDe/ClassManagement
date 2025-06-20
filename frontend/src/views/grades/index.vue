<template>
  <div class="grades-container">
    <el-card>
      <el-page-header :icon="DocumentChecked" title="返回" content="成绩列表">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            录入成绩
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="grades" stripe v-loading="loading">
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="course_name" label="课程名称" width="150" />
          <el-table-column prop="total_score" label="成绩" width="100" />
          <el-table-column prop="semester" label="学期" width="120" />
          <el-table-column prop="academic_year" label="学年" width="120" />
          <el-table-column prop="created_at" label="录入时间" />
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
import { DocumentChecked, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { gradeService } from '@/services/grades'

const grades = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const loadGrades = async () => {
  loading.value = true
  try {
    const response = await gradeService.getGrades({
      page: pagination.page,
      limit: pagination.limit
    })
    grades.value = response.data
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载成绩数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  ElMessage.info('录入成绩功能待开发')
}

const handleEdit = (row) => {
  ElMessage.info('编辑成绩功能待开发')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条成绩记录吗？', '确认删除', {
      type: 'warning'
    })
    ElMessage.info('删除功能待开发')
  } catch {
    // 用户取消删除
  }
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
})
</script>

<style scoped>
.grades-container {
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