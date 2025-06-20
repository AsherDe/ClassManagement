<template>
  <div class="permissions-container">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <!-- 权限管理 -->
      <el-tab-pane label="权限管理" name="permissions">
        <div class="page-header">
          <div class="header-left">
            <h2>权限管理</h2>
            <p>管理系统权限定义</p>
          </div>
          <div class="header-right">
            <el-button type="primary" @click="showAddPermissionDialog = true">
              <el-icon><Plus /></el-icon>
              添加权限
            </el-button>
          </div>
        </div>

        <div class="search-bar">
          <el-form :inline="true" :model="permissionSearchForm" class="search-form">
            <el-form-item>
              <el-input
                v-model="permissionSearchForm.keyword"
                placeholder="搜索权限名称、标识符"
                clearable
                @keyup.enter="handlePermissionSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select v-model="permissionSearchForm.category" placeholder="权限分类" clearable>
                <el-option
                  v-for="category in permissionCategories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePermissionSearch">搜索</el-button>
              <el-button @click="handlePermissionReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-container">
          <el-table
            :data="permissionTableData"
            v-loading="permissionLoading"
            style="width: 100%"
            row-key="id"
          >
            <el-table-column prop="permission_name" label="权限名称" width="150" />
            <el-table-column prop="permission_key" label="权限标识符" width="180" />
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                <el-tag type="info">{{ scope.row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEditPermission(scope.row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDeletePermission(scope.row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 用户权限 -->
      <el-tab-pane label="用户权限" name="users">
        <div class="page-header">
          <div class="header-left">
            <h2>用户权限管理</h2>
            <p>管理用户权限分配</p>
          </div>
        </div>

        <div class="search-bar">
          <el-form :inline="true" :model="userSearchForm" class="search-form">
            <el-form-item>
              <el-input
                v-model="userSearchForm.keyword"
                placeholder="搜索用户名、邮箱"
                clearable
                @keyup.enter="handleUserSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-select v-model="userSearchForm.user_type" placeholder="用户类型" clearable>
                <el-option label="学生" value="student" />
                <el-option label="教师" value="teacher" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUserSearch">搜索</el-button>
              <el-button @click="handleUserReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-container">
          <el-table
            :data="userTableData"
            v-loading="userLoading"
            style="width: 100%"
            row-key="id"
          >
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="email" label="邮箱" width="180" />
            <el-table-column prop="user_type" label="用户类型" width="100">
              <template #default="scope">
                <el-tag :type="getUserTypeTagType(scope.row.user_type)">
                  {{ getUserTypeLabel(scope.row.user_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                  {{ scope.row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="permission_count" label="权限数量" width="100">
              <template #default="scope">
                <el-badge :value="scope.row.permission_count" class="permission-badge">
                  <el-icon><Key /></el-icon>
                </el-badge>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="scope">
                {{ formatDateTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleManageUserPermissions(scope.row)"
                >
                  管理权限
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="userPagination.current"
              v-model:page-size="userPagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="userPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleUserSizeChange"
              @current-change="handleUserCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 使用示例 -->
      <el-tab-pane label="使用示例" name="demo">
        <PermissionDemo />
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑权限对话框 -->
    <el-dialog
      v-model="showAddPermissionDialog"
      :title="editingPermission ? '编辑权限' : '添加权限'"
      width="600px"
      @close="handlePermissionDialogClose"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionFormRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="permission_name">
          <el-input v-model="permissionForm.permission_name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限标识符" prop="permission_key">
          <el-input v-model="permissionForm.permission_key" placeholder="请输入权限标识符" />
          <div class="form-tip">格式建议：view_students, edit_grades 等</div>
        </el-form-item>
        <el-form-item label="权限分类" prop="category">
          <el-input v-model="permissionForm.category" placeholder="请输入权限分类" />
          <div class="form-tip">如：学生管理、成绩管理、系统管理等</div>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddPermissionDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户权限管理对话框 -->
    <el-dialog
      v-model="showUserPermissionDialog"
      :title="`管理用户权限 - ${currentUser?.username}`"
      width="800px"
      @close="handleUserPermissionDialogClose"
    >
      <div class="user-permission-content">
        <div class="permission-list">
          <div class="list-header">
            <h4>可用权限</h4>
            <el-button type="primary" size="small" @click="showBatchAssignDialog = true">
              批量分配
            </el-button>
          </div>
          <el-table
            :data="availablePermissions"
            v-loading="permissionLoading"
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="permission_name" label="权限名称" />
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleAssignPermission(scope.row)"
                >
                  分配
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="user-permissions">
          <div class="list-header">
            <h4>用户权限</h4>
          </div>
          <el-table
            :data="userPermissions"
            v-loading="userPermissionLoading"
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="permission_name" label="权限名称" />
            <el-table-column prop="category" label="分类" width="120">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="is_active" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.is_active ? 'success' : 'danger'" size="small">
                  {{ scope.row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="granted_at" label="分配时间" width="140">
              <template #default="scope">
                {{ formatDateTime(scope.row.granted_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button
                  type="warning"
                  size="small"
                  @click="handleTogglePermissionStatus(scope.row)"
                >
                  {{ scope.row.is_active ? '禁用' : '启用' }}
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleRevokePermission(scope.row)"
                >
                  撤销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 批量分配权限对话框 -->
    <el-dialog
      v-model="showBatchAssignDialog"
      title="批量分配权限"
      width="600px"
    >
      <el-transfer
        v-model="selectedPermissions"
        :data="transferPermissions"
        :titles="['可选权限', '已选权限']"
        :button-texts="['移除', '添加']"
        :format="{
          noChecked: '${total}',
          hasChecked: '${checked}/${total}'
        }"
        filterable
        filter-placeholder="搜索权限"
      />
      <template #footer>
        <el-button @click="showBatchAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchAssign" :loading="submitting">
          确定分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Key } from '@element-plus/icons-vue'
import PermissionDemo from './demo.vue'

const activeTab = ref('permissions')
const permissionLoading = ref(false)
const userLoading = ref(false)
const userPermissionLoading = ref(false)
const submitting = ref(false)
const showAddPermissionDialog = ref(false)
const showUserPermissionDialog = ref(false)
const showBatchAssignDialog = ref(false)
const editingPermission = ref(null)
const currentUser = ref(null)
const permissionFormRef = ref()

const permissionSearchForm = reactive({
  keyword: '',
  category: ''
})

const userSearchForm = reactive({
  keyword: '',
  user_type: ''
})

const userPagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

const permissionTableData = ref([])
const userTableData = ref([])
const permissionCategories = ref([])
const availablePermissions = ref([])
const userPermissions = ref([])
const selectedPermissions = ref([])

const permissionForm = reactive({
  permission_name: '',
  permission_key: '',
  category: '',
  description: ''
})

const permissionFormRules = {
  permission_name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  permission_key: [
    { required: true, message: '请输入权限标识符', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '权限标识符只能包含小写字母和下划线', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请输入权限分类', trigger: 'blur' }
  ]
}

const transferPermissions = computed(() => {
  return availablePermissions.value.map(permission => ({
    key: permission.id,
    label: `${permission.permission_name} (${permission.category})`,
    disabled: false
  }))
})

const fetchPermissions = async () => {
  permissionLoading.value = true
  try {
    const mockData = [
      {
        id: 1,
        permission_name: '查看学生信息',
        permission_key: 'view_students',
        category: '学生管理',
        description: '允许查看学生基本信息和详细资料',
        created_at: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        permission_name: '编辑学生信息',
        permission_key: 'edit_students',
        category: '学生管理',
        description: '允许编辑和修改学生信息',
        created_at: '2024-01-01 10:01:00'
      },
      {
        id: 3,
        permission_name: '录入成绩',
        permission_key: 'input_grades',
        category: '成绩管理',
        description: '允许录入和修改学生成绩',
        created_at: '2024-01-01 10:02:00'
      },
      {
        id: 4,
        permission_name: '查看成绩',
        permission_key: 'view_grades',
        category: '成绩管理',
        description: '允许查看成绩信息和统计数据',
        created_at: '2024-01-01 10:03:00'
      },
      {
        id: 5,
        permission_name: '管理班级',
        permission_key: 'manage_class',
        category: '班级管理',
        description: '允许管理班级信息和班级事务',
        created_at: '2024-01-01 10:04:00'
      }
    ]
    
    permissionTableData.value = mockData
    availablePermissions.value = mockData
    
    // 获取权限分类
    const categories = [...new Set(mockData.map(item => item.category))]
    permissionCategories.value = categories
  } catch (error) {
    console.error('获取权限列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    permissionLoading.value = false
  }
}

const fetchUsers = async () => {
  userLoading.value = true
  try {
    const mockData = [
      {
        id: 1000,
        username: 'admin',
        email: 'admin@example.com',
        user_type: 'admin',
        status: 'active',
        permission_count: 10,
        created_at: '2024-01-01 09:00:00'
      },
      {
        id: 1001,
        username: 'teacher1',
        email: 'teacher1@example.com',
        user_type: 'teacher',
        status: 'active',
        permission_count: 7,
        created_at: '2024-01-02 09:00:00'
      },
      {
        id: 1005,
        username: 'student1',
        email: 'student1@example.com',
        user_type: 'student',
        status: 'active',
        permission_count: 3,
        created_at: '2024-01-03 09:00:00'
      }
    ]
    
    userTableData.value = mockData
    userPagination.total = mockData.length
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    userLoading.value = false
  }
}

const fetchUserPermissions = async (userId) => {
  userPermissionLoading.value = true
  try {
    const mockData = [
      {
        id: 1,
        permission_id: 1,
        permission_name: '查看学生信息',
        permission_key: 'view_students',
        category: '学生管理',
        is_active: true,
        granted_at: '2024-01-01 10:00:00',
        expires_at: null
      },
      {
        id: 2,
        permission_id: 3,
        permission_name: '录入成绩',
        permission_key: 'input_grades',
        category: '成绩管理',
        is_active: true,
        granted_at: '2024-01-01 10:00:00',
        expires_at: null
      }
    ]
    
    userPermissions.value = mockData
  } catch (error) {
    console.error('获取用户权限失败:', error)
    ElMessage.error('获取用户权限失败')
  } finally {
    userPermissionLoading.value = false
  }
}

const handleTabClick = (tab) => {
  if (tab.paneName === 'permissions') {
    fetchPermissions()
  } else if (tab.paneName === 'users') {
    fetchUsers()
  }
}

const handlePermissionSearch = () => {
  fetchPermissions()
}

const handlePermissionReset = () => {
  Object.assign(permissionSearchForm, {
    keyword: '',
    category: ''
  })
  fetchPermissions()
}

const handleUserSearch = () => {
  userPagination.current = 1
  fetchUsers()
}

const handleUserReset = () => {
  Object.assign(userSearchForm, {
    keyword: '',
    user_type: ''
  })
  userPagination.current = 1
  fetchUsers()
}

const handleUserSizeChange = (val) => {
  userPagination.size = val
  userPagination.current = 1
  fetchUsers()
}

const handleUserCurrentChange = (val) => {
  userPagination.current = val
  fetchUsers()
}

const handleEditPermission = (row) => {
  editingPermission.value = row
  Object.assign(permissionForm, row)
  showAddPermissionDialog.value = true
}

const handleDeletePermission = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${row.permission_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('删除成功')
    fetchPermissions()
  } catch (error) {
    console.log('取消删除')
  }
}

const handlePermissionSubmit = async () => {
  if (!permissionFormRef.value) return
  
  try {
    await permissionFormRef.value.validate()
    submitting.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(editingPermission.value ? '更新成功' : '添加成功')
    showAddPermissionDialog.value = false
    fetchPermissions()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const handlePermissionDialogClose = () => {
  editingPermission.value = null
  Object.assign(permissionForm, {
    permission_name: '',
    permission_key: '',
    category: '',
    description: ''
  })
  permissionFormRef.value?.clearValidate()
}

const handleManageUserPermissions = (row) => {
  currentUser.value = row
  showUserPermissionDialog.value = true
  fetchUserPermissions(row.id)
}

const handleUserPermissionDialogClose = () => {
  currentUser.value = null
  userPermissions.value = []
  selectedPermissions.value = []
}

const handleAssignPermission = async (permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要为用户 "${currentUser.value.username}" 分配权限 "${permission.permission_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    ElMessage.success('权限分配成功')
    fetchUserPermissions(currentUser.value.id)
  } catch (error) {
    console.log('取消分配')
  }
}

const handleRevokePermission = async (permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要撤销权限 "${permission.permission_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ElMessage.success('权限撤销成功')
    fetchUserPermissions(currentUser.value.id)
  } catch (error) {
    console.log('取消撤销')
  }
}

const handleTogglePermissionStatus = async (permission) => {
  try {
    const action = permission.is_active ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}权限 "${permission.permission_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    ElMessage.success(`权限${action}成功`)
    fetchUserPermissions(currentUser.value.id)
  } catch (error) {
    console.log('取消操作')
  }
}

const handleBatchAssign = async () => {
  if (selectedPermissions.value.length === 0) {
    ElMessage.warning('请选择要分配的权限')
    return
  }
  
  try {
    submitting.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(`批量分配 ${selectedPermissions.value.length} 个权限成功`)
    showBatchAssignDialog.value = false
    selectedPermissions.value = []
    fetchUserPermissions(currentUser.value.id)
  } catch (error) {
    console.error('批量分配失败:', error)
    ElMessage.error('批量分配失败')
  } finally {
    submitting.value = false
  }
}

const getUserTypeTagType = (type) => {
  const typeMap = {
    admin: 'danger',
    teacher: 'warning',
    student: 'success'
  }
  return typeMap[type] || 'info'
}

const getUserTypeLabel = (type) => {
  const typeMap = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return typeMap[type] || type
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  return new Date(datetime).toLocaleString()
}

onMounted(() => {
  fetchPermissions()
})
</script>

<style scoped>
.permissions-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-bar {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.search-form {
  margin: 0;
}

.table-container {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.user-permission-content {
  display: flex;
  gap: 20px;
}

.permission-list,
.user-permissions {
  flex: 1;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.list-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.permission-badge {
  margin-right: 8px;
}
</style>