import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'
import { getAuthToken } from '@/services'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue'),
    meta: { hidden: true, title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Dashboard' }
      }
    ]
  },
  {
    path: '/students',
    component: Layout,
    name: 'Students',
    meta: { title: '学生管理', icon: 'User' },
    children: [
      {
        path: '',
        name: 'StudentList',
        component: () => import('@/views/students/index.vue'),
        meta: { title: '学生列表', icon: 'UserFilled' }
      },
      {
        path: ':id',
        name: 'StudentDetail',
        component: () => import('@/views/students/detail.vue'),
        meta: { title: '学生详情', hidden: true }
      }
    ]
  },
  {
    path: '/grades',
    component: Layout,
    name: 'Grades',
    meta: { title: '成绩管理', icon: 'Document' },
    children: [
      {
        path: '',
        name: 'GradeList',
        component: () => import('@/views/grades/index.vue'),
        meta: { title: '成绩管理', icon: 'DocumentChecked' }
      },
      {
        path: 'statistics',
        name: 'GradeStatistics',
        component: () => import('@/views/grades/statistics.vue'),
        meta: { title: '成绩统计', icon: 'TrendCharts' }
      }
    ]
  },
  {
    path: '/classes',
    component: Layout,
    name: 'Classes',
    meta: { title: '班级管理', icon: 'School' },
    children: [
      {
        path: '',
        name: 'ClassList',
        component: () => import('@/views/classes/index.vue'),
        meta: { title: '班级列表', icon: 'Collection' }
      },
      {
        path: ':id',
        name: 'ClassDetail',
        component: () => import('@/views/classes/detail.vue'),
        meta: { title: '班级详情', hidden: true }
      }
    ]
  },
  {
    path: '/courses',
    component: Layout,
    name: 'Courses',
    meta: { title: '课程管理', icon: 'Reading' },
    children: [
      {
        path: '',
        name: 'CourseList',
        component: () => import('@/views/courses/index.vue'),
        meta: { title: '课程管理', icon: 'Notebook' }
      },
      {
        path: ':id',
        name: 'CourseDetail',
        component: () => import('@/views/courses/detail.vue'),
        meta: { title: '课程详情', hidden: true }
      },
      {
        path: 'schedule',
        name: 'CourseSchedule',
        component: () => import('@/views/courses/schedule.vue'),
        meta: { title: '课程安排', icon: 'Calendar' }
      }
    ]
  },
  {
    path: '/attendance',
    component: Layout,
    name: 'Attendance',
    meta: { title: '考勤管理', icon: 'Clock' },
    children: [
      {
        path: '',
        name: 'AttendanceList',
        component: () => import('@/views/attendance/index.vue'),
        meta: { title: '考勤管理', icon: 'Timer' }
      }
    ]
  },
  {
    path: '/activities',
    component: Layout,
    name: 'Activities',
    meta: { title: '班级活动', icon: 'Basketball' },
    children: [
      {
        path: '',
        name: 'ActivityList',
        component: () => import('@/views/activities/index.vue'),
        meta: { title: '班级活动', icon: 'Trophy' }
      },
      {
        path: ':id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/detail.vue'),
        meta: { title: '活动详情', hidden: true }
      }
    ]
  },
  {
    path: '/funds',
    component: Layout,
    name: 'Funds',
    meta: { title: '班费管理', icon: 'Money' },
    children: [
      {
        path: '',
        name: 'FundList',
        component: () => import('@/views/funds/index.vue'),
        meta: { title: '班费管理', icon: 'Wallet' }
      }
    ]
  },
  {
    path: '/teachers',
    component: Layout,
    name: 'Teachers',
    meta: { title: '教师管理', icon: 'Avatar' },
    children: [
      {
        path: '',
        name: 'TeacherList',
        component: () => import('@/views/teachers/index.vue'),
        meta: { title: '教师管理', icon: 'UserFilled' }
      }
    ]
  },
  {
    path: '/notifications',
    component: Layout,
    name: 'Notifications',
    meta: { title: '通知管理', icon: 'Bell' },
    children: [
      {
        path: '',
        name: 'NotificationList',
        component: () => import('@/views/notifications/index.vue'),
        meta: { title: '通知管理', icon: 'Message' }
      }
    ]
  },
  {
    path: '/permissions',
    component: Layout,
    name: 'Permissions',
    meta: { title: '权限管理', icon: 'Lock' },
    children: [
      {
        path: '',
        name: 'PermissionManagement',
        component: () => import('@/views/permissions/index.vue'),
        meta: { title: '权限管理', icon: 'Key' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    name: 'System',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'database',
        name: 'DatabaseInfo',
        component: () => import('@/views/system/database.vue'),
        meta: { title: '数据库信息', icon: 'Coin' }
      },
      {
        path: 'sql-demo',
        name: 'SqlDemo',
        component: () => import('@/views/system/sql-demo.vue'),
        meta: { title: 'SQL演示', icon: 'DocumentCopy' }
      }
    ]
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 石河子大学班级事务管理系统`
  } else {
    document.title = '石河子大学班级事务管理系统'
  }
  
  // 检查是否需要认证
  const token = getAuthToken()
  const isLoginPage = to.path === '/login'
  
  if (!token && !isLoginPage) {
    // 未登录且不是登录页，跳转到登录页
    next('/login')
  } else if (token && isLoginPage) {
    // 已登录且是登录页，跳转到仪表盘
    next('/dashboard')
  } else {
    // 其他情况正常导航
    next()
  }
})

export default router