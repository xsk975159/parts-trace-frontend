<template>
  <div class="page-container">
    <div class="page-header">
      <h2>权限管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增权限</el-button>
    </div>

    <el-table :data="permList" v-loading="loading" class="data-table" row-key="id"
      :tree-props="{ children: 'children' }" default-expand-all>
      <el-table-column prop="permissionName" label="权限名称" min-width="180" />
      <el-table-column prop="permissionCode" label="权限编码" width="180" />
      <el-table-column prop="permissionType" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.permissionType)" size="small">{{ row.permissionType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路径" width="180" />
      <el-table-column prop="icon" label="图标" width="100" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deletePerm(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="权限编码" prop="permissionCode">
          <el-input v-model="form.permissionCode" placeholder="如：user:list" />
        </el-form-item>
        <el-form-item label="权限名称" prop="permissionName">
          <el-input v-model="form.permissionName" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限类型" prop="permissionType">
          <el-select v-model="form.permissionType" style="width:100%">
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
            <el-option label="接口" value="api" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="form.path" placeholder="如：/user/list" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
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
const dialogTitle = ref('新增权限')
const formRef = ref(null)
const permList = ref([])

const form = reactive({
  id: null, permissionCode: '', permissionName: '',
  permissionType: 'menu', path: '', icon: '', sort: 0
})

const rules = {
  permissionCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permissionName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
  permissionType: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const typeTag = (type) => ({ menu: '', button: 'success', api: 'warning' }[type] || '')

const fetchPerms = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/permission/tree', 'get')
    permList.value = mockData.buildTree(res.data)
    loading.value = false
  }, 300)
}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑权限'
    Object.assign(form, row)
  } else {
    dialogTitle.value = '新增权限'
    Object.assign(form, { id: null, permissionCode: '', permissionName: '', permissionType: 'menu', path: '', icon: '', sort: 0 })
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
          const idx = mockData.permissions.findIndex(p => p.id === form.id)
          if (idx !== -1) Object.assign(mockData.permissions[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.permissions.push({ ...form, id: Date.now(), parentId: 0, status: 1 })
          ElMessage.success('创建成功')
        }
        submitting.value = false
        dialogVisible.value = false
        fetchPerms()
      }, 400)
    }
  })
}

const deletePerm = async (row) => {
  await ElMessageBox.confirm(`确定删除权限「${row.permissionName}」吗？`, '警告', { type: 'warning' })
  const idx = mockData.permissions.findIndex(p => p.id === row.id)
  if (idx !== -1) mockData.permissions.splice(idx, 1)
  ElMessage.success('删除成功')
  fetchPerms()
}

onMounted(fetchPerms)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }

</style>
