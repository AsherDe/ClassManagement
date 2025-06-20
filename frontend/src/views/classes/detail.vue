<template>
  <div class="class-detail-container">
    <el-card>
      <el-page-header @back="goBack" title="返回" content="班级详情">
        <template #extra>
          <el-button type="primary" @click="handleEdit">编辑</el-button>
        </template>
      </el-page-header>
      
      <div class="detail-content">
        <el-descriptions title="班级信息" border :column="2">
          <el-descriptions-item label="班级名称">{{ classInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ classInfo.grade }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ classInfo.major }}</el-descriptions-item>
          <el-descriptions-item label="学生人数">{{ classInfo.studentCount }}</el-descriptions-item>
          <el-descriptions-item label="班主任" :span="2">{{ classInfo.adviser }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const classInfo = ref({
  name: '',
  grade: '',
  major: '',
  studentCount: 0,
  adviser: ''
})

const goBack = () => {
  router.go(-1)
}

const handleEdit = () => {
  console.log('编辑班级')
}

onMounted(() => {
  const classId = route.params.id
  console.log('班级ID:', classId)
})
</script>

<style scoped>
.class-detail-container {
  padding: 20px;
}

.detail-content {
  margin-top: 20px;
}
</style>