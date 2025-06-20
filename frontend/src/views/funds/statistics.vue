<template>
  <div class="fund-statistics-container">
    <el-card>
      <el-page-header :icon="DataLine" title="返回" content="财务统计" />
      
      <div class="statistics-content">
        <el-row :gutter="20" class="summary-cards">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总收入" :value="totalIncome" suffix="元" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总支出" :value="totalExpense" suffix="元" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="余额" :value="balance" suffix="元" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="本月收支" :value="monthlyChange" suffix="元" />
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" class="chart-row">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>收支趋势</span>
                </div>
              </template>
              <div id="trendChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>支出分类</span>
                </div>
              </template>
              <div id="categoryChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { DataLine } from '@element-plus/icons-vue'

const totalIncome = ref(0)
const totalExpense = ref(0)
const balance = ref(0)
const monthlyChange = ref(0)

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  console.log('初始化财务统计图表')
}
</script>

<style scoped>
.fund-statistics-container {
  padding: 20px;
}

.statistics-content {
  margin-top: 20px;
}

.summary-cards {
  margin-bottom: 20px;
}

.chart-row {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>