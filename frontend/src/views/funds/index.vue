<template>
  <div class="funds-container">
    <el-card>
      <el-page-header :icon="Wallet" title="返回" content="班费记录">
        <template #extra>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            添加记录
          </el-button>
        </template>
      </el-page-header>
      
      <div class="content-wrapper">
        <el-table :data="funds" stripe>
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === '收入' ? 'success' : 'warning'">
                {{ scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="scope">
              <span :class="scope.row.type === '收入' ? 'income' : 'expense'">
                {{ scope.row.type === '收入' ? '+' : '-' }}{{ scope.row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="operator" label="操作人" width="120" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
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
import { Wallet, Plus } from '@element-plus/icons-vue'

const funds = ref([])

const handleAdd = () => {
  console.log('添加班费记录')
}

const handleEdit = (row) => {
  console.log('编辑班费记录', row)
}

const handleDelete = (row) => {
  console.log('删除班费记录', row)
}

onMounted(() => {
  // 加载班费数据
})
</script>

<style scoped>
.funds-container {
  padding: 20px;
}

.content-wrapper {
  margin-top: 20px;
}

.income {
  color: #67c23a;
}

.expense {
  color: #f56c6c;
}
</style>