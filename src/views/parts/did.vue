<template>
  <div class="page-container">
    <div class="page-header">
      <h2>DID 管理</h2>
      <div class="header-actions">
        <el-input v-model="generatePartsId" placeholder="输入零部件ID" style="width: 160px" />
        <el-button type="primary" @click="handleGenerateDid">生成DID</el-button>
      </div>
    </div>
    <div class="tip-text">说明：这里默认只展示单件DID。按零部件ID生成时，会对该批次下所有单件逐个生成。</div>

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
      <el-table-column prop="bindStatus" label="绑定" width="80">
        <template #default="{ row }">
          <el-tag :type="row.bindStatus === 1 ? 'success' : 'info'" size="small">
            {{ row.bindStatus === 1 ? '已绑定' : '未绑定' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="didStatus" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.didStatus)" size="small">{{ statusText(row.didStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="showDoc(row)">文档</el-button>
          <el-button v-if="row.bindStatus !== 1" link type="success" size="small" @click="openBind(row)">绑定</el-button>
          <el-button v-else link type="warning" size="small" @click="handleUnbind(row)">解绑</el-button>
          <el-button v-if="row.didStatus !== 2" link type="danger" size="small" @click="handleFreeze(row)">冻结</el-button>
          <el-button v-else link type="success" size="small" @click="handleUnfreeze(row)">解冻</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="bindDialog" title="绑定物理标识" width="420px">
      <el-form :model="bindForm" label-width="90px">
        <el-form-item label="绑定类型">
          <el-select v-model="bindForm.bindType" style="width: 100%">
            <el-option label="二维码" value="QRCODE" />
            <el-option label="RFID" value="RFID" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定码">
          <el-input v-model="bindForm.bindCode" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="bindForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBind">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="docDialog" title="DID 文档" width="760px">
      <pre class="doc-pre">{{ currentDoc }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bindDid, freezeDid, generateDidSync, getDidDocument, getDidList, unbindDid, unfreezeDid } from '@/api/did'

const loading = ref(false)
const list = ref([])
const query = reactive({ partsId: '', batchNumber: '', did: '', status: '' })
const generatePartsId = ref('')

const bindDialog = ref(false)
const currentDidId = ref(null)
const bindForm = reactive({ bindType: 'QRCODE', bindCode: '', remark: '' })

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

const openBind = (row) => {
  currentDidId.value = row.id
  bindForm.bindType = 'QRCODE'
  bindForm.bindCode = ''
  bindForm.remark = ''
  bindDialog.value = true
}

const submitBind = async () => {
  if (!bindForm.bindCode) {
    ElMessage.warning('请输入绑定码')
    return
  }
  await bindDid(currentDidId.value, bindForm)
  ElMessage.success('绑定成功')
  bindDialog.value = false
  await fetchList()
}

const handleUnbind = async (row) => {
  await ElMessageBox.confirm(`确认解绑 DID：${row.did} ?`, '提示', { type: 'warning' })
  await unbindDid(row.id)
  ElMessage.success('解绑成功')
  await fetchList()
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

const showDoc = async (row) => {
  const res = await getDidDocument(row.id)
  currentDoc.value = res.data || ''
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
  padding: 12px;
  max-height: 460px;
  overflow: auto;
  font-size: 12px;
}
</style>
