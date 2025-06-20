<template>
  <div class="course-schedule-container">
    <el-card>
      <el-page-header :icon="Calendar" title="返回" content="课程安排" />
      
      <div class="schedule-content">
        <el-calendar v-model="currentDate">
          <template #header="{ date }">
            <span>{{ date }}</span>
          </template>
          <template #date-cell="{ data }">
            <div class="date-cell">
              <p>{{ data.day.split('-').slice(2).join('-') }}</p>
              <div v-if="getScheduleByDate(data.day).length > 0" class="schedule-items">
                <div 
                  v-for="item in getScheduleByDate(data.day)" 
                  :key="item.id"
                  class="schedule-item"
                >
                  {{ item.courseName }}
                </div>
              </div>
            </div>
          </template>
        </el-calendar>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Calendar } from '@element-plus/icons-vue'

const currentDate = ref(new Date())
const schedules = ref([])

const getScheduleByDate = (date) => {
  return schedules.value.filter(item => item.date === date)
}

onMounted(() => {
  // 加载课程安排数据
})
</script>

<style scoped>
.course-schedule-container {
  padding: 20px;
}

.schedule-content {
  margin-top: 20px;
}

.date-cell {
  min-height: 60px;
}

.schedule-items {
  margin-top: 5px;
}

.schedule-item {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 5px;
  border-radius: 3px;
  margin-bottom: 2px;
}
</style>