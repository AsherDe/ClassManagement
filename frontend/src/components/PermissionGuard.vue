<template>
  <div v-if="hasAccess">
    <slot />
  </div>
  <div v-else-if="showFallback" class="permission-fallback">
    <slot name="fallback">
      <el-empty
        :image-size="80"
        description="权限不足，无法访问此内容"
      >
        <template #image>
          <el-icon color="#909399" size="80">
            <Lock />
          </el-icon>
        </template>
        <el-button type="primary" @click="$emit('request-permission')">
          申请权限
        </el-button>
      </el-empty>
    </slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import { permissionUtils } from '@/services/permissions'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  // 需要的权限（字符串或数组）
  permission: {
    type: [String, Array],
    default: null
  },
  
  // 是否需要所有权限（当permission为数组时生效）
  requireAll: {
    type: Boolean,
    default: false
  },
  
  // 用户类型限制
  userType: {
    type: [String, Array],
    default: null
  },
  
  // 是否显示无权限时的回退内容
  showFallback: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['request-permission'])

const userStore = useUserStore()

const hasAccess = computed(() => {
  const userPermissions = userStore.permissions || []
  const currentUserType = userStore.userInfo?.user_type

  // 检查用户类型
  if (props.userType) {
    const allowedTypes = Array.isArray(props.userType) ? props.userType : [props.userType]
    if (!allowedTypes.includes(currentUserType)) {
      return false
    }
  }

  // 检查权限
  if (props.permission) {
    if (Array.isArray(props.permission)) {
      if (props.requireAll) {
        return permissionUtils.hasAllPermissions(userPermissions, props.permission)
      } else {
        return permissionUtils.hasAnyPermission(userPermissions, props.permission)
      }
    } else {
      return permissionUtils.hasPermission(userPermissions, props.permission)
    }
  }

  // 如果没有指定权限要求，默认允许访问
  return true
})
</script>

<style scoped>
.permission-fallback {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>