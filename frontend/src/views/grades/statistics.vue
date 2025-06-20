<template>
  <div class="grade-statistics-container">
    <el-card>
      <el-page-header :icon="TrendCharts" title="返回" content="成绩统计" />
      
      <div class="statistics-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>成绩分布</span>
                </div>
              </template>
              <div id="gradeChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>班级平均分</span>
                </div>
              </template>
              <div id="averageChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'

onMounted(() => {
  // 初始化图表
  initCharts()
})

const initCharts = () => {
  console.log('初始化成绩统计图表')
}
</script>

<style scoped>
.grade-statistics-container {
  padding: 20px;
}

.statistics-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>