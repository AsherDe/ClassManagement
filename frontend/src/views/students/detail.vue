<template>
  <div class="student-detail-container">
    <el-card>
      <el-page-header @back="goBack" title="返回" content="学生详情">
        <template #extra>
          <el-button type="primary" @click="handleEdit">编辑</el-button>
        </template>
      </el-page-header>
      
      <div class="detail-content">
        <el-descriptions title="学生信息" border :column="2">
          <el-descriptions-item label="学号">{{ student.id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ student.name }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ student.class }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ student.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱" :span="2">{{ student.email }}</el-descriptions-item>
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

const student = ref({
  id: '',
  name: '',
  class: '',
  phone: '',
  email: ''
})

const goBack = () => {
  router.go(-1)
}

const handleEdit = () => {
  console.log('编辑学生')
}

onMounted(() => {
  // 根据路由参数加载学生详情
  const studentId = route.params.id
  console.log('学生ID:', studentId)
})
</script>

<style scoped>
.student-detail-container {
  padding: 20px;
}

.detail-content {
  margin-top: 20px;
}
</style>