<template>
  <div class="app-wrapper">
    <el-container class="app-container">
      <!-- 侧边栏 -->
      <el-aside :width="sidebarWidth" class="sidebar-container">
        <div class="logo-container">
          <h2 class="logo-title">班级事务管理系统</h2>
          <p class="logo-subtitle">石河子大学</p>
        </div>
        
        <el-scrollbar class="sidebar-scrollbar">
          <el-menu
            :default-active="activeMenu"
            :collapse="isCollapse"
            router
            unique-opened
            class="sidebar-menu"
          >
            <template v-for="route in menuRoutes" :key="route.path">
              <el-sub-menu 
                v-if="route.children && route.children.length > 1 && !route.meta?.hidden"
                :index="route.path"
              >
                <template #title>
                  <el-icon v-if="route.meta?.icon">
                    <component :is="route.meta.icon" />
                  </el-icon>
                  <span>{{ route.meta?.title }}</span>
                </template>
                
                <el-menu-item
                  v-for="child in route.children"
                  :key="child.path"
                  :index="child.path === '' ? route.path : `${route.path}/${child.path}`"
                  v-show="!child.meta?.hidden"
                >
                  <el-icon v-if="child.meta?.icon">
                    <component :is="child.meta.icon" />
                  </el-icon>
                  <span>{{ child.meta?.title }}</span>
                </el-menu-item>
              </el-sub-menu>
              
              <el-menu-item
                v-else-if="!route.meta?.hidden"
                :index="route.children?.[0]?.path === '' ? route.path : `${route.path}/${route.children?.[0]?.path || ''}`"
              >
                <el-icon v-if="route.meta?.icon || route.children?.[0]?.meta?.icon">
                  <component :is="route.meta?.icon || route.children?.[0]?.meta?.icon" />
                </el-icon>
                <span>{{ route.meta?.title || route.children?.[0]?.meta?.title }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </el-scrollbar>
      </el-aside>
      
      <!-- 主要内容区域 -->
      <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header class="navbar-container">
          <div class="navbar-left">
            <el-icon class="hamburger" @click="toggleSidebar">
              <Expand v-if="isCollapse" />
              <Fold v-else />
            </el-icon>
            
            <el-breadcrumb class="breadcrumb" separator="/">
              <el-breadcrumb-item
                v-for="item in breadcrumbs"
                :key="item.path"
                :to="{ path: item.path }"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="navbar-right">
            <el-tooltip content="系统信息" placement="bottom">
              <el-button :icon="InfoFilled" circle @click="showSystemInfo" />
            </el-tooltip>
            
            <el-tooltip content="切换主题" placement="bottom">
              <el-button :icon="Moon" circle @click="toggleTheme" />
            </el-tooltip>
            
            <el-tooltip content="刷新页面" placement="bottom">
              <el-button :icon="Refresh" circle @click="refreshPage" />
            </el-tooltip>
            
            <el-dropdown @command="handleUserCommand">
              <span class="user-dropdown">
                <el-icon><User /></el-icon>
                <span>{{ currentUser.username || '用户' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人资料
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    系统设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主要内容 -->
        <el-main class="app-main">
          <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
              <keep-alive>
                <component :is="Component" :key="route.path" />
              </keep-alive>
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
    
    <!-- 系统信息对话框 -->
    <el-dialog
      v-model="systemInfoVisible"
      title="系统信息"
      width="600px"
      align-center
    >
      <div class="system-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="系统名称">
            石河子大学班级事务管理系统
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            v1.0.0
          </el-descriptions-item>
          <el-descriptions-item label="数据库">
            PostgreSQL 17
          </el-descriptions-item>
          <el-descriptions-item label="后端技术">
            Node.js + Express
          </el-descriptions-item>
          <el-descriptions-item label="前端技术">
            Vue 3 + Element Plus
          </el-descriptions-item>
          <el-descriptions-item label="项目类型">
            数据库课程设计
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="features-section">
          <h4>核心特性</h4>
          <el-tag v-for="feature in features" :key="feature" class="feature-tag">
            {{ feature }}
          </el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Expand,
  Fold,
  InfoFilled,
  Moon,
  Refresh,
  User,
  ArrowDown,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAuthToken, clearAuthToken } from '@/services'

const route = useRoute()
const router = useRouter()

// 响应式数据
const isCollapse = ref(false)
const systemInfoVisible = ref(false)
const currentUser = ref({
  username: '',
  userType: ''
})

// 计算属性
const sidebarWidth = computed(() => isCollapse.value ? '64px' : '250px')

const activeMenu = computed(() => {
  const { path } = route
  return path
})

const menuRoutes = computed(() => {
  return router.getRoutes().filter(route => 
    route.path.startsWith('/') && 
    !route.path.includes(':') && 
    route.path !== '/' &&
    !route.meta?.hidden
  )
})

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    title: item.meta.title,
    path: item.path
  }))
})

const features = [
  'PostgreSQL高级特性',
  '复杂SQL查询',
  '存储过程调用',
  '视图优化',
  '触发器应用',
  '索引优化',
  '窗口函数',
  'CTE递归查询'
]

// 方法
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const showSystemInfo = () => {
  systemInfoVisible.value = true
}

const toggleTheme = () => {
  const html = document.documentElement
  const isDark = html.classList.contains('dark')
  
  if (isDark) {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  } else {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }
}

const refreshPage = () => {
  location.reload()
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能待开发')
      break
    case 'settings':
      ElMessage.info('系统设置功能待开发')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
          type: 'warning'
        })
        
        // 清除认证信息
        clearAuthToken()
        
        ElMessage.success('已退出登录')
        
        // 跳转到登录页
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

const loadCurrentUser = () => {
  const token = getAuthToken()
  if (token) {
    try {
      // 如果是模拟token，解析用户信息
      const userInfo = JSON.parse(atob(token))
      currentUser.value = {
        username: userInfo.username || '用户',
        userType: userInfo.userType || 'student'
      }
    } catch (error) {
      // 如果解析失败，使用默认值
      currentUser.value = {
        username: '用户',
        userType: 'student'
      }
    }
  }
}

// 监听路由变化，自动收起侧边栏（移动端）
watch(
  () => route.path,
  () => {
    if (window.innerWidth < 768) {
      isCollapse.value = true
    }
  }
)

// 初始化主题
const initTheme = () => {
  const theme = localStorage.getItem('theme')
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  }
}

// 初始化
onMounted(() => {
  initTheme()
  loadCurrentUser()
})
</script>

<style lang="scss" scoped>
.app-wrapper {
  height: 100vh;
  width: 100%;
}

.app-container {
  height: 100%;
}

.sidebar-container {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  transition: width 0.3s;
  
  .logo-container {
    padding: 20px 16px;
    text-align: center;
    border-bottom: 1px solid var(--el-border-color-light);
    
    .logo-title {
      font-size: 18px;
      font-weight: bold;
      margin: 0;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
    }
    
    .logo-subtitle {
      font-size: 12px;
      color: var(--el-text-color-regular);
      margin: 4px 0 0 0;
    }
  }
  
  .sidebar-scrollbar {
    height: calc(100vh - 80px);
  }
  
  .sidebar-menu {
    border: none;
    background: transparent;
    
    .el-menu-item,
    .el-sub-menu__title {
      height: 50px;
      line-height: 50px;
      
      &:hover {
        background-color: var(--el-menu-hover-bg-color);
      }
    }
    
    .el-menu-item.is-active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      border-right: 3px solid var(--el-color-primary);
    }
  }
}

.main-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.navbar-container {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .navbar-left {
    display: flex;
    align-items: center;
    
    .hamburger {
      font-size: 20px;
      cursor: pointer;
      margin-right: 16px;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.3s;
      
      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
    
    .breadcrumb {
      font-size: 14px;
    }
  }
  
  .navbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.3s;
      color: var(--el-text-color-primary);
      font-size: 14px;
      
      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
  }
}

.app-main {
  flex: 1;
  padding: 20px;
  background: var(--el-bg-color-page);
  overflow-y: auto;
}

.system-info {
  .features-section {
    margin-top: 20px;
    
    h4 {
      margin-bottom: 12px;
      color: var(--el-text-color-primary);
    }
    
    .feature-tag {
      margin: 4px 8px 4px 0;
    }
  }
}

// 页面过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

// 响应式布局
@media (max-width: 768px) {
  .navbar-left .breadcrumb {
    display: none;
  }
  
  .app-main {
    padding: 12px;
  }
}
</style>