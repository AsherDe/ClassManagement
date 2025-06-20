<template>
  <div class="course-detail-container">
    <el-card v-loading="loading">
      <el-page-header :icon="ArrowLeft" title="返回" content="课程详情" @back="handleBack">
        <template #extra>
          <el-button type="primary" @click="handleEdit">
            <el-icon><Edit /></el-icon>
            编辑课程
          </el-button>
        </template>
      </el-page-header>

      <div class="detail-content" v-if="course">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>基本信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="课程名称">{{ course.name }}</el-descriptions-item>
                <el-descriptions-item label="课程代码">{{ course.code }}</el-descriptions-item>
                <el-descriptions-item label="任课教师">{{ course.teacher }}</el-descriptions-item>
                <el-descriptions-item label="学分">{{ course.credits }}</el-descriptions-item>
                <el-descriptions-item label="学期">{{ course.semester }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="course.status === '进行中' ? 'success' : course.status === '已结束' ? 'info' : 'warning'">
                    {{ course.status }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="课程描述" :span="2">
                  {{ course.description || '暂无描述' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>课程成绩</span>
                  <el-button size="small" @click="loadGrades">刷新</el-button>
                </div>
              </template>
              <el-table :data="grades" stripe v-loading="gradesLoading">
                <el-table-column prop="student_name" label="学生姓名" width="120" />
                <el-table-column prop="student_id" label="学号" width="120" />
                <el-table-column prop="score" label="成绩" width="80">
                  <template #default="scope">
                    <el-tag :type="getScoreType(scope.row.score)">
                      {{ scope.row.score }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="grade_type" label="成绩类型" width="100" />
                <el-table-column prop="exam_date" label="考试日期" width="120" />
                <el-table-column prop="remarks" label="备注" show-overflow-tooltip />
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <span>统计信息</span>
                </div>
              </template>
              <div class="stats-container">
                <el-statistic title="总学生数" :value="stats.totalStudents" />
                <el-statistic title="平均成绩" :value="stats.averageScore" :precision="1" />
                <el-statistic title="及格率" :value="stats.passRate" suffix="%" :precision="1" />
                <el-statistic title="优秀率" :value="stats.excellentRate" suffix="%" :precision="1" />
              </div>
            </el-card>

            <el-card shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>快速操作</span>
                </div>
              </template>
              <div class="quick-actions">
                <el-button type="primary" block @click="handleGradeEntry">录入成绩</el-button>
                <el-button type="success" block @click="handleBulkImport" style="margin-top: 10px;">批量导入</el-button>
                <el-button type="info" block @click="handleViewStats" style="margin-top: 10px;">查看统计</el-button>
                <el-button type="warning" block @click="handleSchedule" style="margin-top: 10px;">课程安排</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { courseService } from '@/services/courses'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const gradesLoading = ref(false)
const course = ref(null)
const grades = ref([])

const stats = computed(() => {
  if (!grades.value.length) {
    return {
      totalStudents: 0,
      averageScore: 0,
      passRate: 0,
      excellentRate: 0
    }
  }

  const total = grades.value.length
  const scores = grades.value.map(g => parseFloat(g.score)).filter(s => !isNaN(s))
  const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const passCount = scores.filter(s => s >= 60).length
  const excellentCount = scores.filter(s => s >= 85).length

  return {
    totalStudents: total,
    averageScore,
    passRate: total ? (passCount / total) * 100 : 0,
    excellentRate: total ? (excellentCount / total) * 100 : 0
  }
})

const getScoreType = (score) => {
  const s = parseFloat(score)
  if (isNaN(s)) return 'info'
  if (s >= 85) return 'success'
  if (s >= 60) return 'warning'
  return 'danger'
}

const loadCourse = async () => {
  try {
    loading.value = true
    const response = await courseService.getCourseById(route.params.id)
    course.value = response.data
  } catch (error) {
    ElMessage.error('加载课程详情失败')
    console.error('Load course error:', error)
  } finally {
    loading.value = false
  }
}

const loadGrades = async () => {
  try {
    gradesLoading.value = true
    const response = await courseService.getCourseGrades(route.params.id)
    grades.value = response.data || []
  } catch (error) {
    ElMessage.error('加载成绩数据失败')
    console.error('Load grades error:', error)
  } finally {
    gradesLoading.value = false
  }
}

const handleBack = () => {
  router.push('/courses')
}

const handleEdit = () => {
  // TODO: 打开编辑对话框或跳转到编辑页面
  console.log('编辑课程', course.value)
}

const handleGradeEntry = () => {
  // TODO: 跳转到成绩录入页面
  console.log('录入成绩')
}

const handleBulkImport = () => {
  // TODO: 打开批量导入对话框
  console.log('批量导入成绩')
}

const handleViewStats = () => {
  // TODO: 跳转到成绩统计页面
  console.log('查看统计')
}

const handleSchedule = () => {
  router.push('/courses/schedule')
}

onMounted(() => {
  loadCourse()
  loadGrades()
})
</script>

<style scoped>
.course-detail-container {
  padding: 20px;
}

.detail-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}
</style>