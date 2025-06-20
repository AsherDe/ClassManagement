<template>
  <div class="database-container">
    <el-card>
      <el-page-header :icon="Coin" title="返回" content="数据库信息" />
      
      <div class="database-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>数据库状态</span>
                  <el-button size="small" @click="refreshStatus">刷新</el-button>
                </div>
              </template>
              <el-descriptions border :column="1">
                <el-descriptions-item label="数据库类型">{{ dbInfo.type }}</el-descriptions-item>
                <el-descriptions-item label="版本">{{ dbInfo.version }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="dbInfo.status === '正常' ? 'success' : 'danger'">
                    {{ dbInfo.status }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="连接数">{{ dbInfo.connections }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>表统计</span>
                </div>
              </template>
              <el-table :data="tableStats" size="small">
                <el-table-column prop="tableName" label="表名" />
                <el-table-column prop="recordCount" label="记录数" />
                <el-table-column prop="size" label="大小" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Coin } from '@element-plus/icons-vue'

const dbInfo = ref({
  type: 'MySQL',
  version: '8.0.33',
  status: '正常',
  connections: 5
})

const tableStats = ref([
  { tableName: 'students', recordCount: 150, size: '2.5MB' },
  { tableName: 'grades', recordCount: 3200, size: '8.1MB' },
  { tableName: 'classes', recordCount: 8, size: '256KB' },
  { tableName: 'courses', recordCount: 25, size: '512KB' }
])

const refreshStatus = () => {
  console.log('刷新数据库状态')
}

onMounted(() => {
  // 加载数据库信息
})
</script>

<style scoped>
.database-container {
  padding: 20px;
}

.database-content {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>