<template>
  <div class="courses-container">
    <el-card>
      <el-page-header :icon="Notebook" title="返回" content="课程列表">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加课程
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="courses" stripe>
          <el-table-column prop="name" label="课程名称" width="200" />
          <el-table-column prop="code" label="课程代码" width="120" />
          <el-table-column prop="teacher" label="任课教师" width="120" />
          <el-table-column prop="credits" label="学分" width="80" />
          <el-table-column prop="semester" label="学期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === '进行中' ? 'success' : 'info'">
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
import { Notebook, Plus } from '@element-plus/icons-vue'

const courses = ref([])

const handleAdd = () => {
  console.log('添加课程')
}

const handleDetail = (row) => {
  console.log('查看详情', row)
}

const handleEdit = (row) => {
  console.log('编辑课程', row)
}

const handleDelete = (row) => {
  console.log('删除课程', row)
}

onMounted(() => {
  // 加载课程数据
})
</script>

<style scoped>
.courses-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}
</style>