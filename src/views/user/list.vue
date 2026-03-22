<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户列表</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增用户</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="搜索用户名/姓名/邮箱" clearable style="width:260px" @clear="fetchUsers" @keyup.enter="fetchUsers">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="searchForm.userType" placeholder="用户类型" clearable style="width:160px" @change="fetchUsers">
        <el-option label="普通用户" value="normal" />
        <el-option label="供应链用户" value="supply_chain" />
        <el-option label="监管机构" value="regulator" />
      </el-select>
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:120px" @change="fetchUsers">
        <el-option label="启用" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchUsers">搜索</el-button>
    </div>

    <el-table :data="userList" v-loading="loading" class="data-table">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="130" />
      <el-table-column prop="realName" label="姓名" width="110" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="userType" label="用户类型" width="120">
        <template #default="{ row }">
          <el-tag :type="userTypeTag(row.userType)" size="small">{{ userTypeLabel(row.userType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deleteUser(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="fetchUsers"
        @current-change="fetchUsers"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="form.userType" style="width:100%">
            <el-option label="普通用户" value="normal" />
            <el-option label="供应链用户" value="supply_chain" />
            <el-option label="监管机构" value="regulator" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
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
import { Plus, Search } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const dialogTitle = ref('新增用户')

const searchForm = reactive({ keyword: '', userType: '', status: '' })
const pagination = reactive({ page: 1, size: 10, total: 0 })
const userList = ref([])

const form = reactive({
  id: null, username: '', password: '', realName: '',
  email: '', phone: '', userType: 'normal', remark: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [{ required: true, type: 'email', message: '请输入正确邮箱', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  userType: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

const userTypeLabel = (type) => ({ normal: '普通用户', supply_chain: '供应链用户', regulator: '监管机构' }[type] || type)
const userTypeTag = (type) => ({ normal: '', supply_chain: 'success', regulator: 'warning' }[type] || '')

const fetchUsers = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/user/list', 'get')
    let list = res.data.list
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      list = list.filter(u => u.username.includes(kw) || u.realName.includes(kw) || u.email.includes(kw))
    }
    if (searchForm.userType) list = list.filter(u => u.userType === searchForm.userType)
    if (searchForm.status !== '') list = list.filter(u => u.status === searchForm.status)
    pagination.total = list.length
    userList.value = list
    loading.value = false
  }, 300)
}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑用户'
    Object.assign(form, { ...row, password: '' })
  } else {
    dialogTitle.value = '新增用户'
    Object.assign(form, { id: null, username: '', password: '', realName: '', email: '', phone: '', userType: 'normal', remark: '' })
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        if (form.id) {
          const idx = mockData.users.findIndex(u => u.id === form.id)
          if (idx !== -1) Object.assign(mockData.users[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.users.push({ ...form, id: Date.now(), createTime: new Date().toLocaleString(), status: 1 })
          ElMessage.success('创建成功')
        }
        submitting.value = false
        dialogVisible.value = false
        fetchUsers()
      }, 400)
    }
  })
}

const deleteUser = async (row) => {
  await ElMessageBox.confirm(`确定删除用户「${row.realName}」吗？`, '警告', { type: 'warning' })
  const idx = mockData.users.findIndex(u => u.id === row.id)
  if (idx !== -1) mockData.users.splice(idx, 1)
  ElMessage.success('删除成功')
  fetchUsers()
}

const toggleStatus = (row) => {
  ElMessage.success(`已${row.status === 1 ? '启用' : '禁用'}用户「${row.realName}」`)
}

onMounted(fetchUsers)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.search-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.data-table { background: #ffffff; border-radius: 12px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
