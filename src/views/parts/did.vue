<template>
  <div class="page-container">
    <div class="page-header">
      <h2>DID 管理</h2>
      <div class="header-actions">
        <el-input v-model="generatePartsId" placeholder="输入零部件ID" style="width: 160px" />
        <el-button type="primary" @click="handleGenerateDid">生成DID</el-button>
      </div>
    </div>
    <div class="tip-text">说明：默认展示单件 DID。可查看文档、跳转追溯链条、校验 DID 有效性，或对异常单件执行冻结/解冻。</div>

    <div class="search-bar">
      <el-input v-model="query.partsId" placeholder="零部件ID" clearable style="width: 140px" />
      <el-input v-model="query.batchNumber" placeholder="批次号" clearable style="width: 180px" />
      <el-input v-model="query.did" placeholder="DID" clearable style="width: 360px" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="未激活" :value="0" />
        <el-option label="已激活" :value="1" />
        <el-option label="已冻结" :value="2" />
        <el-option label="已归档" :value="3" />
      </el-select>
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>

    <el-table v-loading="loading" :data="list" class="data-table">
      <el-table-column prop="id" label="DID ID" width="90" />
      <el-table-column prop="partsId" label="零部件ID" width="90" />
      <el-table-column prop="unitId" label="单件ID" width="90" />
      <el-table-column prop="unitCode" label="单件编码" min-width="170" show-overflow-tooltip />
      <el-table-column prop="partsName" label="零部件名称" width="140" />
      <el-table-column prop="batchNumber" label="批次号" width="140" />
      <el-table-column prop="did" label="DID" min-width="260" show-overflow-tooltip />
      <el-table-column prop="docCid" label="文档CID" width="180" show-overflow-tooltip />
      <el-table-column label="链上锚定" width="100">
        <template #default="{ row }">
          <el-tag :type="row.chainTxId ? 'success' : 'info'" size="small">
            {{ row.chainTxId ? '已锚定' : '未锚定' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="didStatus" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.didStatus)" size="small">{{ statusText(row.didStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="showDoc(row)">文档</el-button>
          <el-button link type="primary" size="small" @click="goTrace(row)">追溯</el-button>
          <el-button link type="success" size="small" @click="handleValidate(row)">校验</el-button>
          <el-button v-if="row.didStatus !== 2" link type="danger" size="small" @click="handleFreeze(row)">冻结</el-button>
          <el-button v-else link type="success" size="small" @click="handleUnfreeze(row)">解冻</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="validateDialog" title="DID 校验" width="520px">
      <el-descriptions v-if="validateResult" :column="1" border size="small">
        <el-descriptions-item label="DID">{{ validateResult.did || '-' }}</el-descriptions-item>
        <el-descriptions-item label="格式">{{ validateResult.formatValid ? '合法' : '不合法' }}</el-descriptions-item>
        <el-descriptions-item label="库内存在">{{ validateResult.exists ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="激活状态">{{ validateResult.activated ? '已激活' : '未激活' }}</el-descriptions-item>
        <el-descriptions-item label="零部件ID">{{ validateResult.partsId ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ validateResult.message || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="docDialog" title="DID 文档" width="800px">
      <pre class="doc-pre">{{ currentDoc }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { freezeDid, generateDidSync, getDidDocument, getDidList, unfreezeDid, validateDid } from '@/api/did'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const query = reactive({ partsId: '', batchNumber: '', did: '', status: '' })
const generatePartsId = ref('')

const validateDialog = ref(false)
const validateResult = ref(null)

const docDialog = ref(false)
const currentDoc = ref('')

const statusText = (s) => ({ 0: '未激活', 1: '已激活', 2: '已冻结', 3: '已归档' }[s] || '未知')
const statusTag = (s) => ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' }[s] || '')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getDidList({
      partsId: query.partsId || undefined,
      batchNumber: query.batchNumber || undefined,
      did: query.did || undefined,
      status: query.status === '' ? undefined : query.status,
      onlyUnit: true
    })
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

const goTrace = (row) => {
  if (!row?.did) {
    ElMessage.warning('缺少 DID')
    return
  }
  router.push({ path: '/query', query: { did: row.did } })
}

const handleValidate = async (row) => {
  if (!row?.did) {
    ElMessage.warning('缺少 DID')
    return
  }
  const res = await validateDid(row.did)
  validateResult.value = res.data || null
  validateDialog.value = true
}

const handleFreeze = async (row) => {
  await freezeDid(row.id, '手动冻结')
  ElMessage.success('冻结成功')
  await fetchList()
}

const handleUnfreeze = async (row) => {
  await unfreezeDid(row.id)
  ElMessage.success('解冻成功')
  await fetchList()
}

const formatDoc = (raw) => {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'object') return JSON.stringify(raw, null, 2)
  const text = String(raw).trim()
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

const showDoc = async (row) => {
  const res = await getDidDocument(row.id)
  currentDoc.value = formatDoc(res.data)
  docDialog.value = true
}

const handleGenerateDid = async () => {
  if (!generatePartsId.value) {
    ElMessage.warning('请输入零部件ID')
    return
  }
  await generateDidSync(generatePartsId.value)
  ElMessage.success('DID生成成功')
  await fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-header h2 { margin: 0; font-size: 22px; }
.tip-text { margin-top: -6px; color: #64748b; font-size: 13px; }
.header-actions { display: flex; gap: 8px; }
.search-bar { display: flex; gap: 12px; flex-wrap: wrap; }
.doc-pre {
  margin: 0;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  max-height: 520px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
