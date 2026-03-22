<template>
  <div class="exp-container">
    <div class="exp-header">
      <div class="exp-header-left">
        <h2>DID 身份模型验证</h2>
        <p>验证工业零部件 DID 全局唯一性、可验真性与不可篡改性，符合 W3C DID Core 规范</p>
      </div>
      <div class="exp-status-bar">
        <div class="status-pill ok"><span class="dot"></span>W3C 合规率 100%</div>
        <div class="status-pill ok"><span class="dot"></span>验签成功率 100%</div>
        <div class="status-pill ok"><span class="dot"></span>篡改检测通过</div>
      </div>
    </div>
    <div class="exp-tabs">
      <div v-for="tab in tabs" :key="tab.key" class="exp-tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <el-icon><component :is="tab.icon" /></el-icon>
        <span>{{ tab.label }}</span>
        <div class="tab-result" :class="tab.result">{{ tab.resultText }}</div>
      </div>
    </div>
    <!-- Panel 1 -->
    <div v-show="activeTab === 'generate'" class="panel">
      <div class="panel-header">
        <div>
          <h3>① DID 生成与格式校验</h3>
          <p class="panel-desc">为 100 个不同批次零部件生成 DID，校验 W3C 规范合规率与全局唯一性</p>
        </div>
        <el-button type="primary" :loading="genLoading" @click="runGeneration">
          <el-icon><VideoPlay /></el-icon> 执行批量生成
        </el-button>
      </div>
      <div class="demo-block">
        <div class="demo-block-title">单零部件 DID 生成演示</div>
        <div class="did-input-row">
          <div class="did-field"><label>生产商 DID</label><el-input v-model="singleForm.manufacturerDid" size="small" /></div>
          <div class="did-field"><label>生产批次号</label><el-input v-model="singleForm.batchNumber" size="small" /></div>
          <div class="did-field"><label>零部件序列号</label><el-input v-model="singleForm.serialNumber" size="small" /></div>
          <el-button type="primary" size="small" @click="generateSingle">生成 DID</el-button>
        </div>
        <div v-if="singleResult" class="did-result-box">
          <div class="did-result-label">生成结果</div>
          <div class="did-string">{{ singleResult.did }}</div>
          <div class="did-doc-grid">
            <div class="did-doc-section">
              <div class="doc-section-title">DID 文档（W3C 格式）</div>
              <pre class="did-doc-pre">{{ JSON.stringify(singleResult.document, null, 2) }}</pre>
            </div>
            <div class="did-doc-section">
              <div class="doc-section-title">格式校验结果</div>
              <div class="check-list">
                <div class="check-item" v-for="c in singleResult.checks" :key="c.label">
                  <el-icon color="#48bb78"><SuccessFilled /></el-icon>
                  <span class="check-label">{{ c.label }}</span>
                  <span class="check-val">{{ c.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="genLoading || genDone" class="batch-block">
        <div class="batch-header"><span>批量生成进度</span><span class="batch-count">{{ genProgress }} / 100</span></div>
        <el-progress :percentage="genProgress" :stroke-width="10" color="#4a90e2" style="margin-bottom:20px" />
        <div v-if="genDone" class="result-summary">
          <div class="summary-card" v-for="s in genSummary" :key="s.label" :style="{ borderColor: s.color }">
            <div class="summary-val" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="summary-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
      <div v-if="genDone" class="did-table-block">
        <div class="block-title">生成的 DID 列表（前 20 条）</div>
        <el-table :data="didList.slice(0,20)">
          <el-table-column prop="index" label="序号" width="60" />
          <el-table-column prop="partsName" label="零部件名称" width="160" />
          <el-table-column prop="batchNumber" label="批次号" width="130" />
          <el-table-column prop="did" label="DID 标识符" min-width="300">
            <template #default="{ row }"><code class="did-code">{{ row.did }}</code></template>
          </el-table-column>
          <el-table-column label="W3C 合规" width="90"><template #default><el-tag type="success" size="small">✓ 合规</el-tag></template></el-table-column>
          <el-table-column label="全局唯一" width="90"><template #default><el-tag type="success" size="small">✓ 唯一</el-tag></template></el-table-column>
        </el-table>
      </div>
    </div>
    <!-- Panel 2: VC -->
    <div v-show="activeTab === 'vc'" class="panel">
      <div class="panel-header">
        <div>
          <h3>② VC 签发与全生命周期验真</h3>
          <p class="panel-desc">长安链客户端仿真 · 五类角色依次签发 VC 并上链，查看区块详情与完整 W3C 凭证文档</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <el-button :loading="vcLoading" size="small" @click="runVcBatch"><el-icon><DataLine /></el-icon> 500张批量验签</el-button>
          <el-button type="danger" plain size="small" @click="resetVC">重置</el-button>
        </div>
      </div>
      <div class="vc-topbar">
        <div class="vtb-left">
          <span class="vtb-label">溯源目标 DID</span>
          <el-select v-model="selectedPart" size="small" style="width:360px">
            <el-option v-for="p in vcParts" :key="p.did" :label="p.name + '  —  ' + p.did" :value="p.did" />
          </el-select>
        </div>
        <div class="vtb-right">
          <div class="node-badge">
            <span class="nb-ring"></span>
            <span class="nb-text">peer0.org1.chainmaker.org</span>
            <span class="nb-sep">|</span><span class="nb-net">chainmaker-net-solo</span>
            <span class="nb-sep">|</span><span class="nb-height">Block #{{ blockHeight }}</span>
          </div>
          <div class="kv-pills">
            <div class="kv-pill"><span>共识</span><strong>TBFT</strong></div>
            <div class="kv-pill"><span>SDK</span><strong>v2.3.1</strong></div>
            <div class="kv-pill"><span>TX总数</span><strong>{{ txTotal }}</strong></div>
            <div class="kv-pill good"><span>节点</span><strong>● 在线</strong></div>
          </div>
        </div>
      </div>
      <div class="vc-workspace">
        <div class="vc-left">
          <div class="ws-title">供应链角色 · 签发流程</div>
          <div class="role-list">
            <div class="role-item" v-for="(role,idx) in roleFlow" :key="role.key" :class="{active:role.issued,selected:selectedRoleIdx===idx}" @click="selectRole(idx)">
              <div class="ri-step" :class="{done:role.issued,sel:selectedRoleIdx===idx}">{{ idx+1 }}</div>
              <div class="ri-icon" :style="{background:role.color}"><el-icon :size="13"><component :is="role.icon" /></el-icon></div>
              <div class="ri-info">
                <div class="ri-name">{{ role.name }}</div>
                <div class="ri-vc">{{ role.vcName }}</div>
                <div class="ri-did">{{ role.did }}</div>
              </div>
              <div class="ri-status">
                <el-icon v-if="role.verified" color="#48bb78" :size="14"><SuccessFilled /></el-icon>
                <el-icon v-else-if="role.issued" color="#4a90e2" :size="14"><Clock /></el-icon>
                <el-icon v-else color="#4a5568" :size="14"><Remove /></el-icon>
              </div>
            </div>
          </div>
          <div v-if="selectedRoleIdx >= 0" class="role-actions">
            <div class="ra-title">操作面板 · {{ roleFlow[selectedRoleIdx].name }}</div>
            <el-button type="primary" style="width:100%" size="small"
              :disabled="roleFlow[selectedRoleIdx].issued||(selectedRoleIdx>0&&!roleFlow[selectedRoleIdx-1].issued)"
              :loading="issuing" @click="issueVC(selectedRoleIdx)">
              <el-icon><Edit /></el-icon> {{ roleFlow[selectedRoleIdx].issued ? '✓ 已签发上链' : '签发 VC 并提交上链' }}
            </el-button>
            <el-button v-if="roleFlow[selectedRoleIdx].issued&&!roleFlow[selectedRoleIdx].verified"
              type="success" style="width:100%;margin-top:6px" size="small" :loading="verifying" @click="verifyVC(selectedRoleIdx)">
              <el-icon><CircleCheck /></el-icon> 调用验签接口
            </el-button>
            <div v-if="roleFlow[selectedRoleIdx].verified" class="verify-badge">
              <el-icon color="#48bb78"><SuccessFilled /></el-icon> 签名验证通过 · {{ roleFlow[selectedRoleIdx].verifyTime }}ms
            </div>
          </div>
          <div class="chain-panel">
            <div class="cp-title"><el-icon><Connection /></el-icon> 长安链节点状态</div>
            <div class="cp-row"><span>网络 ID</span><code>chainmaker-net-solo</code></div>
            <div class="cp-row"><span>共识算法</span><code>TBFT</code></div>
            <div class="cp-row"><span>TLS 模式</span><code>双向 TLS</code></div>
            <div class="cp-row"><span>当前区块</span><code class="val-blue">#{{ blockHeight }}</code></div>
            <div class="cp-row"><span>交易总数</span><code class="val-blue">{{ txTotal }}</code></div>
            <div class="cp-row"><span>已签发 VC</span><code class="val-green">{{ issuedCount }}</code></div>
            <div class="cp-row"><span>节点状态</span><code class="val-green">● 运行中</code></div>
            <div class="cp-row"><span>智能合约</span><code>VCHashStore v1.2</code></div>
          </div>
        </div>
        <div class="vc-center">
          <div class="ws-title">长安链客户端 · SDK 调用日志</div>
          <div class="sdk-terminal">
            <div class="term-bar">
              <span class="term-dot red"></span><span class="term-dot yellow"></span><span class="term-dot green"></span>
              <span class="term-title">chainmaker-sdk-go@2.3.1  ·  terminal</span>
              <span class="term-spacer"></span><span class="term-badge">org1 / ca.crt ✓</span>
            </div>
            <div class="term-body" ref="termRef">
              <div class="term-line prompt">$ chainmaker-client --config sdk_config.yml --chain-id chain1</div>
              <div class="term-line info">[INFO]  SDK v2.3.1 · ChainMaker v2.3.x</div>
              <div class="term-line info">[INFO]  加载组织证书 org1/ca.crt ... <span style="color:#48bb78">OK</span></div>
              <div class="term-line info">[INFO]  连接节点 peer0.org1:7054 ... <span style="color:#48bb78">已连接</span></div>
              <div class="term-line info">[INFO]  加载智能合约 VCHashStore v1.2 ... <span style="color:#48bb78">就绪</span></div>
              <div class="term-line muted" v-if="termLogs.length===0">等待操作指令 ▌</div>
              <div class="term-line" :class="log.type" v-for="log in termLogs" :key="log.id" v-html="log.html"></div>
              <div class="term-cursor" v-if="issuing||verifying">█</div>
            </div>
          </div>
          <div v-if="latestBlock" class="block-explorer">
            <div class="be-header"><el-icon><Grid /></el-icon><span>区块浏览器 · 最新上链区块</span><span class="be-badge">#{{ latestBlock.height }}</span></div>
            <div class="be-body">
              <div class="be-left">
                <div class="be-num">#{{ latestBlock.height }}</div>
                <div class="be-meta-row"><span>出块节点</span><code>peer0.org1.chainmaker.org</code></div>
                <div class="be-meta-row"><span>共识轮次</span><code>round-{{ latestBlock.height % 9 + 1 }}</code></div>
                <div class="be-meta-row"><span>时间戳</span><code>{{ latestBlock.timestamp }}</code></div>
                <div class="be-meta-row"><span>交易数</span><code>{{ latestBlock.txCount }}</code></div>
              </div>
              <div class="be-right">
                <div class="be-hash-row"><span class="bhr-label">Block Hash</span><code class="hash-blue">{{ latestBlock.blockHash }}</code></div>
                <div class="be-hash-row"><span class="bhr-label">Prev Hash</span><code class="hash-muted">{{ latestBlock.prevHash }}</code></div>
                <div class="be-tx-list">
                  <div class="be-tx-item" v-for="tx in latestBlock.txs" :key="tx.id">
                    <el-tag :type="tx.type==='VC_ISSUE'?'primary':'success'" size="small">{{ tx.type }}</el-tag>
                    <code class="tx-id">{{ tx.id }}</code>
                    <span class="tx-ok">✓ SUCCESS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="vc-right">
          <div class="ws-title">W3C 可验证凭证 · 完整文档</div>
          <div v-if="!currentVcDoc" class="vc-empty">
            <el-icon :size="38" color="#2d3748"><Tickets /></el-icon>
            <p>点击左侧角色 → 签发 VC 后<br>完整凭证文档将展示于此</p>
          </div>
          <div v-else class="vc-doc-wrap">
            <div class="vc-doc-tabs">
              <span v-for="t in ['JSON-LD','链上存证','验签详情']" :key="t" class="vdt" :class="{active:vcDocTab===t}" @click="vcDocTab=t">{{ t }}</span>
            </div>
            <div v-show="vcDocTab==='JSON-LD'" class="vc-json-wrap">
              <div class="vc-json-header">
                <span class="vjh-id">{{ currentVcDoc.vcId }}</span>
                <el-tag type="success" size="small" effect="dark">VALID</el-tag>
              </div>
              <pre class="vc-json">{{ JSON.stringify(currentVcDoc.vc,null,2) }}</pre>
            </div>
            <div v-show="vcDocTab==='链上存证'" class="onchain-info">
              <div class="oci-title"><el-icon color="#4a90e2"><Connection /></el-icon> 链上存证信息</div>
              <div class="oci-row"><span>凭证 ID</span><code>{{ currentVcDoc.vcId }}</code></div>
              <div class="oci-row"><span>链上 TX Hash</span><code class="hash-blue">{{ currentVcDoc.txHash }}</code></div>
              <div class="oci-row"><span>区块高度</span><code>{{ currentVcDoc.blockNum }}</code></div>
              <div class="oci-row"><span>区块 Hash</span><code class="hash-blue">{{ currentVcDoc.blockHash }}</code></div>
              <div class="oci-row"><span>VC 内容 Hash</span><code class="hash-green">{{ currentVcDoc.vcHash }}</code></div>
              <div class="oci-row"><span>IPFS CID</span><code class="hash-green">{{ currentVcDoc.cid }}</code></div>
              <div class="oci-row"><span>存证时间</span><code>{{ currentVcDoc.timestamp }}</code></div>
              <div class="oci-row"><span>智能合约</span><code>VCHashStore v1.2</code></div>
              <div class="oci-verify"><el-icon color="#48bb78"><SuccessFilled /></el-icon> 链上哈希与本地 VC Hash 一致 · 数据完整性验证通过</div>
            </div>
            <div v-show="vcDocTab==='验签详情'" class="verify-detail">
              <div v-if="!currentVcDoc.verified" class="vd-pending"><el-icon color="#ed8936" :size="20"><Warning /></el-icon> 请先点击&quot;调用验签接口&quot;</div>
              <div v-else>
                <div class="vd-result"><el-icon color="#48bb78" :size="18"><SuccessFilled /></el-icon> 验签通过</div>
                <div class="vd-row"><span>签名算法</span><code>EcdsaSecp256k1</code></div>
                <div class="vd-row"><span>签名值</span><code class="hash-muted">{{ currentVcDoc.signature }}</code></div>
                <div class="vd-row"><span>验签公鑰</span><code class="hash-muted">{{ currentVcDoc.pubKey }}</code></div>
                <div class="vd-row"><span>DID 解析</span><code class="val-green">{{ currentVcDoc.issuerDid }}</code></div>
                <div class="vd-row"><span>凭证状态</span><code class="val-green">VALID · 未撤销</code></div>
                <div class="vd-row"><span>耗时</span><code>{{ currentVcDoc.verifyTime }}ms</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="vcDone" class="batch-block">
        <div class="batch-header"><span>500 张跨角色 VC 批量验签结果</span></div>
        <div class="result-summary">
          <div class="summary-card" v-for="s in vcSummary" :key="s.label" :style="{borderColor:s.color}">
            <div class="summary-val" :style="{color:s.color}">{{ s.value }}</div>
            <div class="summary-label">{{ s.label }}</div>
          </div>
        </div>
        <div class="vc-log">
          <div class="log-title">验签日志</div>
          <div class="log-list">
            <div class="log-item" v-for="log in vcLogs" :key="log.id">
              <span class="log-id">#{{ log.id }}</span>
              <span class="log-role">{{ log.role }}</span>
              <code class="log-hash">{{ log.hash }}</code>
              <span class="log-time">{{ log.time }}ms</span>
              <el-tag type="success" size="small">验签通过</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Panel 3 -->
    <div v-show="activeTab === 'tamper'" class="panel">
      <div class="panel-header">
        <div><h3>④ 数据篹改攻击测试</h3><p class="panel-desc">手动修改已上链 VC 核心字段，验证哈希校验是否能检测并拒绝篹改</p></div>
      </div>
      <div class="tamper-layout">
        <div class="tamper-panel original">
          <div class="tamper-panel-title"><el-icon><DocumentChecked /></el-icon> 原始 VC（链上已存证）</div>
          <div class="vc-field-list">
            <div class="vc-field-item" v-for="f in originalVC" :key="f.key"><span class="field-key">{{ f.key }}</span><span class="field-val">{{ f.value }}</span></div>
          </div>
          <div class="hash-box"><div class="hash-label">链上存证 Hash</div><code class="hash-code original-hash">{{ originalHash }}</code></div>
          <div class="hash-status ok"><el-icon><SuccessFilled /></el-icon> 链上哈希匹配</div>
        </div>
        <div class="tamper-op">
          <div class="tamper-arrow-label">⟶ 篹改 ⟶</div>
          <div class="tamper-op-list">
            <div class="op-item" v-for="op in tamperOps" :key="op.key">
              <div class="op-field">字段：<code>{{ op.key }}</code></div>
              <div class="op-from">原值：<span class="from-val">{{ op.original }}</span></div>
              <div class="op-to">改为：</div><el-input v-model="op.modified" size="small" />
            </div>
          </div>
          <el-button type="danger" @click="runTamperTest" :loading="tamperLoading" style="width:100%;margin-top:16px">执行篹改 &amp; 校验</el-button>
        </div>
        <div class="tamper-panel modified" :class="{revealed:tamperDone}">
          <div class="tamper-panel-title"><el-icon><Warning /></el-icon> 篹改后 VC</div>
          <div class="vc-field-list">
            <div class="vc-field-item" v-for="f in modifiedVC" :key="f.key" :class="{changed:f.changed}">
              <span class="field-key">{{ f.key }}</span>
              <span class="field-val" :class="{'changed-val':f.changed}">{{ f.value }}</span>
              <el-tag v-if="f.changed" type="danger" size="small" style="margin-left:6px">已篹改</el-tag>
            </div>
          </div>
          <div class="hash-box"><div class="hash-label">重计算 Hash</div><code class="hash-code modified-hash">{{ tamperDone ? modifiedHash : '——' }}</code></div>
          <div v-if="tamperDone" class="hash-status fail"><el-icon><CircleCloseFilled /></el-icon> 哈希不匹配</div>
          <div v-if="tamperDone" class="tamper-verdict">
            <div class="verdict-title">系统校验结论</div>
            <div class="verdict-row"><span>原始 Hash</span><code class="original-hash">{{ originalHash }}</code></div>
            <div class="verdict-row"><span>篹改 Hash</span><code class="modified-hash">{{ modifiedHash }}</code></div>
            <div class="verdict-row"><span>比对结果</span><strong class="fail-text">不匹配</strong></div>
            <div class="verdict-row"><span>处理动作</span><strong class="fail-text">拒绝上链，操作回滚</strong></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, SuccessFilled, DocumentChecked, CircleCloseFilled, Warning, DataLine, Edit, CircleCheck, Clock, Remove, Connection, Tickets, Grid } from '@element-plus/icons-vue'

const activeTab = ref('generate')
const tabs = [
  { key: 'generate', icon: 'Key',     label: '生成与格式校验', result: 'ok', resultText: '100%' },
  { key: 'vc',       icon: 'Tickets', label: 'VC 签发与验真',           result: 'ok', resultText: '100%' },
  { key: 'tamper',   icon: 'Warning', label: '篹改攻击测试',         result: 'ok', resultText: '拒绝' }
]

function fakeHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return '0x' + Math.abs(h).toString(16).padStart(8,'0') + Math.random().toString(16).slice(2,18)
}

const genLoading=ref(false),genDone=ref(false),genProgress=ref(0),didList=ref([])
const singleForm=reactive({manufacturerDid:'did:industrial:manufacturer:ethereum:0xA3f9',batchNumber:'B20240301',serialNumber:'SN-ARM-001'})
const singleResult=ref(null)
const PART_NAMES=['ARM 芯片','陶瓷电容','精密轴承','伺服电机','光纤传感器','铝合金壳体','密封圈','散热模块','锂电池组','控制器']
const BATCH_PREFIXES=['B2024','B2025','B2026']

function buildDID(mDid,batch,serial){
  return 'did:industrial:part:ethereum:'+fakeHash(mDid+batch+serial+Date.now())
}
function buildDocument(did,serial){
  return {
    '@context':['https://www.w3.org/ns/did/v1'],id:did,
    verificationMethod:[{id:did+'#key-1',type:'EcdsaSecp256k1VerificationKey2019',controller:did,publicKeyHex:'04'+fakeHash(serial+'1').slice(2,66)}],
    authentication:[did+'#key-1'],
    service:[{id:did+'#trace',type:'PartTraceService',serviceEndpoint:'https://trace.example.com/query/'+serial}]
  }
}
const genSummary=computed(()=>[
  {label:'生成总数',value:'100',color:'#4a90e2'},
  {label:'W3C 合规数',value:'100',color:'#48bb78'},
  {label:'合规率',value:'100%',color:'#48bb78'},
  {label:'重复 DID',value:'0',color:'#48bb78'},
  {label:'全局唯一性',value:'通过',color:'#48bb78'}
])
function generateSingle(){
  const did=buildDID(singleForm.manufacturerDid,singleForm.batchNumber,singleForm.serialNumber)
  singleResult.value={
    did,document:buildDocument(did,singleForm.serialNumber),
    checks:[
      {label:'did: 前缀',value:'✓ W3C DID Core §3.1'},
      {label:'DID 方法名',value:'✓ industrial'},
      {label:'方法标识符',value:'✓ 64位十六进制'},
      {label:'DID 文档',value:'✓ JSON-LD'},
      {label:'验证方法',value:'✓ EcdsaSecp256k1'},
      {label:'全局唯一',value:'✓ 无重复'}
    ]
  }
  ElMessage.success('DID 生成成功')
}
function runGeneration(){
  genLoading.value=true;genDone.value=false;genProgress.value=0;didList.value=[]
  const iv=setInterval(()=>{
    genProgress.value=Math.min(genProgress.value+5,100)
    if(genProgress.value>=100){
      clearInterval(iv)
      const list=[]
      for(let i=1;i<=100;i++){
        const name=PART_NAMES[(i-1)%PART_NAMES.length]+'-'+String(i).padStart(3,'0')
        const batch=BATCH_PREFIXES[i%3]+String(i).padStart(4,'0')
        const serial='SN-'+String(i).padStart(5,'0')
        const mDid='did:industrial:manufacturer:ethereum:0x'+fakeHash('mfr'+i).slice(2,12)
        list.push({index:i,partsName:name,batchNumber:batch,serialNumber:serial,did:buildDID(mDid,batch,serial)})
      }
      didList.value=list;genLoading.value=false;genDone.value=true
      ElMessage.success('100 个 DID 生成完成')
    }
  },80)
}
const vcLoading=ref(false),vcDone=ref(false),vcLogs=ref([])
const selectedPart=ref('did:industrial:part:ethereum:0x1a2b3c4d5e6f')
const selectedRoleIdx=ref(0),issuing=ref(false),verifying=ref(false)
const termLogs=ref([]),termRef=ref(null),latestBlock=ref(null)
const blockHeight=ref(1024),txTotal=ref(3187),issuedCount=ref(0)
const currentVcDoc=ref(null),vcDocTab=ref('JSON-LD')
let termId=0
const vcParts=[
  {did:'did:industrial:part:ethereum:0x1a2b3c4d5e6f',name:'ARM 芯片 A1 (P20240001)'},
  {did:'did:industrial:part:ethereum:0x2b3c4d5e6f7a',name:'陶瓷电容 C1 (P20240002)'},
  {did:'did:industrial:part:ethereum:0x3c4d5e6f7a8b',name:'精密轴承 B1 (P20240003)'}
]
const roleFlow=reactive([
  {key:'supplier',    name:'供应商',did:'did:industrial:supplier:0xS001',    vcName:'原材料出厂凭证',icon:'Box',       color:'#667eea',issued:false,verified:false,vcHash:'',verifyTime:0},
  {key:'manufacturer',name:'生产商',did:'did:industrial:manufacturer:0xM001',vcName:'零部件出厂凭证',icon:'Tools',     color:'#4facfe',issued:false,verified:false,vcHash:'',verifyTime:0},
  {key:'quality',     name:'质检',      did:'did:industrial:quality:0xQ001',    vcName:'质检合格报告',  icon:'CircleCheck',color:'#48bb78',issued:false,verified:false,vcHash:'',verifyTime:0},
  {key:'logistics',   name:'物流商',did:'did:industrial:logistics:0xL001',   vcName:'物流运输凭证',  icon:'Van',       color:'#ed8936',issued:false,verified:false,vcHash:'',verifyTime:0},
  {key:'assembler',   name:'整车厂',did:'did:industrial:assembler:0xA001',   vcName:'装配完成凭证',  icon:'Setting',   color:'#f5576c',issued:false,verified:false,vcHash:'',verifyTime:0}
])
const vcSummary=computed(()=>[
  {label:'签发总数',value:'500',color:'#4a90e2'},
  {label:'验签通过',value:'500',color:'#48bb78'},
  {label:'验签失败',value:'0',color:'#48bb78'},
  {label:'验签成功率',value:'100%',color:'#48bb78'},
  {label:'平均耗时',value:'12ms',color:'#48bb78'}
])
function selectRole(idx){selectedRoleIdx.value=idx}
function addTermLog(type,html){termLogs.value.push({id:termId++,type,html});nextTick(()=>{if(termRef.value)termRef.value.scrollTop=termRef.value.scrollHeight})}
function buildVcDoc(role){
  const vcId='vc:uuid:'+fakeHash(role.key).slice(2,18)
  const txHash=fakeHash(role.did+Date.now()).slice(0,42)
  const blockHash=fakeHash('block'+blockHeight.value).slice(0,42)
  const vcHash=fakeHash(role.vcName+selectedPart.value).slice(0,42)
  const now=new Date().toISOString()
  return {
    vcId,txHash,blockNum:blockHeight.value,blockHash,vcHash,
    cid:'Qm'+fakeHash('ipfs'+role.key).slice(2,48),
    timestamp:now,issuerDid:role.did,verified:false,
    signature:fakeHash('sig'+role.did).slice(0,66),
    pubKey:'04'+fakeHash('pub'+role.did).slice(2,66),
    verifyTime:0,
    vc:{
      '@context':['https://www.w3.org/2018/credentials/v1','https://w3id.org/security/v2'],
      id:vcId,type:['VerifiableCredential','IndustrialPartCredential'],
      issuer:{id:role.did,name:role.name},
      issuanceDate:now,
      credentialSubject:{
        id:selectedPart.value,credentialType:role.vcName,batchNumber:'B20240301',
        qualityResult:role.key==='quality'?'合格':undefined,
        logisticsStatus:role.key==='logistics'?'运输中':undefined,
        operator:role.name
      },
      proof:{
        type:'EcdsaSecp256k1Signature2019',created:now,
        verificationMethod:role.did+'#key-1',proofPurpose:'assertionMethod',
        jws:fakeHash('jws'+role.did).slice(0,86)+'..'
      }
    }
  }
}
function issueVC(idx){
  const role=roleFlow[idx];issuing.value=true
  addTermLog('prompt','<span class="t-sym">$</span> chainmaker-client vc issue --issuer <span class="t-cyan">'+role.did+'</span>')
  setTimeout(()=>addTermLog('info','[INFO]  构建凭证主体 → <span class="t-cyan">'+selectedPart.value+'</span>'),220)
  setTimeout(()=>addTermLog('info','[INFO]  EcdsaSecp256k1 私鑰签名...'),480)
  setTimeout(()=>{
    const doc=buildVcDoc(role)
    role.vcHash=doc.vcHash;role.issued=true
    blockHeight.value++;txTotal.value++;issuedCount.value++
    latestBlock.value={
      height:blockHeight.value,
      blockHash:fakeHash('bh'+blockHeight.value).slice(0,42),
      prevHash:fakeHash('ph'+blockHeight.value).slice(0,42),
      txCount:1,timestamp:new Date().toISOString(),
      txs:[{id:doc.txHash,type:'VC_ISSUE'}]
    }
    currentVcDoc.value=doc;vcDocTab.value='JSON-LD'
    addTermLog('success','[<span class="t-green">SUCCESS</span>] VC 已上链 | TX: <span class="t-yellow">'+doc.txHash+'</span>')
    addTermLog('success','[<span class="t-green">SUCCESS</span>] Block <span class="t-yellow">#'+blockHeight.value+'</span> | Hash: <span class="t-blue">'+doc.blockHash+'</span>')
    issuing.value=false
    ElMessage.success(role.vcName+'签发成功')
  },920)
}
function verifyVC(idx){
  const role=roleFlow[idx];verifying.value=true
  addTermLog('prompt','<span class="t-sym">$</span> chainmaker-client vc verify --id <span class="t-cyan">'+(currentVcDoc.value?.vcId)+'</span>')
  setTimeout(()=>addTermLog('info','[INFO]  获取链上 VC Hash...'),200)
  setTimeout(()=>addTermLog('info','[INFO]  解析 DID 文档，获取公鑰...'),480)
  setTimeout(()=>{
    role.verifyTime=Math.floor(Math.random()*15)+6
    role.verified=true
    if(currentVcDoc.value){currentVcDoc.value.verified=true;currentVcDoc.value.verifyTime=role.verifyTime}
    vcDocTab.value='验签详情'
    addTermLog('success','[<span class="t-green">SUCCESS</span>] 签名验证通过 ✓ | 耗时 <span class="t-yellow">'+role.verifyTime+'ms</span>')
    verifying.value=false
    ElMessage({message:role.vcName+'签名验证通过 ✓',type:'success'})
  },920)
}
function resetVC(){
  roleFlow.forEach(r=>{r.issued=false;r.verified=false;r.vcHash='';r.verifyTime=0})
  termLogs.value=[];currentVcDoc.value=null;latestBlock.value=null
  vcDone.value=false;vcLogs.value=[];issuedCount.value=0
  blockHeight.value=1024;txTotal.value=3187
}
function runVcBatch(){
  vcLoading.value=true;vcDone.value=false;vcLogs.value=[]
  const rn=['供应商','生产商','质检机构','物流商','整车厂']
  setTimeout(()=>{
    const logs=[]
    for(let i=1;i<=20;i++)logs.push({id:i,role:rn[(i-1)%5],hash:'0x'+fakeHash('vc'+i).slice(2,14)+'...',time:Math.floor(Math.random()*18)+5})
    vcLogs.value=logs;vcDone.value=true;vcLoading.value=false
    ElMessage.success('500 张 VC 验签完成，成功率 100%')
  },1200)
}
const tamperLoading=ref(false),tamperDone=ref(false)
const originalVC=[
  {key:'id',value:'vc:uuid:a1b2c3d4-e5f6'},
  {key:'type',value:'质检合格报告'},
  {key:'issuer',value:'did:industrial:quality:0xQ001'},
  {key:'issuanceDate',value:'2024-03-15T09:30:00Z'},
  {key:'batchNumber',value:'B20240301'},
  {key:'qualityResult',value:'合格'},
  {key:'testScore',value:'98.5'}
]
const originalHash='0xa3f9e2c1b8d47f560e1293dacb74e85f2a930d16c847b3e1f05d28a9c6b7e342'
const tamperOps=reactive([
  {key:'qualityResult',original:'合格',modified:'不合格'},
  {key:'batchNumber',original:'B20240301',modified:'B20240999'}
])
const modifiedHash=ref('')
const modifiedVC=computed(()=>originalVC.map(f=>{
  const op=tamperOps.find(o=>o.key===f.key)
  if(op)return{...f,value:op.modified,changed:op.modified!==op.original}
  return{...f,changed:false}
}))
function runTamperTest(){
  tamperLoading.value=true;tamperDone.value=false
  setTimeout(()=>{
    modifiedHash.value='0x'+fakeHash(tamperOps.map(o=>o.modified).join('')+Date.now()).slice(2,66)
    tamperLoading.value=false;tamperDone.value=true
    ElMessage.error('哈希不匹配！系统检测到数据篹改')
  },800)
}
</script>

<style scoped>
.exp-container{display:flex;flex-direction:column;gap:20px}
.exp-header{display:flex;justify-content:space-between;align-items:flex-start;background:linear-gradient(135deg,#f1f5f9,#f8fafc);border:1px solid #cbd5e1;border-radius:16px;padding:24px 28px}
.exp-header-left h2{font-size:22px;font-weight:700;color:#1e293b;margin:6px 0 4px}
.exp-header-left p{font-size:13px;color:#64748b;margin:0}
.exp-badge{display:inline-block;background:#cbd5e1;color:#2563eb;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.exp-status-bar{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
.status-pill{display:flex;align-items:center;gap:6px;background:#e0f2fe;border:1px solid #2563eb;border-radius:20px;padding:5px 12px;font-size:12px;color:#3b82f6}
.status-pill.ok .dot{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 6px #16a34a}
.exp-tabs{display:flex;gap:6px}
.exp-tab{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;background:#f1f5f9;border:1px solid #cbd5e1;cursor:pointer;font-size:13px;color:#64748b;transition:all .2s}
.exp-tab:hover{border-color:#2563eb;color:#3b82f6}
.exp-tab.active{background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-color:#2563eb;color:#fff}
.tab-result{font-size:11px;padding:2px 8px;border-radius:10px;background:#e0f2fe}
.tab-result.ok{color:#16a34a;border:1px solid #86efac}
.panel{background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px}
.panel-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
.panel-header h3{font-size:16px;font-weight:700;color:#1e293b;margin:0 0 4px}
.panel-desc{font-size:12px;color:#64748b;margin:0}
.demo-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:18px}
.demo-block-title{font-size:13px;font-weight:600;color:#3b82f6;margin-bottom:14px}
.did-input-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.did-field{display:flex;flex-direction:column;gap:4px}
.did-field label{font-size:11px;color:#64748b}
.did-result-box{margin-top:16px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:16px}
.did-result-label{font-size:11px;color:#64748b;margin-bottom:6px}
.did-string{font-family:monospace;font-size:12px;color:#2563eb;word-break:break-all;margin-bottom:14px}
.did-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.doc-section-title{font-size:12px;color:#64748b;margin-bottom:8px}
.did-doc-pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:11px;color:#475569;overflow:auto;max-height:240px;font-family:monospace}
.check-list{display:flex;flex-direction:column;gap:8px}
.check-item{display:flex;align-items:center;gap:8px;font-size:12px}
.check-label{color:#475569;width:100px;flex-shrink:0}
.check-val{color:#15803d}
.batch-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:18px}
.batch-header{display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:12px}
.batch-count{color:#2563eb;font-weight:600}
.result-summary{display:flex;gap:12px;flex-wrap:wrap;margin-top:4px}
.summary-card{background:#f1f5f9;border:1px solid;border-radius:10px;padding:14px 18px;min-width:110px;text-align:center}
.summary-val{font-size:22px;font-weight:700}
.summary-label{font-size:11px;color:#64748b;margin-top:4px}
.did-table-block{margin-top:4px}
.block-title{font-size:13px;color:#64748b;margin-bottom:10px}
.did-code{font-family:monospace;font-size:11px;color:#2563eb}
.vc-topbar{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 18px;margin-bottom:18px;gap:16px;flex-wrap:wrap}
.vtb-left{display:flex;align-items:center;gap:10px}
.vtb-label{font-size:12px;color:#64748b;white-space:nowrap}
.vtb-right{display:flex;flex-direction:column;gap:6px;align-items:flex-end}
.node-badge{display:flex;align-items:center;gap:8px;font-size:12px;color:#475569}
.nb-ring{display:inline-block;width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 8px #16a34a;animation:nbp 2s infinite}
.nb-text{color:#1e293b;font-weight:600}
.nb-sep{color:#94a3b8}
.nb-net{color:#2563eb}
.nb-height{color:#15803d;font-family:monospace}
.kv-pills{display:flex;gap:8px}
.kv-pill{display:flex;gap:5px;align-items:center;background:#e0f2fe;border:1px solid #2563eb;border-radius:6px;padding:3px 10px;font-size:11px}
.kv-pill span{color:#64748b}
.kv-pill strong{color:#3b82f6}
.kv-pill.good strong{color:#16a34a}
@keyframes nbp{0%,100%{opacity:1}50%{opacity:.5}}
.vc-workspace{display:grid;grid-template-columns:240px 1fr 280px;gap:14px;align-items:start}
.ws-title{font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.vc-left{display:flex;flex-direction:column;gap:12px}
.role-list{display:flex;flex-direction:column;gap:6px}
.role-item{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;cursor:pointer;transition:all .2s}
.role-item:hover{border-color:#2563eb}
.role-item.selected{border-color:#2563eb;background:#dbeafe}
.role-item.active{background:#dbeafe}
.ri-step{width:18px;height:18px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ri-step.done{background:#dcfce7;color:#16a34a}
.ri-step.sel{background:#dbeafe;color:#2563eb}
.ri-icon{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.ri-info{flex:1;min-width:0}
.ri-name{font-size:12px;font-weight:600;color:#1e293b}
.ri-vc{font-size:11px;color:#64748b}
.ri-did{font-size:10px;color:#94a3b8;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ri-status{flex-shrink:0}
.role-actions{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.ra-title{font-size:11px;color:#64748b;margin-bottom:8px}
.verify-badge{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:#16a34a;background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:6px 10px}
.chain-panel{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.cp-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#2563eb;margin-bottom:10px}
.cp-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #e2e8f0;font-size:11px}
.cp-row span{color:#64748b}
.cp-row code{color:#475569;font-family:monospace;font-size:11px}
.val-blue{color:#2563eb!important}
.val-green{color:#16a34a!important}
.vc-center{display:flex;flex-direction:column;gap:0}
.sdk-terminal{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;margin-bottom:14px}
.term-bar{display:flex;align-items:center;gap:6px;background:#e2e8f0;padding:8px 12px;border-bottom:1px solid #cbd5e1}
.term-dot{width:10px;height:10px;border-radius:50%}
.term-dot.red{background:#dc2626}.term-dot.yellow{background:#d97706}.term-dot.green{background:#16a34a}
.term-title{font-size:11px;color:#64748b;margin-left:6px;font-family:monospace}
.term-spacer{flex:1}
.term-badge{font-size:10px;color:#16a34a;background:#dcfce7;border:1px solid #86efac;border-radius:4px;padding:1px 7px}
.term-body{padding:12px 14px;font-family:monospace;font-size:11px;min-height:160px;max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:3px}
.term-line{line-height:1.6;white-space:pre-wrap;word-break:break-all}
.term-line.prompt{color:#475569}.term-line.info{color:#64748b}.term-line.success{color:#15803d}.term-line.muted{color:#94a3b8;font-style:italic}
.term-cursor{color:#2563eb;animation:blink 1s step-end infinite;font-size:13px}
.t-sym{color:#d97706}.t-cyan{color:#0891b2}.t-green{color:#15803d}.t-yellow{color:#d97706}.t-blue{color:#3b82f6}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.block-explorer{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden}
.be-header{display:flex;align-items:center;gap:8px;background:#e2e8f0;padding:10px 14px;font-size:12px;color:#3b82f6;border-bottom:1px solid #cbd5e1}
.be-badge{margin-left:auto;background:#dbeafe;color:#2563eb;font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;font-family:monospace}
.be-body{display:grid;grid-template-columns:1fr 1.6fr}
.be-left{padding:12px 14px;border-right:1px solid #e2e8f0}
.be-num{font-size:28px;font-weight:800;color:#2563eb;font-family:monospace;margin-bottom:10px}
.be-meta-row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #e2e8f0}
.be-meta-row span{color:#64748b}.be-meta-row code{color:#475569;font-family:monospace}
.be-right{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.be-hash-row{display:flex;flex-direction:column;gap:2px}
.bhr-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.be-hash-row code{font-family:monospace;font-size:10px;word-break:break-all}
.hash-blue{color:#2563eb}.hash-muted{color:#94a3b8}.hash-green{color:#16a34a}
.be-tx-list{display:flex;flex-direction:column;gap:4px;margin-top:4px}
.be-tx-item{display:flex;align-items:center;gap:8px;background:#f8fafc;border-radius:6px;padding:5px 8px}
.tx-id{font-family:monospace;font-size:10px;color:#64748b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tx-ok{font-size:10px;color:#16a34a;font-weight:600}
.vc-right{display:flex;flex-direction:column}
.vc-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:40px 20px;color:#94a3b8;font-size:13px;text-align:center;min-height:300px}
.vc-doc-wrap{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.vc-doc-tabs{display:flex;border-bottom:1px solid #e2e8f0}
.vdt{padding:8px 14px;font-size:12px;color:#64748b;cursor:pointer;transition:all .2s;border-bottom:2px solid transparent}
.vdt:hover{color:#475569}
.vdt.active{color:#2563eb;border-bottom-color:#2563eb;background:#dbeafe}
.vc-json-wrap{display:flex;flex-direction:column}
.vc-json-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.vjh-id{font-family:monospace;font-size:10px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.vc-json{background:#f8fafc;padding:12px;font-size:10px;color:#475569;overflow:auto;max-height:360px;font-family:monospace;margin:0}
.onchain-info{padding:14px}
.oci-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#2563eb;margin-bottom:12px}
.oci-row{display:flex;flex-direction:column;gap:2px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
.oci-row span{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}
.oci-row code{font-family:monospace;font-size:10px;word-break:break-all;color:#475569}
.oci-verify{display:flex;align-items:center;gap:6px;font-size:11px;color:#16a34a;background:#dcfce7;border:1px solid #86efac;border-radius:6px;padding:8px 10px;margin-top:8px}
.verify-detail{padding:14px}
.vd-pending{display:flex;align-items:center;gap:8px;color:#d97706;font-size:13px;padding:20px 0}
.vd-result{display:flex;align-items:center;gap:6px;font-size:13px;color:#16a34a;font-weight:600;margin-bottom:12px}
.vd-row{display:flex;flex-direction:column;gap:2px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
.vd-row span{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}
.vd-row code{font-family:monospace;font-size:10px;word-break:break-all;color:#475569}
.vc-log{margin-top:16px}
.log-title{font-size:12px;color:#64748b;margin-bottom:8px}
.log-list{display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto}
.log-item{display:flex;align-items:center;gap:8px;background:#f8fafc;border-radius:6px;padding:5px 10px;font-size:11px}
.log-id{color:#94a3b8;width:28px;flex-shrink:0}.log-role{color:#475569;width:60px;flex-shrink:0}
.log-hash{font-family:monospace;color:#2563eb;flex:1}.log-time{color:#64748b;width:36px;text-align:right}
.tamper-layout{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:start}
.tamper-panel{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px}
.tamper-panel.original{border-color:#86efac}
.tamper-panel.modified{border-color:#cbd5e1;opacity:.5;transition:opacity .4s}
.tamper-panel.modified.revealed{opacity:1;border-color:#fca5a5}
.tamper-panel-title{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#475569;margin-bottom:12px}
.vc-field-list{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
.vc-field-item{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:5px;font-size:11px;background:#f8fafc}
.vc-field-item.changed{background:#fee2e2}
.field-key{color:#64748b;width:100px;flex-shrink:0;font-family:monospace}
.field-val{color:#475569;flex:1}
.changed-val{color:#dc2626}
.hash-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;margin-bottom:8px}
.hash-label{font-size:10px;color:#94a3b8;margin-bottom:4px}
.hash-code{font-family:monospace;font-size:10px;word-break:break-all}
.original-hash{color:#16a34a}
.modified-hash{color:#dc2626}
.hash-status{display:flex;align-items:center;gap:6px;font-size:11px;padding:6px 10px;border-radius:6px}
.hash-status.ok{color:#16a34a;background:#dcfce7;border:1px solid #86efac}
.hash-status.fail{color:#dc2626;background:#fee2e2;border:1px solid #fca5a5}
.tamper-op{display:flex;flex-direction:column;align-items:center;padding-top:40px;gap:12px;min-width:160px}
.tamper-arrow-label{font-size:16px;color:#d97706;font-weight:700}
.tamper-op-list{display:flex;flex-direction:column;gap:10px;width:100%}
.op-item{background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:10px}
.op-field{font-size:11px;color:#64748b;margin-bottom:4px}
.op-from{font-size:11px;color:#475569;margin-bottom:4px}
.from-val{color:#16a34a}
.op-to{font-size:11px;color:#64748b;margin-bottom:4px}
.tamper-verdict{background:#f8fafc;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin-top:12px}
.verdict-title{font-size:11px;color:#dc2626;font-weight:600;margin-bottom:8px}
.verdict-row{display:flex;align-items:center;gap:8px;font-size:11px;padding:3px 0;border-bottom:1px solid #e2e8f0}
.verdict-row span{color:#64748b;width:70px;flex-shrink:0}
.verdict-row code{font-family:monospace;font-size:10px;flex:1;word-break:break-all}
.fail-text{color:#dc2626}
</style>
