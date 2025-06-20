<template>
  <div class="grade-statistics-container">
    <el-card>
      <el-page-header :icon="TrendCharts" title="返回" content="成绩统计" @back="handleBack">
        <template #extra>
          <el-button type="primary" @click="exportReport">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
        </template>
      </el-page-header>
      
      <div class="statistics-content">
        <!-- 筛选条件 -->
        <el-row :gutter="20" class="filter-row">
          <el-col :span="6">
            <el-select v-model="filters.course_id" placeholder="选择课程" clearable @change="loadStatistics">
              <el-option
                v-for="course in courses"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.semester" placeholder="选择学期" clearable @change="loadStatistics">
              <el-option label="2024春季" value="2024春季" />
              <el-option label="2024秋季" value="2024秋季" />
              <el-option label="2025春季" value="2025春季" />
              <el-option label="2025秋季" value="2025秋季" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.grade_type" placeholder="成绩类型" clearable @change="loadStatistics">
              <el-option label="期末考试" value="期末考试" />
              <el-option label="期中考试" value="期中考试" />
              <el-option label="平时成绩" value="平时成绩" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="loadStatistics">刷新数据</el-button>
          </el-col>
        </el-row>

        <!-- 统计概览 -->
        <el-row :gutter="20" class="stats-overview">
          <el-col :span="6">
            <el-statistic title="总学生数" :value="overview.totalStudents" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="平均成绩" :value="overview.averageScore" :precision="1" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="及格率" :value="overview.passRate" suffix="%" :precision="1" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="优秀率" :value="overview.excellentRate" suffix="%" :precision="1" />
          </el-col>
        </el-row>

        <!-- 图表展示 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" v-loading="chartLoading">
              <template #header>
                <div class="card-header">
                  <span>成绩分布</span>
                  <el-select v-model="chartType" size="small" @change="updateCharts">
                    <el-option label="柱状图" value="bar" />
                    <el-option label="饼图" value="pie" />
                  </el-select>
                </div>
              </template>
              <div ref="gradeChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" v-loading="chartLoading">
              <template #header>
                <div class="card-header">
                  <span>课程平均分对比</span>
                </div>
              </template>
              <div ref="courseChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card shadow="hover" v-loading="chartLoading">
              <template #header>
                <div class="card-header">
                  <span>成绩趋势</span>
                </div>
              </template>
              <div ref="trendChartRef" style="height: 350px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>成绩详细统计</span>
                </div>
              </template>
              <el-table :data="detailStats" height="350">
                <el-table-column prop="range" label="分数段" />
                <el-table-column prop="count" label="人数" />
                <el-table-column prop="percentage" label="占比">
                  <template #default="scope">
                    {{ scope.row.percentage }}%
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { gradeService } from '@/services/grades'
import { courseService } from '@/services/courses'

const router = useRouter()

const gradeChartRef = ref()
const courseChartRef = ref()
const trendChartRef = ref()
const chartLoading = ref(false)
const chartType = ref('bar')

const courses = ref([])
const filters = reactive({
  course_id: '',
  semester: '',
  grade_type: ''
})

const overview = reactive({
  totalStudents: 0,
  averageScore: 0,
  passRate: 0,
  excellentRate: 0
})

const detailStats = ref([
  { range: '90-100', count: 0, percentage: 0 },
  { range: '80-89', count: 0, percentage: 0 },
  { range: '70-79', count: 0, percentage: 0 },
  { range: '60-69', count: 0, percentage: 0 },
  { range: '0-59', count: 0, percentage: 0 }
])

let gradeChart = null
let courseChart = null
let trendChart = null

const loadCourses = async () => {
  try {
    const response = await courseService.getCourses()
    courses.value = response.data || []
  } catch (error) {
    console.error('Load courses error:', error)
  }
}

const loadStatistics = async () => {
  try {
    chartLoading.value = true
    
    // 模拟统计数据
    const mockData = {
      overview: {
        totalStudents: 120,
        averageScore: 76.5,
        passRate: 85.2,
        excellentRate: 23.5
      },
      gradeDistribution: [
        { name: '优秀(90-100)', value: 28, count: 28 },
        { name: '良好(80-89)', value: 45, count: 45 },
        { name: '中等(70-79)', value: 32, count: 32 },
        { name: '及格(60-69)', value: 10, count: 10 },
        { name: '不及格(0-59)', value: 5, count: 5 }
      ],
      courseComparison: [
        { course: '高等数学', average: 78.5 },
        { course: '线性代数', average: 82.3 },
        { course: '概率论', average: 75.8 },
        { course: '数据结构', average: 80.1 },
        { course: '操作系统', average: 77.2 }
      ],
      trend: [
        { date: '2024-01', score: 75.2 },
        { date: '2024-02', score: 76.8 },
        { date: '2024-03', score: 78.1 },
        { date: '2024-04', score: 76.5 },
        { date: '2024-05', score: 79.3 },
        { date: '2024-06', score: 80.2 }
      ]
    }

    // 更新概览数据
    Object.assign(overview, mockData.overview)
    
    // 更新详细统计
    const total = mockData.gradeDistribution.reduce((sum, item) => sum + item.count, 0)
    detailStats.value = mockData.gradeDistribution.map(item => ({
      range: item.name.match(/\((.*?)\)/)[1],
      count: item.count,
      percentage: ((item.count / total) * 100).toFixed(1)
    }))

    await nextTick()
    initCharts(mockData)
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error('Load statistics error:', error)
  } finally {
    chartLoading.value = false
  }
}

const initCharts = (data) => {
  initGradeChart(data.gradeDistribution)
  initCourseChart(data.courseComparison)
  initTrendChart(data.trend)
}

const initGradeChart = (data) => {
  if (gradeChart) {
    gradeChart.dispose()
  }
  
  gradeChart = echarts.init(gradeChartRef.value)
  
  const option = chartType.value === 'bar' ? {
    title: {
      text: '成绩分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}人'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [{
      data: data.map(item => item.count),
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  } : {
    title: {
      text: '成绩分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '成绩分布',
      type: 'pie',
      radius: '50%',
      data: data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  gradeChart.setOption(option)
}

const initCourseChart = (data) => {
  if (courseChart) {
    courseChart.dispose()
  }
  
  courseChart = echarts.init(courseChartRef.value)
  
  const option = {
    title: {
      text: '课程平均分对比',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}分'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.course),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      min: 60,
      max: 100
    },
    series: [{
      data: data.map(item => item.average),
      type: 'bar',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#ffc069' },
          { offset: 0.5, color: '#ff7875' },
          { offset: 1, color: '#ff4d4f' }
        ])
      }
    }]
  }
  
  courseChart.setOption(option)
}

const initTrendChart = (data) => {
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const option = {
    title: {
      text: '成绩趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}分'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      min: 70,
      max: 85
    },
    series: [{
      data: data.map(item => item.score),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#52c41a'
      },
      itemStyle: {
        color: '#52c41a'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
          { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
        ])
      }
    }]
  }
  
  trendChart.setOption(option)
}

const updateCharts = () => {
  loadStatistics()
}

const handleBack = () => {
  router.push('/grades')
}

const exportReport = () => {
  ElMessage.info('导出报告功能待实现')
}

// 响应式处理
const handleResize = () => {
  gradeChart?.resize()
  courseChart?.resize()
  trendChart?.resize()
}

onMounted(async () => {
  await loadCourses()
  await loadStatistics()
  
  window.addEventListener('resize', handleResize)
})

// 组件销毁时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  gradeChart?.dispose()
  courseChart?.dispose()
  trendChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.grade-statistics-container {
  padding: 20px;
}

.statistics-content {
  margin-top: 20px;
}

.filter-row {
  margin-bottom: 20px;
}

.stats-overview {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.stats-overview :deep(.el-statistic__content) {
  color: white;
}

.stats-overview :deep(.el-statistic__head) {
  color: rgba(255, 255, 255, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>