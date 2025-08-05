<template>
  <div class="modal d-block" tabindex="-1" v-if="open" @click.self="$emit('close')">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Session {{ session?.sessionId }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3 mb-3">
            <div class="col-md-3"><div class="small text-muted">Customer</div><div>{{ session?.customerName }}</div></div>
            <div class="col-md-3"><div class="small text-muted">Start</div><div>{{ session?.startTime }}</div></div>
            <div class="col-md-3"><div class="small text-muted">Minutes</div><div>{{ n(session?.minutes,2) }}</div></div>
            <div class="col-md-3"><div class="small text-muted">Total $</div><div>${{ n(session?.totalCost,2) }}</div></div>
          </div>

          <h6 class="mb-2">Agent Logs</h6>
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead><tr><th>Agent</th><th>Model</th><th>Prompt</th><th>Cached</th><th>Completion</th><th>Cost $</th></tr></thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id">
                  <td>{{ log.agentName }}</td>
                  <td>{{ log.model }}</td>
                  <td>{{ log.promptTokens }}</td>
                  <td>{{ log.cachedTokens }}</td>
                  <td>{{ log.completionTokens }}</td>
                  <td>${{ n(log.cost,4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ open:Boolean, session:Object, logs:{type:Array, default:()=>[]} })
function n(v,d=2){ return (Number(v)||0).toFixed(d) }
</script>

<style>
.modal { background: rgba(0,0,0,.3); }
</style>
