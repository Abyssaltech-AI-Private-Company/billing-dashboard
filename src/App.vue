<template>
  <div class="container py-5">
    <h1 class="mb-4">Customer Billing Dashboard</h1>

    <table class="table table-bordered table-hover">
      <thead class="table-dark">
        <tr>
          <th>User</th>
          <th>Sessions</th>
          <th>Total Minutes</th>
          <th>Total Cost (USD)</th>
          <th>Average Cost/Min</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.name">
          <td>{{ user.name }}</td>
          <td>{{ user.sessions }}</td>
          <td>{{ user.minutes.toFixed(2) }}</td>
          <td>${{ user.total.toFixed(2) }}</td>
          <td>${{ (user.total / user.minutes).toFixed(4) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])

onMounted(async () => {
  const res = await fetch('http://localhost:3000/api/billing')
  users.value = await res.json()
})
</script>

<style>
body {
  background-color: #000000;
}
</style>
