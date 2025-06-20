<template>
  <div class="classes-container">
    <el-card>
      <el-page-header :icon="Collection" title="返回" content="班级列表">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加班级
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="classes" stripe>
          <el-table-column prop="name" label="班级名称" width="200" />
          <el-table-column prop="grade" label="年级" width="100" />
          <el-table-column prop="major" label="专业" />
          <el-table-column prop="studentCount" label="学生人数" width="120" />
          <el-table-column prop="adviser" label="班主任" width="120" />
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
import { Collection, Plus } from '@element-plus/icons-vue'

const classes = ref([])

const handleAdd = () => {
  console.log('添加班级')
}

const handleDetail = (row) => {
  console.log('查看详情', row)
}

const handleEdit = (row) => {
  console.log('编辑班级', row)
}

const handleDelete = (row) => {
  console.log('删除班级', row)
}

onMounted(() => {
  // 加载班级数据
})
</script>

<style scoped>
.classes-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}
</style>