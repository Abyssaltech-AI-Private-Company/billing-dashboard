<template>
  <div class="container-fluid py-3">
    <nav class="navbar navbar-expand-lg navbar-light bg-white border rounded shadow-sm mb-3 px-3">
      <a class="navbar-brand fw-semibold">AI Agents Dashboard</a>
      <span class="badge text-bg-secondary ms-2">Production</span>
      <div class="ms-auto small text-muted">Last refresh: {{ lastRefresh }}</div>
    </nav>

    <!-- Filters -->
    <div class="row g-3 mb-3">
      <div class="col-12 col-md-3">
        <label class="form-label">Customer</label>
        <select class="form-select" v-model="filters.customerId" @change="loadSessions">
          <option value="">All</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label">From</label>
        <input type="date" class="form-control" v-model="filters.from" @change="loadSessions">
      </div>
      <div class="col-6 col-md-3">
        <label class="form-label">To</label>
        <input type="date" class="form-control" v-model="filters.to" @change="loadSessions">
      </div>
      <div class="col-12 col-md-3">
        <label class="form-label">Search</label>
        <input class="form-control" placeholder="Session ID or customer…" v-model="filters.q" @input="applySearch">
      </div>
    </div>

    <!-- KPIs -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-md-3"><KpiCard label="Total Sessions" :value="summary.totalSessions" :decimals="0"/></div>
      <div class="col-6 col-md-3"><KpiCard label="Total Minutes" :value="summary.totalMinutes"/></div>
      <div class="col-6 col-md-3"><KpiCard label="Total Cost" :value="summary.totalCost" prefix="$"/></div>
      <div class="col-6 col-md-3"><KpiCard label="Avg $/min" :value="summary.avgCostPerMin" prefix="$" :decimals="4"/></div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5 class="mb-0">Sessions</h5>
      <div>
        <button class="btn btn-outline-secondary btn-sm me-2" @click="exportCsv">Export CSV</button>
        <button class="btn btn-outline-secondary btn-sm" @click="loadSessions">Refresh</button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="loading" class="placeholder-glow">
      <span class="placeholder col-12" style="height: 120px;"></span>
    </div>

    <SessionsTable v-else :items="filtered" @open="openSession" />

    <SessionModal :open="modal.open" :session="modal.session" :logs="modal.logs" @close="modal.open=false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import KpiCard from './components/KpiCard.vue'
import SessionsTable from './components/SessionsTable.vue'
import SessionModal from './components/SessionModal.vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const customers = ref([])
const sessions = ref([])
const summary = ref({ totalSessions:0, totalMinutes:0, totalCost:0, avgCostPerMin:0 })
const loading = ref(false)
const error = ref('')
const lastRefresh = ref('—')
const filters = ref({ customerId:'', from:'', to:'', q:'' })
const modal = ref({ open:false, session:null, logs:[] })

function withinRange(s){
  const st = s.startTime ? new Date(s.startTime) : null
  const f = filters.value.from ? new Date(filters.value.from) : null
  const t = filters.value.to ? new Date(filters.value.to) : null
  if (f && st && st < f) return false
  if (t && st && st > new Date(t.getTime() + 24*60*60*1000 - 1)) return false
  return true
}
const filtered = computed(()=>{
  const q = filters.value.q?.toLowerCase() || ''
  return sessions.value.filter(s=>{
    if (!withinRange(s)) return false
    if (q && !(`${s.sessionId}`.toLowerCase().includes(q) || (s.customerName||'').toLowerCase().includes(q))) return false
    return true
  })
})

async function loadCustomers(){
  const res = await fetch(`${API_BASE}/api/customers`)
  customers.value = await res.json()
}

async function loadSessions(){
  try{
    loading.value = true
    error.value = ''
    const url = new URL(`${API_BASE}/api/sessions`)
    if (filters.value.customerId) url.searchParams.set('customerId', filters.value.customerId)
    // Optional: add server-side date filters if you implement them:
    if (filters.value.from) url.searchParams.set('from', filters.value.from)
    if (filters.value.to) url.searchParams.set('to', filters.value.to)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    sessions.value = json.sessions || []
    summary.value = json.summary || summary.value
    lastRefresh.value = new Date().toLocaleString()
  } catch(e){
    console.error(e)
    error.value = 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}
function applySearch(){ /* computed handles it live */ }

function exportCsv(){
  const rows = filtered.value.map(s=>({
    sessionId: s.sessionId, customer: s.customerName, start: s.startTime,
    minutes: s.minutes.toFixed(2), totalUSD: s.totalCost.toFixed(2), usdPerMin: s.avgCostPerMin.toFixed(4)
  }))
  const header = Object.keys(rows[0]||{sessionId:'',customer:'',start:'',minutes:'',totalUSD:'',usdPerMin:''})
  const csv = [header.join(','), ...rows.map(r=>header.map(h=>`"${String(r[h]).replace(/"/g,'""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], {type:'text/csv'})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sessions.csv'; a.click()
  URL.revokeObjectURL(a.href)
}

function openSession(s){ modal.value = { open:true, session:s, logs:[] }; loadLogs(s) }
async function loadLogs(s){
  try {
    const res = await fetch(`${API_BASE}/api/agent-logs?sessionId=${encodeURIComponent(s.id)}`)
    if (res.ok) modal.value.logs = await res.json()
  } catch {}
}

onMounted(async () => {
  await loadCustomers(); await loadSessions()
})
</script>

<style>
body { background-color: #f8f9fa; color: #000; }
.placeholder { display: inline-block; background-color: rgba(0,0,0,.05); border-radius: .25rem; }
</style>
