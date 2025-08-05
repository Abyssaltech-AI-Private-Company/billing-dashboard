<template>
  <div class="table-responsive">
    <table class="table table-hover align-middle">
      <thead class="table-dark">
        <tr>
          <th @click="sort('sessionId')" role="button">Session ID</th>
          <th @click="sort('customerName')" role="button">Customer</th>
          <th @click="sort('startTime')" role="button">Start</th>
          <th @click="sort('minutes')" role="button">Minutes</th>
          <th @click="sort('totalCost')" role="button">Total $</th>
          <th @click="sort('avgCostPerMin')" role="button">$/min</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in paged" :key="s.id" @click="$emit('open', s)" role="button">
          <td>{{ s.sessionId }}</td>
          <td>{{ s.customerName }}</td>
          <td>{{ s.startTime }}</td>
          <td>{{ s.minutes.toFixed(2) }}</td>
          <td>${{ s.totalCost.toFixed(2) }}</td>
          <td>${{ s.avgCostPerMin.toFixed(4) }}</td>
        </tr>
        <tr v-if="!paged.length">
          <td colspan="6" class="text-center text-muted">No sessions</td>
        </tr>
      </tbody>
    </table>

    <div class="d-flex justify-content-between align-items-center">
      <div class="text-muted small">Showing {{ startIdx+1 }}–{{ endIdx }} of {{ items.length }}</div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary btn-sm" :disabled="page===1" @click="page--">Prev</button>
        <button class="btn btn-outline-secondary btn-sm" :disabled="page*pageSize>=items.length" @click="page++">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({ items: { type:Array, default:()=>[] }})
const page = ref(1)
const pageSize = ref(10)
const sortBy = ref('startTime')
const sortDir = ref('desc')

function sort(key){
  if (sortBy.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = key; sortDir.value = 'asc' }
  page.value = 1
}
const sorted = computed(() => [...props.items].sort((a,b)=>{
  const va = a[sortBy.value], vb = b[sortBy.value]
  if (va == null && vb == null) return 0
  if (va == null) return 1
  if (vb == null) return -1
  return (va > vb ? 1 : va < vb ? -1 : 0) * (sortDir.value === 'asc' ? 1 : -1)
}))
const startIdx = computed(()=> (page.value-1)*pageSize.value)
const endIdx = computed(()=> Math.min(startIdx.value+pageSize.value, sorted.value.length))
const paged = computed(()=> sorted.value.slice(startIdx.value, endIdx.value))
watch(()=>props.items, ()=>{ page.value=1 })
</script>
