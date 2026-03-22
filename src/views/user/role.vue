<template>
  <div class="page-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建角色</el-button>
    </div>

    <el-table :data="roleList" v-loading="loading" class="data-table">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="roleCode" label="角色编码" width="150" />
      <el-table-column prop="roleName" label="角色名称" width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" link type="warning" @click="openPermDialog(row)">权限配置</el-button>
          <el-button size="small" link type="danger" @click="deleteRole(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="!!form.id" placeholder="如：admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限配置弹窗 -->
    <el-dialog v-model="permDialogVisible" title="权限配置" width="500px">
      <el-tree
        ref="permTreeRef"
        :data="permTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermIds"
        :props="{ label: 'permissionName', children: 'children' }"
      />
      <template #footer>
        <el-button @click="permDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const permDialogVisible = ref(false)
const formRef = ref(null)
const permTreeRef = ref(null)
const dialogTitle = ref('新建角色')
const roleList = ref([])
const permTree = ref([])
const checkedPermIds = ref([])

const form = reactive({ id: null, roleCode: '', roleName: '', description: '', sort: 0 })

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const fetchRoles = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/role/list', 'get')
    roleList.value = res.data.list
    loading.value = false
  }, 300)
}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑角色'
    Object.assign(form, row)
  } else {
    dialogTitle.value = '新建角色'
    Object.assign(form, { id: null, roleCode: '', roleName: '', description: '', sort: 0 })
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        if (form.id) {
          const idx = mockData.roles.findIndex(r => r.id === form.id)
          if (idx !== -1) Object.assign(mockData.roles[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.roles.push({ ...form, id: Date.now(), status: 1 })
          ElMessage.success('创建成功')
        }
        submitting.value = false
        dialogVisible.value = false
        fetchRoles()
      }, 400)
    }
  })
}

const deleteRole = async (row) => {
  await ElMessageBox.confirm(`确定删除角色"${row.roleName}"吗？`, '警告', { type: 'warning' })
  const idx = mockData.roles.findIndex(r => r.id === row.id)
  if (idx !== -1) mockData.roles.splice(idx, 1)
  ElMessage.success('删除成功')
  fetchRoles()
}

const openPermDialog = (row) => {
  const res = mockData.getMockData('/api/permission/tree', 'get')
  permTree.value = mockData.buildTree(res.data)
  checkedPermIds.value = [1, 2, 3]
  permDialogVisible.value = true
}

const savePermissions = () => {
  ElMessage.success('权限配置已保存')
  permDialogVisible.value = false
}

onMounted(fetchRoles)
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.data-table {
  background: #ffffff;
  border-radius: 12px;
}

:deep(.el-tree) {
  background: transparent;
  color: #1e293b;
}

:deep(.el-tree-node__content:hover) {
  background: rgba(74, 144, 226, 0.1);
}
</style>
