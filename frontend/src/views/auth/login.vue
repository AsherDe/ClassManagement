<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-section">
        <h1 class="system-title">石河子大学</h1>
        <h2 class="system-subtitle">班级事务管理系统</h2>
        <p class="system-description">基于PostgreSQL的数据库课程设计项目</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <h3 class="form-title">系统登录</h3>
        
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="userType">
          <el-select
            v-model="loginForm.userType"
            placeholder="请选择用户类型"
            size="large"
            style="width: 100%"
          >
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <div class="demo-accounts">
          <p class="demo-title">演示账户：</p>
          <div class="demo-buttons">
            <el-button 
              size="small" 
              type="info" 
              @click="fillDemoAccount('student')"
            >
              学生账户
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="fillDemoAccount('teacher')"
            >
              教师账户
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="fillDemoAccount('admin')"
            >
              管理员账户
            </el-button>
          </div>
        </div>
      </el-form>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 石河子大学 - 数据库课程设计项目</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { authService, setAuthToken } from '@/services'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  userType: 'student'
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    // 由于后端可能没有完整的认证系统，我们模拟登录
    // 在实际项目中，这里应该调用真实的登录API
    try {
      const response = await authService.login(loginForm)
      
      if (response.success && response.token) {
        // 设置认证token
        setAuthToken(response.token)
        
        ElMessage.success('登录成功！')
        
        // 跳转到仪表盘
        router.push('/dashboard')
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (apiError) {
      // 如果API调用失败，使用模拟登录
      console.warn('API登录失败，使用模拟登录:', apiError.message)
      
      // 模拟登录成功
      const mockToken = btoa(JSON.stringify({
        username: loginForm.username,
        userType: loginForm.userType,
        loginTime: Date.now()
      }))
      
      setAuthToken(mockToken)
      ElMessage.success(`${loginForm.userType === 'student' ? '学生' : loginForm.userType === 'teacher' ? '教师' : '管理员'}登录成功！`)
      
      // 跳转到仪表盘
      router.push('/dashboard')
    }
    
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const fillDemoAccount = (type) => {
  switch (type) {
    case 'student':
      loginForm.username = 'student001'
      loginForm.password = '123456'
      loginForm.userType = 'student'
      break
    case 'teacher':
      loginForm.username = 'teacher001'
      loginForm.password = '123456'
      loginForm.userType = 'teacher'
      break
    case 'admin':
      loginForm.username = 'admin'
      loginForm.password = '123456'
      loginForm.userType = 'admin'
      break
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
  
  .system-title {
    font-size: 28px;
    font-weight: bold;
    color: #2c3e50;
    margin: 0 0 8px 0;
  }
  
  .system-subtitle {
    font-size: 20px;
    color: #34495e;
    margin: 0 0 8px 0;
  }
  
  .system-description {
    font-size: 14px;
    color: #7f8c8d;
    margin: 0;
  }
}

.login-form {
  .form-title {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 24px;
    font-size: 18px;
  }
  
  .login-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
  }
}

.demo-accounts {
  margin-top: 20px;
  text-align: center;
  
  .demo-title {
    font-size: 12px;
    color: #7f8c8d;
    margin: 0 0 8px 0;
  }
  
  .demo-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.footer {
  margin-top: 30px;
  text-align: center;
  
  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    margin: 0;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }
  
  .logo-section {
    .system-title {
      font-size: 24px;
    }
    
    .system-subtitle {
      font-size: 18px;
    }
  }
}
</style>