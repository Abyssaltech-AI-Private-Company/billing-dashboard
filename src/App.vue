<template>
  <div class="container py-5">
    <div class="d-flex align-items-end gap-3 mb-4">
      <div class="flex-grow-1">
        <h1 class="mb-1">Customer Billing Dashboard</h1>
        <small class="text-muted">Filter by customer or view all sessions</small>
      </div>

      <div class="ms-auto">
        <label class="form-label mb-1">Customer</label>
        <select class="form-select" v-model="selectedCustomerId" @change="loadSessions">
          <option value="">All Customers</option>
          <option v-for="c in customers" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-3">
        <div class="card">
          <div class="card-body">
            <div class="fw-semibold">Total Sessions</div>
            <div class="fs-3">{{ summary.totalSessions }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card">
          <div class="card-body">
            <div class="fw-semibold">Total Minutes</div>
            <div class="fs-3">{{ summary.totalMinutes.toFixed(2) }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card">
          <div class="card-body">
            <div class="fw-semibold">Total Cost (USD)</div>
            <div class="fs-3">${{ summary.totalCost.toFixed(4) }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-3">
        <div class="card">
          <div class="card-body">
            <div class="fw-semibold">Avg Cost / Min</div>
            <div class="fs-3">${{ summary.avgCostPerMin.toFixed(4) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sessions table -->
    <div class="card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Sessions</h5>
          <div v-if="loading" class="text-muted">Loading…</div>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle">
            <thead class="table-dark">
              <tr>
                <th>Session ID</th>
                <th>Customer</th>
                <th>Start Time</th>
                <th>Duration (min)</th>
                <th>Total Cost (USD)</th>
                <th>Avg $/min</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.id">
                <td>{{ s.sessionId }}</td>
                <td>{{ s.customerName }}</td>
                <td>{{ s.startTime }}</td>
                <td>{{ s.minutes.toFixed(2) }}</td>
                <td>${{ s.totalCost.toFixed(4) }}</td>
                <td>${{ s.avgCostPerMin.toFixed(4) }}</td>
              </tr>
              <tr v-if="!loading && sessions.length === 0">
                <td colspan="6" class="text-center text-muted">No sessions found</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:3000' // change to your DO API URL in production

const customers = ref([])
const selectedCustomerId = ref('')
const sessions = ref([])
const summary = ref({
  totalSessions: 0,
  totalMinutes: 0,
  totalCost: 0,
  avgCostPerMin: 0
})
const loading = ref(false)
const error = ref('')

async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/api/customers`)
    customers.value = await res.json()
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load customers'
  }
}

async function loadSessions() {
  loading.value = true
  error.value = ''
  sessions.value = []
  summary.value = { totalSessions: 0, totalMinutes: 0, totalCost: 0, avgCostPerMin: 0 }

  try {
    const url = new URL(`${API_BASE}/api/sessions`)
    if (selectedCustomerId.value) {
      url.searchParams.set('customerId', selectedCustomerId.value)
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    sessions.value = json.sessions || []
    summary.value = json.summary || summary.value
  } catch (e) {
    console.error(e)
    error.value = 'Failed to load sessions'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCustomers()
  await loadSessions()
})
</script>

<style>
body {
  background-color: #f8f9fa;
  color: #000000;
}
</style>
