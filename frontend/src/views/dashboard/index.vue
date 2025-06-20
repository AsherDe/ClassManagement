<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">仪表盘</h1>
      <p class="page-description">石河子大学班级事务管理系统总览</p>
    </div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="stat-change" :class="stat.trend">
              <el-icon>
                <ArrowUp v-if="stat.trend === 'up'" />
                <ArrowDown v-else />
              </el-icon>
              {{ stat.change }}
            </span>
            <span class="stat-period">相比上月</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card title="成绩分布统计" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>成绩分布统计</span>
              <el-button type="text" @click="refreshGradeChart">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <div v-if="gradeChartLoading" class="loading-container">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <v-chart
              v-else
              class="chart"
              :option="gradeChartOption"
              autoresize
            />
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card title="考勤统计" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>考勤统计</span>
              <el-button type="text" @click="refreshAttendanceChart">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <div v-if="attendanceChartLoading" class="loading-container">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <v-chart
              v-else
              class="chart"
              :option="attendanceChartOption"
              autoresize
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快速操作和最新动态 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :span="8">
        <el-card title="快速操作" class="quick-actions-card">
          <div class="quick-actions">
            <el-button
              v-for="action in quickActions"
              :key="action.name"
              :type="action.type"
              :icon="action.icon"
              class="action-button"
              @click="handleQuickAction(action.path)"
            >
              {{ action.name }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card title="数据库特性展示" class="features-card">
          <div class="database-features">
            <div v-for="feature in databaseFeatures" :key="feature.name" class="feature-item">
              <el-tag :type="feature.type" size="small">{{ feature.name }}</el-tag>
              <span class="feature-desc">{{ feature.description }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card title="系统信息" class="system-info-card">
          <div class="system-info" v-loading="systemInfoLoading">
            <div v-for="info in systemInfo" :key="info.label" class="info-item">
              <span class="info-label">{{ info.label }}:</span>
              <span class="info-value">{{ info.value }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  User,
  Document,
  School,
  Reading,
  ArrowUp,
  ArrowDown,
  Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSystemStore } from '@/stores/system'
import { statisticsService, getDatabaseInfo } from '@/services'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const systemStore = useSystemStore()

// 响应式数据
const gradeChartLoading = ref(true)
const attendanceChartLoading = ref(true)
const systemInfoLoading = ref(true)

const stats = ref([
  {
    title: '学生总数',
    value: '156',
    change: '+5.2%',
    trend: 'up',
    icon: User,
    color: '#409EFF'
  },
  {
    title: '课程总数',
    value: '48',
    change: '+2.1%',
    trend: 'up',
    icon: Reading,
    color: '#67C23A'
  },
  {
    title: '班级总数',
    value: '12',
    change: '0%',
    trend: 'up',
    icon: School,
    color: '#E6A23C'
  },
  {
    title: '成绩记录',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Document,
    color: '#F56C6C'
  }
])

const gradeChartOption = ref({
  title: {
    text: '成绩等级分布',
    left: 'center',
    textStyle: {
      fontSize: 16
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: '成绩分布',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 45, name: 'A/A+ (优秀)' },
        { value: 67, name: 'B/B+ (良好)' },
        { value: 34, name: 'C/C+ (中等)' },
        { value: 18, name: 'D (及格)' },
        { value: 8, name: 'F (不及格)' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }
  ]
})

const attendanceChartOption = ref({
  title: {
    text: '考勤状态统计',
    left: 'center',
    textStyle: {
      fontSize: 16
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['出勤', '迟到', '请假', '缺勤']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '人次',
      type: 'bar',
      data: [1245, 67, 23, 15],
      itemStyle: {
        color: function(params) {
          const colors = ['#67C23A', '#E6A23C', '#909399', '#F56C6C']
          return colors[params.dataIndex]
        }
      }
    }
  ]
})

const quickActions = [
  { name: '学生管理', path: '/students', type: 'primary', icon: User },
  { name: '成绩录入', path: '/grades', type: 'success', icon: Document },
  { name: '课程安排', path: '/courses/schedule', type: 'warning', icon: Reading },
  { name: 'SQL演示', path: '/system/sql-demo', type: 'info', icon: 'DocumentCopy' }
]

const databaseFeatures = [
  { name: '窗口函数', type: 'success', description: '学生排名计算' },
  { name: '存储过程', type: 'primary', description: '批量成绩导入' },
  { name: '触发器', type: 'warning', description: '数据自动更新' },
  { name: 'CTE查询', type: 'info', description: '复杂统计分析' },
  { name: '视图优化', type: 'danger', description: '性能提升' },
  { name: '索引优化', type: '', description: '查询加速' }
]

const systemInfo = ref([
  { label: '数据库版本', value: 'PostgreSQL 17' },
  { label: '数据库大小', value: '加载中...' },
  { label: '表总数', value: '13' },
  { label: '索引总数', value: '35+' },
  { label: '存储过程', value: '11' },
  { label: '触发器', value: '11' }
])

// 方法
const handleQuickAction = (path) => {
  router.push(path)
}

const refreshGradeChart = async () => {
  await loadGradeDistribution()
  ElMessage.success('成绩统计数据已刷新')
}

const refreshAttendanceChart = () => {
  attendanceChartLoading.value = true
  // 模拟数据刷新
  setTimeout(() => {
    attendanceChartLoading.value = false
    ElMessage.success('考勤统计数据已刷新')
  }, 1000)
}

const loadSystemInfo = async () => {
  try {
    systemInfoLoading.value = true
    
    // 并行加载系统概览统计和数据库信息
    const [overviewData, dbInfoData] = await Promise.all([
      statisticsService.getOverview().catch(err => {
        console.warn('Failed to load overview statistics:', err)
        return null
      }),
      getDatabaseInfo().catch(err => {
        console.warn('Failed to load database info:', err)
        return null
      })
    ])

    if (overviewData?.data) {
      const overview = overviewData.data
      
      // 更新统计卡片
      stats.value[0].value = overview.enrolled_students || '0'
      stats.value[1].value = overview.active_courses || '0'
      stats.value[2].value = overview.active_classes || '0'
      stats.value[3].value = overview.total_grades || '0'
    }

    if (dbInfoData?.data) {
      const dbInfo = dbInfoData.data
      
      systemInfo.value = [
        { 
          label: '数据库版本', 
          value: dbInfo.database_info?.version?.split(' ').slice(0, 2).join(' ') || 'PostgreSQL' 
        },
        { 
          label: '数据库大小', 
          value: dbInfo.database_info?.size || 'Unknown' 
        },
        { 
          label: '学生总数', 
          value: dbInfo.statistics?.学生总数 || '0' 
        },
        { 
          label: '教师总数', 
          value: dbInfo.statistics?.教师总数 || '0' 
        },
        { 
          label: '班级总数', 
          value: dbInfo.statistics?.班级总数 || '0' 
        },
        { 
          label: '课程总数', 
          value: dbInfo.statistics?.课程总数 || '0' 
        }
      ]
    }
  } catch (error) {
    console.error('加载系统信息失败:', error)
    ElMessage.error('系统信息加载失败')
  } finally {
    systemInfoLoading.value = false
  }
}

const loadGradeDistribution = async () => {
  try {
    gradeChartLoading.value = true
    const response = await statisticsService.getGradeDistribution()
    
    if (response?.data && Array.isArray(response.data)) {
      const gradeData = response.data.map(item => ({
        value: item.count,
        name: `${item.letter_grade} (${item.percentage}%)`
      }))
      
      gradeChartOption.value.series[0].data = gradeData
    }
  } catch (error) {
    console.error('加载成绩分布失败:', error)
    // 保持默认数据
  } finally {
    gradeChartLoading.value = false
  }
}

onMounted(async () => {
  // 并行加载数据
  await Promise.all([
    loadSystemInfo(),
    loadGradeDistribution()
  ])
  
  // 模拟考勤图表加载（暂时保持静态数据）
  setTimeout(() => {
    attendanceChartLoading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>
.dashboard {
  .dashboard-header {
    margin-bottom: 24px;
    
    .page-title {
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
    }
    
    .page-description {
      font-size: 14px;
      color: var(--el-text-color-regular);
      margin: 0;
    }
  }
  
  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      border: none;
      
      .stat-content {
        display: flex;
        align-items: center;
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 16px;
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: var(--el-text-color-primary);
            line-height: 1;
          }
          
          .stat-title {
            font-size: 14px;
            color: var(--el-text-color-regular);
            margin-top: 4px;
          }
        }
      }
      
      .stat-footer {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        
        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          
          &.up {
            color: #67C23A;
          }
          
          &.down {
            color: #F56C6C;
          }
        }
        
        .stat-period {
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 24px;
    
    .chart-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 300px;
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--el-text-color-regular);
          
          .el-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
        }
        
        .chart {
          height: 100%;
          width: 100%;
        }
      }
    }
  }
  
  .bottom-row {
    .quick-actions-card {
      .quick-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        
        .action-button {
          width: 100%;
          height: 40px;
        }
      }
    }
    
    .features-card {
      .database-features {
        .feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          
          .el-tag {
            margin-right: 8px;
            min-width: 80px;
          }
          
          .feature-desc {
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }
      }
    }
    
    .system-info-card {
      .system-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          
          .info-label {
            color: var(--el-text-color-regular);
            font-size: 14px;
          }
          
          .info-value {
            color: var(--el-text-color-primary);
            font-weight: 500;
            font-size: 14px;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .dashboard .stats-row .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    .stats-row .el-col {
      span: 12;
    }
    
    .charts-row .el-col {
      span: 24;
      margin-bottom: 16px;
    }
    
    .bottom-row .el-col {
      span: 24;
      margin-bottom: 16px;
    }
  }
}
</style>