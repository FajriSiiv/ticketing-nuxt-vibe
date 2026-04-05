<script setup lang="ts">
const route = useRoute()
const user = useAuthUser()
const ticket = ref(null)
const loading = ref(true)

onMounted(async () => {
  if (!user.value?.id) return navigateTo('/login')
  try {
    const res = await $fetch(`/api/tickets/${route.params.orderId}`, {
      params: { userId: user.value.id }
    })
    if (res.success) {
      ticket.value = res.ticket
      if (ticket.value.status !== 'SUCCESS' && ticket.value.status !== 'SETTLEMENT') {
        // Bukan tiket valid, redirect ke transactions
        navigateTo('/transactions', { replace: true })
      }
    } else {
      navigateTo('/transactions', { replace: true })
    }
  } catch (e) {
    navigateTo('/transactions', { replace: true })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-lg mx-auto py-8">
    <div v-if="loading" class="text-center py-10">
      <p class="text-gray-400 dark:text-gray-400 text-gray-600">Memuat tiket...</p>
    </div>

    <div v-else-if="ticket" class="rounded-2xl shadow-xl overflow-hidden border dark:bg-gray-800 dark:border-gray-700 bg-white border-gray-200">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h1 class="text-2xl font-bold text-white">E-Tiket</h1>
        <p class="text-blue-200 text-sm mt-1">Event Ticket</p>
      </div>

      <!-- Ticket Body -->
      <div class="p-6 space-y-4">
        <div>
          <p class="text-gray-400 dark:text-gray-400 text-gray-500 text-xs uppercase font-semibold">Event</p>
          <p class="dark:text-white text-gray-900 text-lg font-semibold mt-1">{{ ticket.event?.title }}</p>
        </div>

        <div v-if="ticket.event?.description" class="dark:text-gray-300 text-gray-600 text-sm">
          {{ ticket.event.description }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-gray-400 dark:text-gray-400 text-gray-500 text-xs uppercase font-semibold">Harga Total</p>
            <p class="dark:text-white text-gray-900 font-semibold mt-1">Rp {{ ticket.amount?.toLocaleString('id-ID') }}</p>
          </div>
          <div>
            <p class="text-gray-400 dark:text-gray-400 text-gray-500 text-xs uppercase font-semibold">Order ID</p>
            <p class="dark:text-white text-gray-900 font-mono text-sm mt-1">{{ ticket.orderId }}</p>
          </div>
        </div>

        <div>
          <p class="text-gray-400 dark:text-gray-400 text-gray-500 text-xs uppercase font-semibold">Tanggal Transaksi</p>
          <p class="dark:text-white text-gray-900 mt-1">{{ new Date(ticket.createdAt).toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          }) }}</p>
        </div>

        <!-- QR Codes Section -->
        <div class="border-t dark:border-gray-700 border-gray-200 pt-4">
          <p class="text-gray-400 dark:text-gray-400 text-gray-500 text-xs uppercase font-semibold mb-3 text-center">Scan QR Code{{ ticket.tickets?.length > 1 ? ` (${ticket.tickets.length} tiket)` : '' }}</p>

          <!-- Multiple tickets with unique QR codes -->
          <div v-if="ticket.tickets && ticket.tickets.length > 0" class="space-y-4">
            <div v-for="(t, idx) in ticket.tickets" :key="t.id"
              class="rounded-xl p-4 flex flex-col items-center dark:bg-gray-700/50 bg-gray-100 dark:border-gray-600 border-gray-200 border">
              <span class="text-blue-400 text-sm font-semibold mb-2">Tiket #{{ idx + 1 }}</span>
              <span class="text-gray-500 text-xs font-mono mb-2">{{ t.ticketCode }}</span>
              <img
                v-if="t.qrCode"
                :src="t.qrCode"
                :alt="`QR Code Tiket ${idx + 1}`"
                class="w-40 h-40 rounded-lg border dark:border-gray-500 border-gray-300"
              />
              <div v-else class="w-40 h-40 rounded-lg flex items-center justify-center text-sm dark:bg-gray-600 bg-gray-200 dark:text-gray-400 text-gray-500">
                Generating...
              </div>
            </div>
          </div>

          <!-- Fallback: single QR (old transactions without tickets relation) -->
          <div v-else class="flex flex-col items-center">
            <img
              v-if="ticket.qrCode"
              :src="ticket.qrCode"
              alt="QR Code"
              class="w-48 h-48 rounded-lg border-2 dark:border-gray-600 border-gray-300"
            />
            <div v-else class="w-48 h-48 rounded-lg flex items-center justify-center text-sm dark:bg-gray-700 bg-gray-100 dark:text-gray-400 text-gray-500">
              QR Code belum tersedia
            </div>
          </div>

          <p class="text-gray-500 text-xs mt-3 text-center">Tunjukkan QR ini saat check-in</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 dark:bg-gray-900/50 bg-gray-50 flex justify-between items-center">
        <NuxtLink to="/transactions" class="text-blue-400 hover:text-blue-300 text-sm">
          &larr; Kembali
        </NuxtLink>
        <span class="px-3 py-1 rounded-full text-xs font-bold dark:bg-green-900 dark:text-green-300 bg-green-200 text-green-800">
          TERVERIFIKASI
        </span>
      </div>
    </div>
  </div>
</template>
