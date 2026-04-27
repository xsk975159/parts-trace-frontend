<template>
  <div class="page-container">
    <div class="page-header">
      <h2>零部件分类管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增分类</el-button>
    </div>

    <div class="content-layout">
      <div class="tree-panel" v-loading="treeLoading">
        <div class="panel-title">分类树</div>
        <el-tree
          :data="categoryTree"
          node-key="id"
          :props="treeProps"
          highlight-current
          default-expand-all
          @node-click="handleTreeNodeClick"
        />
      </div>

      <div class="table-panel" v-loading="loading">
        <div class="panel-title">
          分类列表
          <el-button link type="primary" @click="clearTreeFilter">清空筛选</el-button>
        </div>

        <el-table :data="displayList" class="data-table">
          <el-table-column prop="categoryCode" label="分类编码" width="180" />
          <el-table-column prop="categoryName" label="分类名称" min-width="180" />
          <el-table-column prop="parentId" label="父级ID" width="100" />
          <el-table-column prop="level" label="层级" width="80" />
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="openDialog(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click="removeCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类编码" prop="categoryCode">
          <el-input v-model="form.categoryCode" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级分类">
          <el-tree-select
            v-model="form.parentId"
            :data="parentTreeOptions"
            :props="treeProps"
            check-strictly
            clearable
            default-expand-all
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="层级">
          <el-input-number v-model="form.level" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getCategoryList,
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory
} from '@/api/parts'

const loading = ref(false)
const treeLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const formRef = ref(null)

const categoryList = ref([])
const categoryTree = ref([])
const selectedTreeNodeId = ref(null)

const treeProps = { label: 'categoryName', children: 'children' }

const form = reactive({
  id: null,
  categoryCode: '',
  categoryName: '',
  parentId: 0,
  level: 1,
  sort: 0,
  status: 1
})

const rules = {
  categoryCode: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  categoryName: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const selectedNodeIdSet = computed(() => {
  if (!selectedTreeNodeId.value) return null

  const idSet = new Set([selectedTreeNodeId.value])
  const walk = (nodes) => {
    nodes.forEach((node) => {
      if (node.parentId === selectedTreeNodeId.value) {
        idSet.add(node.id)
      }
    })
    let changed = false
    nodes.forEach((node) => {
      if (!idSet.has(node.id) && idSet.has(node.parentId)) {
        idSet.add(node.id)
        changed = true
      }
    })
    if (changed) walk(nodes)
  }

  walk(categoryList.value)
  return idSet
})

const displayList = computed(() => {
  if (!selectedNodeIdSet.value) return categoryList.value
  return categoryList.value.filter((item) => selectedNodeIdSet.value.has(item.id))
})

const parentTreeOptions = computed(() => {
  return [{ id: 0, categoryName: '顶级分类', children: categoryTree.value }]
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getCategoryList()
    categoryList.value = res.data || []
  } finally {
    loading.value = false
  }
}

const fetchCategoryTree = async () => {
  treeLoading.value = true
  try {
    const res = await getCategoryTree()
    categoryTree.value = res.data || []
  } finally {
    treeLoading.value = false
  }
}

const handleTreeNodeClick = (data) => {
  selectedTreeNodeId.value = data.id
}

const clearTreeFilter = () => {
  selectedTreeNodeId.value = null
}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()

  if (row) {
    dialogTitle.value = '编辑分类'
    Object.assign(form, {
      id: row.id,
      categoryCode: row.categoryCode,
      categoryName: row.categoryName,
      parentId: row.parentId ?? 0,
      level: row.level ?? 1,
      sort: row.sort ?? 0,
      status: row.status ?? 1
    })
  } else {
    dialogTitle.value = '新增分类'
    Object.assign(form, {
      id: null,
      categoryCode: '',
      categoryName: '',
      parentId: selectedTreeNodeId.value || 0,
      level: 1,
      sort: 0,
      status: 1
    })
  }

  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const payload = {
        id: form.id,
        categoryCode: form.categoryCode,
        categoryName: form.categoryName,
        parentId: form.parentId,
        level: form.level,
        sort: form.sort,
        status: form.status
      }

      if (form.id) {
        await updateCategory(payload)
        ElMessage.success('分类更新成功')
      } else {
        await createCategory(payload)
        ElMessage.success('分类创建成功')
      }

      dialogVisible.value = false
      await Promise.all([fetchCategories(), fetchCategoryTree()])
    } finally {
      submitting.value = false
    }
  })
}

const removeCategory = async (row) => {
  await ElMessageBox.confirm(`确认删除分类「${row.categoryName}」吗？`, '提示', { type: 'warning' })
  await deleteCategory(row.id)
  ElMessage.success('删除成功')
  await Promise.all([fetchCategories(), fetchCategoryTree()])
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchCategoryTree()])
})
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }

.content-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
.tree-panel, .table-panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #334155;
  margin-bottom: 10px;
}
</style>
