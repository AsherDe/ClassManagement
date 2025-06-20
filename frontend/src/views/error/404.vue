<template>
  <div class="error-404">
    <div class="error-content">
      <div class="error-image">
        <svg viewBox="0 0 404 404" width="404" height="404">
          <text x="50%" y="50%" text-anchor="middle" fill="#409eff" font-size="48" font-weight="bold">
            404
          </text>
        </svg>
      </div>
      <div class="error-text">
        <h1>页面未找到</h1>
        <p>抱歉，您访问的页面不存在或已被删除。</p>
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>
            返回上页
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled, Back } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.error-404 {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.error-content {
  text-align: center;
  padding: 40px;
}

.error-image {
  margin-bottom: 30px;
}

.error-image svg {
  max-width: 300px;
  height: auto;
}

.error-text h1 {
  font-size: 32px;
  color: #303133;
  margin-bottom: 16px;
}

.error-text p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>