<template>
  <div class="page-container">
    <div class="page-header">
      <h2>零部件列表</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增零部件</el-button>
    </div>

    <div class="search-bar">
      <el-input v-model="searchForm.keyword" placeholder="搜索编码/名称" clearable style="width:220px"
        @clear="fetchParts" @keyup.enter="fetchParts">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="searchForm.categoryId" placeholder="零部件分类" clearable style="width:160px" @change="fetchParts">
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.categoryName" :value="cat.id" />
      </el-select>
      <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:120px" @change="fetchParts">
        <el-option label="正常" :value="1" />
        <el-option label="草稿" :value="0" />
        <el-option label="已归档" :value="2" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchParts">搜索</el-button>
    </div>

    <el-table :data="partsList" v-loading="loading" class="data-table">
      <el-table-column prop="partsCode" label="零部件编码" width="140" />
      <el-table-column prop="partsName" label="名称" min-width="150" />
      <el-table-column prop="batchNumber" label="批次号" width="130" />
      <el-table-column prop="specification" label="规格型号" width="130" />
      <el-table-column prop="manufacturer" label="生产厂商" width="120" />
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column prop="unit" label="单位" width="60" />
      <el-table-column prop="productionDate" label="生产日期" width="120" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="viewDetail(row)">详情</el-button>
          <el-button size="small" link type="success" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" link type="danger" @click="deleteParts(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size"
        :total="pagination.total" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next"
        background @size-change="fetchParts" @current-change="fetchParts" />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="660px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="零部件编码" prop="partsCode"><el-input v-model="form.partsCode" placeholder="P20240001" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="零部件名称" prop="partsName"><el-input v-model="form.partsName" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号" prop="batchNumber"><el-input v-model="form.batchNumber" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="categoryId">
              <el-select v-model="form.categoryId" style="width:100%">
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.categoryName" :value="cat.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号"><el-input v-model="form.specification" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材质"><el-input v-model="form.material" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数量"><el-input-number v-model="form.quantity" :min="0" style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位"><el-input v-model="form.unit" placeholder="个/件/套" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂商"><el-input v-model="form.manufacturer" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产日期">
              <el-date-picker v-model="form.productionDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质量标准"><el-input v-model="form.qualityStandard" placeholder="如：ISO9001" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重量(kg)"><el-input-number v-model="form.weight" :min="0" :precision="3" style="width:100%" /></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="详细描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="零部件详情" size="500px">
      <div class="detail-content" v-if="currentPart">
        <div class="detail-header">
          <div class="detail-code">{{ currentPart.partsCode }}</div>
          <el-tag :type="statusTag(currentPart.status)" size="large">{{ statusLabel(currentPart.status) }}</el-tag>
        </div>
        <div class="detail-name">{{ currentPart.partsName }}</div>
        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="批次号">{{ currentPart.batchNumber }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentPart.specification }}</el-descriptions-item>
          <el-descriptions-item label="材质">{{ currentPart.material }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentPart.quantity }} {{ currentPart.unit }}</el-descriptions-item>
          <el-descriptions-item label="重量">{{ currentPart.weight }} kg</el-descriptions-item>
          <el-descriptions-item label="生产厂商">{{ currentPart.manufacturer }}</el-descriptions-item>
          <el-descriptions-item label="生产日期">{{ currentPart.productionDate }}</el-descriptions-item>
          <el-descriptions-item label="质量标准">{{ currentPart.qualityStandard }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentPart.createTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
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
const drawerVisible = ref(false)
const dialogTitle = ref('新增零部件')
const formRef = ref(null)
const partsList = ref([])
const categories = ref([])
const currentPart = ref(null)

const searchForm = reactive({ keyword: '', categoryId: '', status: '' })
const pagination = reactive({ page: 1, size: 10, total: 0 })

const form = reactive({
  id: null, partsCode: '', partsName: '', batchNumber: '', categoryId: '',
  specification: '', material: '', quantity: 0, unit: '个',
  manufacturer: '', productionDate: '', qualityStandard: '', weight: 0, description: ''
})

const rules = {
  partsCode: [{ required: true, message: '请输入零部件编码', trigger: 'blur' }],
  partsName: [{ required: true, message: '请输入零部件名称', trigger: 'blur' }],
  batchNumber: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const statusLabel = (s) => ({ 0: '草稿', 1: '正常', 2: '已归档', 3: '已废弃' }[s] ?? '未知')
const statusTag = (s) => ({ 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }[s] ?? '')

const fetchParts = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/parts/list', 'get')
    let list = res.data.list
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      list = list.filter(p => p.partsCode.includes(kw) || p.partsName.includes(kw))
    }
    if (searchForm.categoryId) list = list.filter(p => p.categoryId === searchForm.categoryId)
    if (searchForm.status !== '') list = list.filter(p => p.status === searchForm.status)
    pagination.total = list.length
    partsList.value = list
    loading.value = false
  }, 300)
}

const fetchCategories = () => {
  categories.value = mockData.getMockData('/api/parts/category/list', 'get').data.list
}

const viewDetail = (row) => { currentPart.value = row; drawerVisible.value = true }

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑零部件'; Object.assign(form, row)
  } else {
    dialogTitle.value = '新增零部件'
    Object.assign(form, { id: null, partsCode: '', partsName: '', batchNumber: '', categoryId: '',
      specification: '', material: '', quantity: 0, unit: '个',
      manufacturer: '', productionDate: '', qualityStandard: '', weight: 0, description: '' })
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
          const idx = mockData.parts.findIndex(p => p.id === form.id)
          if (idx !== -1) Object.assign(mockData.parts[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.parts.push({ ...form, id: Date.now(), status: 1, creatorId: 1, createTime: new Date().toLocaleString() })
          ElMessage.success('创建成功')
        }
        submitting.value = false; dialogVisible.value = false; fetchParts()
      }, 400)
    }
  })
}

const deleteParts = async (row) => {
  await ElMessageBox.confirm(`确定删除零部件「${row.partsName}」吗？`, '警告', { type: 'warning' })
  const idx = mockData.parts.findIndex(p => p.id === row.id)
  if (idx !== -1) mockData.parts.splice(idx, 1)
  ElMessage.success('删除成功'); fetchParts()
}

onMounted(() => { fetchCategories(); fetchParts() })
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.search-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.detail-content { padding: 0 4px; }
.detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.detail-code { font-size: 18px; font-weight: 700; color: #3b82f6; }
.detail-name { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 20px; }
:deep(.el-descriptions__label) { background: #f1f5f9; color: #475569; }
:deep(.el-descriptions__content) { background: #ffffff; color: #1e293b; }
</style>
