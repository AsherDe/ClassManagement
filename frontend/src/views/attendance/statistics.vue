<template>
  <div class="attendance-statistics-container">
    <el-card>
      <el-page-header :icon="PieChart" title="返回" content="考勤统计" />
      
      <div class="statistics-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>考勤状态分布</span>
                </div>
              </template>
              <div id="attendanceChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>班级出勤率</span>
                </div>
              </template>
              <div id="classAttendanceChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PieChart } from '@element-plus/icons-vue'

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  console.log('初始化考勤统计图表')
}
</script>

<style scoped>
.attendance-statistics-container {
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