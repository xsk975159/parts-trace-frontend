<template>
  <div class="page-container">
    <div class="page-header">
      <h2>业务规则配置</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增规则</el-button>
    </div>

    <div class="rule-grid">
      <div class="rule-card" v-for="rule in ruleList" :key="rule.id">
        <div class="rule-card-header">
          <div class="rule-info">
            <div class="rule-name">{{ rule.ruleName }}</div>
            <el-tag :type="ruleTypeTag(rule.ruleType)" size="small">{{ ruleTypeLabel(rule.ruleType) }}</el-tag>
          </div>
          <el-switch v-model="rule.status" :active-value="1" :inactive-value="0" @change="toggleRule(rule)" />
        </div>
        <div class="rule-desc">{{ rule.description }}</div>
        <div class="rule-code">规则编码：{{ rule.ruleCode }}</div>
        <div class="rule-footer">
          <span class="rule-time">创建于 {{ rule.createTime }}</span>
          <div>
            <el-button size="small" link type="primary" @click="openDialog(rule)">编辑</el-button>
            <el-button size="small" link type="danger" @click="deleteRule(rule)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="ruleList.length === 0" description="暂无规则" />

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input v-model="form.ruleCode" placeholder="如：RULE001" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="form.ruleType" style="width:100%">
            <el-option label="时效规则" value="time" />
            <el-option label="流程规则" value="process" />
            <el-option label="质量规则" value="quality" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="描述规则的触发条件和作用" />
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input v-model="form.condition" type="textarea" :rows="3" placeholder='JSON格式，如：{"eventType":"production","maxHours":24}' />
        </el-form-item>
        <el-form-item label="处理动作">
          <el-input v-model="form.action" type="textarea" :rows="3" placeholder='JSON格式，如：{"alertLevel":"warning"}' />
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
const dialogTitle = ref('新增规则')
const formRef = ref(null)
const ruleList = ref([])

const form = reactive({
  id: null, ruleName: '', ruleCode: '', ruleType: 'time',
  description: '', condition: '', action: ''
})

const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleCode: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
}

const ruleTypeLabel = (t) => ({ time: '时效规则', process: '流程规则', quality: '质量规则' }[t] || t)
const ruleTypeTag = (t) => ({ time: 'warning', process: '', quality: 'success' }[t] || '')

const fetchRules = () => {
  loading.value = true
  setTimeout(() => {
    const res = mockData.getMockData('/api/anomaly/rule/list', 'get')
    ruleList.value = res.data.list
    loading.value = false
  }, 300)
}

const openDialog = (row = null) => {
  if (formRef.value) formRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑规则'
    Object.assign(form, row)
  } else {
    dialogTitle.value = '新增规则'
    Object.assign(form, { id: null, ruleName: '', ruleCode: '', ruleType: 'time', description: '', condition: '', action: '' })
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
          const idx = mockData.rules.findIndex(r => r.id === form.id)
          if (idx !== -1) Object.assign(mockData.rules[idx], form)
          ElMessage.success('更新成功')
        } else {
          mockData.rules.push({ ...form, id: Date.now(), status: 1, createTime: new Date().toLocaleString() })
          ElMessage.success('创建成功')
        }
        submitting.value = false
        dialogVisible.value = false
        fetchRules()
      }, 400)
    }
  })
}

const deleteRule = async (row) => {
  await ElMessageBox.confirm(`确定删除规则「${row.ruleName}」吗？`, '警告', { type: 'warning' })
  const idx = mockData.rules.findIndex(r => r.id === row.id)
  if (idx !== -1) mockData.rules.splice(idx, 1)
  ElMessage.success('删除成功')
  fetchRules()
}

const toggleRule = (row) => {
  ElMessage.success(`规则「${row.ruleName}」已${row.status === 1 ? '启用' : '禁用'}`)
}

onMounted(fetchRules)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }

.rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.rule-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  transition: all .3s;
}
.rule-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.25); }

.rule-card-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; margin-bottom: 12px;
}
.rule-info { display: flex; flex-direction: column; gap: 6px; }
.rule-name { font-size: 16px; font-weight: 700; color: #1e293b; }
.rule-desc { font-size: 13px; color: #475569; margin-bottom: 8px; line-height: 1.6; }
.rule-code { font-size: 12px; color: #94a3b8; font-family: monospace; }
.rule-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;
}
.rule-time { font-size: 12px; color: #94a3b8; }
</style>
