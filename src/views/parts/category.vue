<template>
  <div class="page-container">
    <div class="page-header">
      <h2>零部件分类</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>

    <div class="category-layout">
      <div class="tree-panel">
        <div class="panel-title">分类树</div>
        <el-tree :data="categoryTree" v-loading="loading" node-key="id"
          :props="{ label: 'categoryName', children: 'children' }"
          :default-expand-all="true" highlight-current @node-click="handleNodeClick">
          <template #default="{ node, data }">
            <span class="tree-node">
              <span>{{ data.categoryName }}</span>
              <span class="tree-actions">
                <el-icon class="action-icon" @click.stop="openDialog(data)"><Edit /></el-icon>
                <el-icon class="action-icon danger" @click.stop="deleteCategory(data)"><Delete /></el-icon>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="table-panel">
        <div class="panel-title">分类列表</div>
        <el-table :data="categoryList" v-loading="loading" class="data-table">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="categoryCode" label="分类编码" width="160" />
          <el-table-column prop="categoryName" label="分类名称" min-width="150" />
          <el-table-column prop="level" label="层级" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="row.level === 1 ? 'primary' : 'info'">{{ row.level === 1 ? '一级' : '二级' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDialog(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="deleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类编码" prop="categoryCode">
          <el-input v-model="form.categoryCode" placeholder="如：CAT001" />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级分类">
          <el-select v-model="form.parentId" placeholder="顶级分类" clearable style="width:100%">
            <el-option v-for="cat in topCategories" :key="cat.id" :label="cat.categoryName" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import mockData from '@/utils/mock'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const formRef = ref(null)
const categoryList = ref([])
const categoryTree = ref([])

const form = reactive({ id: null, categoryCode: '', categoryName: '', parentId: 0, sort: 0, description: '' })
const rules = {
  categoryCode: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}
const topCategories = computed(() => categoryList.value.filter(c => c.parentId === 0))

const fetchCategories = () => {
  loading.value = true
  setTimeout(() => {
    categoryList.value = mockData.getMockData('/api/parts/category/list', 'get').data.list
    categoryTree.value = mockData.getMockData('/api/parts/category/tree', 'get').data
    loading.value = false
  }, 300)
}

const handleNodeClick = () => {}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) { dialogTitle.value = '编辑分类'; Object.assign(form, row) }
  else { dialogTitle.value = '新增分类'; Object.assign(form, { id: null, categoryCode: '', categoryName: '', parentId: 0, sort: 0, description: '' }) }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        if (form.id) {
          const idx = mockData.categories.findIndex(c => c.id === form.id)
          if (idx !== -1) Object.assign(mockData.categories[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.categories.push({ ...form, id: Date.now(), level: form.parentId ? 2 : 1, status: 1 })
          ElMessage.success('创建成功')
        }
        submitting.value = false; dialogVisible.value = false; fetchCategories()
      }, 400)
    }
  })
}

const deleteCategory = async (row) => {
  await ElMessageBox.confirm(`确定删除分类「${row.categoryName}」吗？`, '警告', { type: 'warning' })
  const idx = mockData.categories.findIndex(c => c.id === row.id)
  if (idx !== -1) mockData.categories.splice(idx, 1)
  ElMessage.success('删除成功'); fetchCategories()
}

onMounted(fetchCategories)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.category-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
.tree-panel, .table-panel { background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
.panel-title { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
.tree-node { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.tree-actions { display: none; gap: 8px; }
.tree-node:hover .tree-actions { display: flex; }
.action-icon { font-size: 14px; cursor: pointer; color: #475569; transition: color .2s; }
.action-icon:hover { color: #3b82f6; }
.action-icon.danger:hover { color: #dc2626; }
:deep(.el-tree) { background: transparent; color: #1e293b; }
:deep(.el-tree-node__content:hover) { background: rgba(74,144,226,0.1); }
:deep(.el-tree-node.is-current > .el-tree-node__content) { background: rgba(74,144,226,0.15); color: #3b82f6; }
</style>
