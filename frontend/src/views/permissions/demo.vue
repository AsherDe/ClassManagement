<template>
  <div class="permission-demo-container">
    <el-card>
      <template #header>
        <h3>权限系统使用示例</h3>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 指令示例 -->
        <el-tab-pane label="权限指令" name="directives">
          <div class="demo-section">
            <h4>单权限验证指令</h4>
            <p>只有拥有 'edit_students' 权限的用户才能看到此按钮：</p>
            <el-button 
              v-permission="'edit_students'"
              type="primary"
            >
              编辑学生信息
            </el-button>
            <el-button 
              v-permission="'nonexistent_permission'"
              type="danger"
            >
              您看不到这个按钮
            </el-button>

            <el-divider />

            <h4>多权限验证指令（任一）</h4>
            <p>拥有 'view_students' 或 'edit_students' 任一权限即可看到：</p>
            <el-button 
              v-permission="['view_students', 'edit_students']"
              type="success"
            >
              学生管理
            </el-button>

            <el-divider />

            <h4>全权限验证指令</h4>
            <p>必须同时拥有 'view_grades' 和 'input_grades' 权限：</p>
            <el-button 
              v-permission-all="['view_grades', 'input_grades']"
              type="warning"
            >
              成绩管理
            </el-button>

            <el-divider />

            <h4>用户类型验证指令</h4>
            <p>只有管理员可以看到：</p>
            <el-button 
              v-user-type="'admin'"
              type="danger"
            >
              管理员功能
            </el-button>

            <p>教师和管理员可以看到：</p>
            <el-button 
              v-user-type="['admin', 'teacher']"
              type="info"
            >
              教师功能
            </el-button>
          </div>
        </el-tab-pane>

        <!-- 组件示例 -->
        <el-tab-pane label="权限组件" name="components">
          <div class="demo-section">
            <h4>权限守卫组件 - 有权限</h4>
            <PermissionGuard permission="view_statistics">
              <el-card class="demo-card">
                <el-icon><TrendCharts /></el-icon>
                <p>统计数据内容（您有权限查看）</p>
              </el-card>
            </PermissionGuard>

            <h4>权限守卫组件 - 无权限（显示回退内容）</h4>
            <PermissionGuard 
              permission="nonexistent_permission" 
              show-fallback
              @request-permission="handleRequestPermission"
            >
              <el-card class="demo-card">
                <el-icon><Lock /></el-icon>
                <p>受保护的内容</p>
              </el-card>
              <template #fallback>
                <el-alert
                  title="权限不足"
                  description="您没有访问此内容的权限，请联系管理员申请权限。"
                  type="warning"
                  show-icon
                />
              </template>
            </PermissionGuard>

            <h4>用户类型守卫</h4>
            <PermissionGuard user-type="admin" show-fallback>
              <el-card class="demo-card admin-card">
                <el-icon><Setting /></el-icon>
                <p>管理员专用区域</p>
              </el-card>
              <template #fallback>
                <el-alert
                  title="访问受限"
                  description="此区域仅限管理员访问。"
                  type="error"
                  show-icon
                />
              </template>
            </PermissionGuard>

            <h4>复合权限验证</h4>
            <PermissionGuard 
              :permission="['view_grades', 'input_grades']" 
              require-all
              user-type="teacher"
              show-fallback
            >
              <el-card class="demo-card teacher-card">
                <el-icon><Document /></el-icon>
                <p>教师成绩管理区域</p>
                <p>需要：教师身份 + 查看成绩权限 + 录入成绩权限</p>
              </el-card>
              <template #fallback>
                <el-alert
                  title="复合权限验证失败"
                  description="需要教师身份并同时拥有查看和录入成绩的权限。"
                  type="info"
                  show-icon
                />
              </template>
            </PermissionGuard>
          </div>
        </el-tab-pane>

        <!-- 编程式验证 -->
        <el-tab-pane label="编程式验证" name="programmatic">
          <div class="demo-section">
            <h4>编程式权限检查</h4>
            <el-space direction="vertical" size="large">
              <el-card>
                <h5>检查单个权限</h5>
                <p>检查是否有 'view_students' 权限：</p>
                <el-tag :type="hasViewStudents ? 'success' : 'danger'">
                  {{ hasViewStudents ? '有权限' : '无权限' }}
                </el-tag>
              </el-card>

              <el-card>
                <h5>检查多个权限（任一）</h5>
                <p>检查是否有学生管理相关权限：</p>
                <el-tag :type="hasAnyStudentPermission ? 'success' : 'danger'">
                  {{ hasAnyStudentPermission ? '有权限' : '无权限' }}
                </el-tag>
              </el-card>

              <el-card>
                <h5>检查全部权限</h5>
                <p>检查是否同时拥有成绩查看和录入权限：</p>
                <el-tag :type="hasAllGradePermissions ? 'success' : 'danger'">
                  {{ hasAllGradePermissions ? '有权限' : '无权限' }}
                </el-tag>
              </el-card>

              <el-card>
                <h5>用户信息</h5>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="用户名">
                    {{ userStore.userInfo?.username || '未登录' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="用户类型">
                    <el-tag :type="getUserTypeTag">
                      {{ getUserTypeLabel }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="权限数量">
                    {{ userStore.activePermissions?.length || 0 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag type="success">在线</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>

              <el-card>
                <h5>权限列表</h5>
                <el-table :data="permissionList" style="width: 100%">
                  <el-table-column prop="permission_name" label="权限名称" />
                  <el-table-column prop="category" label="分类" width="120">
                    <template #default="scope">
                      <el-tag size="small">{{ scope.row.category }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="is_active" label="状态" width="80">
                    <template #default="scope">
                      <el-tag 
                        :type="scope.row.is_active ? 'success' : 'danger'" 
                        size="small"
                      >
                        {{ scope.row.is_active ? '启用' : '禁用' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-space>
          </div>
        </el-tab-pane>

        <!-- 快速测试 -->
        <el-tab-pane label="快速测试" name="test">
          <div class="demo-section">
            <h4>模拟登录测试</h4>
            <p>快速切换不同角色来测试权限系统：</p>
            
            <el-space wrap>
              <el-button 
                type="danger" 
                @click="handleMockLogin('admin')"
                :disabled="currentUserType === 'admin'"
              >
                登录为管理员
              </el-button>
              <el-button 
                type="warning" 
                @click="handleMockLogin('teacher')"
                :disabled="currentUserType === 'teacher'"
              >
                登录为教师
              </el-button>
              <el-button 
                type="success" 
                @click="handleMockLogin('student')"
                :disabled="currentUserType === 'student'"
              >
                登录为学生
              </el-button>
              <el-button 
                type="info" 
                @click="handleLogout"
                :disabled="!isLoggedIn"
              >
                退出登录
              </el-button>
            </el-space>

            <el-divider />

            <el-alert
              v-if="!isLoggedIn"
              title="未登录状态"
              description="请选择一个角色登录以测试权限功能"
              type="warning"
              show-icon
            />
            
            <el-alert
              v-else
              :title="`当前用户：${userStore.userInfo?.username} (${getUserTypeLabel})`"
              :description="`拥有 ${userStore.activePermissions?.length || 0} 个权限`"
              type="success"
              show-icon
            />

            <div v-if="isLoggedIn" class="test-results">
              <h5>权限测试结果</h5>
              <el-table :data="permissionTests" style="width: 100%">
                <el-table-column prop="description" label="测试项目" />
                <el-table-column prop="result" label="结果" width="100">
                  <template #default="scope">
                    <el-tag :type="scope.row.result ? 'success' : 'danger'">
                      {{ scope.row.result ? '通过' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  TrendCharts, 
  Lock, 
  Setting, 
  Document 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { 
  mockLogin, 
  mockTeacherLogin, 
  mockStudentLogin, 
  mockLogout, 
  isLoggedIn as checkIsLoggedIn,
  getCurrentUser 
} from '@/utils/permissions'

const activeTab = ref('directives')
const userStore = useUserStore()

// 编程式权限检查示例
const hasViewStudents = computed(() => {
  return userStore.hasPermission('view_students')
})

const hasAnyStudentPermission = computed(() => {
  return userStore.hasAnyPermission(['view_students', 'edit_students'])
})

const hasAllGradePermissions = computed(() => {
  return userStore.hasAllPermissions(['view_grades', 'input_grades'])
})

const getUserTypeTag = computed(() => {
  const type = userStore.userInfo?.user_type
  const typeMap = {
    admin: 'danger',
    teacher: 'warning',
    student: 'success'
  }
  return typeMap[type] || 'info'
})

const getUserTypeLabel = computed(() => {
  const type = userStore.userInfo?.user_type
  const typeMap = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return typeMap[type] || '未知'
})

const permissionList = computed(() => {
  return userStore.activePermissions || []
})

const isLoggedIn = computed(() => {
  return checkIsLoggedIn()
})

const currentUserType = computed(() => {
  return userStore.userInfo?.user_type
})

// 权限测试用例
const permissionTests = computed(() => {
  if (!isLoggedIn.value) return []
  
  return [
    {
      description: '查看学生信息权限',
      result: userStore.hasPermission('view_students')
    },
    {
      description: '编辑学生信息权限',
      result: userStore.hasPermission('edit_students')
    },
    {
      description: '成绩管理权限（任一）',
      result: userStore.hasAnyPermission(['view_grades', 'input_grades'])
    },
    {
      description: '成绩管理权限（全部）',
      result: userStore.hasAllPermissions(['view_grades', 'input_grades'])
    },
    {
      description: '管理员权限',
      result: userStore.isAdmin
    },
    {
      description: '教师权限',
      result: userStore.isTeacher
    },
    {
      description: '学生权限',
      result: userStore.isStudent
    }
  ]
})

const handleRequestPermission = () => {
  ElMessage.info('权限申请功能尚未实现，请联系管理员')
}

const handleMockLogin = async (userType) => {
  try {
    let result
    switch (userType) {
      case 'admin':
        result = mockLogin()
        break
      case 'teacher':
        result = mockTeacherLogin()
        break
      case 'student':
        result = mockStudentLogin()
        break
      default:
        throw new Error('未知用户类型')
    }
    
    // 更新store
    userStore.setUserInfo(result.user)
    userStore.setPermissions(result.permissions)
    
    ElMessage.success(`已切换为${getUserTypeLabel.value}`)
  } catch (error) {
    ElMessage.error('登录失败：' + error.message)
  }
}

const handleLogout = async () => {
  try {
    mockLogout()
    userStore.logout()
    ElMessage.success('已退出登录')
  } catch (error) {
    ElMessage.error('退出失败：' + error.message)
  }
}

onMounted(() => {
  // 确保用户信息已加载
  if (!userStore.userInfo) {
    userStore.initializeUser()
  }
})
</script>

<style scoped>
.permission-demo-container {
  padding: 20px;
}

.demo-section {
  padding: 20px 0;
}

.demo-section h4 {
  margin: 20px 0 10px 0;
  color: #303133;
  font-weight: 600;
}

.demo-section p {
  margin: 10px 0;
  color: #606266;
}

.demo-card {
  margin: 10px 0;
  text-align: center;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.demo-card .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: #409EFF;
}

.admin-card {
  border-color: #F56C6C;
}

.admin-card .el-icon {
  color: #F56C6C;
}

.teacher-card {
  border-color: #E6A23C;
}

.teacher-card .el-icon {
  color: #E6A23C;
}

.el-divider {
  margin: 30px 0;
}

.test-results {
  margin-top: 20px;
}

.test-results h5 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}
</style>