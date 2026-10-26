<template>
  <div>
    <h2>个人身份与密钥</h2>
    <el-card>
      <p>当前账户：{{ profile.username }}　机构：{{ profile.organization || '未登记机构' }}</p>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="DID">{{ identity?.did || '尚未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="绑定状态">{{ identity?.bindStatus === 1 ? '已绑定' : '未绑定' }}</el-descriptions-item>
      </el-descriptions>
      <p>签发凭证前需要绑定身份。系统将私钥加密保存在服务器，普通查询不返回私钥；账户机构由管理员登记。</p>
      <el-button :loading="busy" :disabled="identity?.bindStatus === 1" @click="bind">生成密钥并绑定DID</el-button>
      <el-button :loading="busy" @click="migrate">加密迁移本人历史密钥</el-button>
    </el-card>
    <el-card v-if="['admin','regulator'].includes(profile.userType)" style="margin-top:16px">
      <h3>存证任务</h3>
      <el-button @click="loadTasks">刷新任务状态</el-button>
      <el-table :data="tasks">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column label="状态" width="100"><template #default="{row}">{{ ({0:'待执行',1:'已确认',3:'执行中','-1':'失败'})[row.status] }}</template></el-table-column>
        <el-table-column prop="txId" label="真实交易编号" show-overflow-tooltip />
        <el-table-column prop="lastError" label="失败原因" show-overflow-tooltip />
        <el-table-column label="操作" width="100"><template #default="{row}"><el-button v-if="row.status === -1" @click="retry(row.id)">重试</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-card style="margin-top:16px">
      <h3>本人密钥</h3>
      <el-table :data="keys">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="publicKey" label="公钥" show-overflow-tooltip />
        <el-table-column prop="expireTime" label="有效期至" width="180" />
        <el-table-column label="状态" width="100"><template #default="{row}">{{ row.status === 1 ? '有效' : '已停用' }}</template></el-table-column>
        <el-table-column label="默认选择" width="150"><template #default="{row}"><el-button :disabled="row.defaultKey === 1" @click="selectDefault(row.id)">{{ row.defaultKey === 1 ? '已选择' : '设为默认' }}</el-button></template></el-table-column>
      </el-table>
      <p>当前DID的签名使用其绑定公钥对应的密钥。默认选择用于下次绑定身份，不会替换现有DID的公钥。</p>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
const profile = ref({}), identity = ref(null), keys = ref([]), busy = ref(false), tasks = ref([])
const loadTasks = async () => { const result=await request.get('/admin/chain-tasks');tasks.value=result.data?.records || [] }
const retry = async id => { await request.post(`/admin/chain-tasks/${id}/retry`);await loadTasks();ElMessage.success('已加入重试队列') }
const load = async () => {
  const [p,d,k] = await Promise.all([request.get('/user/info'),request.get('/did/info'),request.get('/rsa/list')])
  profile.value=p.data || {};identity.value=d.data;keys.value=k.data || []
}
const bind = async () => {
  busy.value=true
  try { await request.post('/did/bind',{});await load();ElMessage.success('身份已绑定') } finally { busy.value=false }
}
const migrate = async () => {
  busy.value=true
  try { const result=await request.post('/rsa/migrate');await load();ElMessage.success(`已加密迁移${result.data}把历史密钥`) } finally { busy.value=false }
}
const selectDefault = async id => { await request.put(`/rsa/${id}/default`);await load() }
onMounted(load)
</script>
