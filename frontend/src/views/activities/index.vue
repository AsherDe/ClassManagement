<template>
  <div class="activities-container">
    <el-card>
      <el-page-header :icon="Trophy" title="返回" content="活动列表">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加活动
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="activities" stripe>
          <el-table-column prop="title" label="活动名称" width="200" />
          <el-table-column prop="type" label="活动类型" width="120" />
          <el-table-column prop="startDate" label="开始时间" width="180" />
          <el-table-column prop="endDate" label="结束时间" width="180" />
          <el-table-column prop="location" label="活动地点" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Trophy, Plus } from '@element-plus/icons-vue'

const activities = ref([])

const getStatusType = (status) => {
  const statusMap = {
    '未开始': 'info',
    '进行中': 'success',
    '已结束': 'warning'
  }
  return statusMap[status] || 'info'
}

const handleAdd = () => {
  console.log('添加活动')
}

const handleDetail = (row) => {
  console.log('查看详情', row)
}

const handleEdit = (row) => {
  console.log('编辑活动', row)
}

const handleDelete = (row) => {
  console.log('删除活动', row)
}

onMounted(() => {
  // 加载活动数据
})
</script>

<style scoped>
.activities-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}
</style>