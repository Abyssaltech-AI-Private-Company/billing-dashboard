<template>
  <div class="card h-100">
    <div class="card-body">
      <div class="text-muted small">{{ label }}</div>
      <div class="fs-3 fw-semibold">{{ formatted }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ label: String, value: [Number, String], prefix: {type:String,default:''}, decimals: {type:Number,default:2}})
const formatted = computed(() => typeof props.value === 'number'
  ? `${props.prefix}${props.value.toFixed(props.decimals)}`
  : `${props.prefix}${props.value}`)
</script>
