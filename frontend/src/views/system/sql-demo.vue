<template>
  <div class="sql-demo-container">
    <el-card>
      <el-page-header :icon="DocumentCopy" title="返回" content="SQL演示" />
      
      <div class="demo-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>SQL编辑器</span>
                  <el-button type="primary" size="small" @click="executeQuery">执行</el-button>
                </div>
              </template>
              <el-input
                v-model="sqlQuery"
                type="textarea"
                :rows="10"
                placeholder="请输入SQL查询语句..."
                resize="none"
              />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>查询结果</span>
                  <el-button size="small" @click="clearResult">清空</el-button>
                </div>
              </template>
              <div class="result-container">
                <el-table v-if="queryResult.length > 0" :data="queryResult" size="small" max-height="300">
                  <el-table-column
                    v-for="(value, key) in queryResult[0]"
                    :key="key"
                    :prop="key"
                    :label="key"
                  />
                </el-table>
                <el-empty v-else description="暂无查询结果" />
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row class="sample-queries">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <span>示例查询</span>
              </template>
              <el-space wrap>
                <el-button 
                  v-for="sample in sampleQueries" 
                  :key="sample.name"
                  size="small"
                  @click="setSqlQuery(sample.sql)"
                >
                  {{ sample.name }}
                </el-button>
              </el-space>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { DocumentCopy } from '@element-plus/icons-vue'

const sqlQuery = ref('')
const queryResult = ref([])

const sampleQueries = ref([
  { name: '查询所有学生', sql: 'SELECT * FROM students LIMIT 10;' },
  { name: '班级学生统计', sql: 'SELECT class_name, COUNT(*) as student_count FROM students GROUP BY class_name;' },
  { name: '成绩统计', sql: 'SELECT course_name, AVG(score) as avg_score FROM grades GROUP BY course_name;' },
  { name: '考勤统计', sql: 'SELECT status, COUNT(*) as count FROM attendance GROUP BY status;' }
])

const executeQuery = () => {
  console.log('执行SQL查询:', sqlQuery.value)
  // 模拟查询结果
  queryResult.value = [
    { id: 1, name: '张三', class: '计算机2021-1班' },
    { id: 2, name: '李四', class: '计算机2021-1班' }
  ]
}

const clearResult = () => {
  queryResult.value = []
}

const setSqlQuery = (sql) => {
  sqlQuery.value = sql
}
</script>

<style scoped>
.sql-demo-container {
  padding: 20px;
}

.demo-content {
  margin-top: 20px;
}

.result-container {
  min-height: 300px;
}

.sample-queries {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>