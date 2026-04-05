<script setup>
definePageMeta({ middleware: ['admin'] })

const { data: transactions, refresh: refreshTransactions, pending: transactionsPending } = useLazyAsyncData(
  'admin-transactions',
  () => $fetch('/api/admin/transactions'),
  { initialCache: false }
)

const { data: events, refresh: refreshEvents, pending: eventsPending } = useLazyAsyncData(
  'admin-events',
  () => $fetch('/api/admin/events'),
  { initialCache: false }
)

const allTx = computed(() => transactions.value?.transactions || [])
const allEv = computed(() => events.value?.events || [])

const top5 = computed(() => allTx.value.slice(0, 5))
const successCount = computed(() =>
  allTx.value.filter(t => t.status === 'SUCCESS' || t.status === 'SETTLEMENT').length
)

onMounted(async () => {
  await Promise.all([refreshTransactions(), refreshEvents()])
})

const statusClass = (status) => {
  if (status === 'SUCCESS' || status === 'SETTLEMENT') return 'bg-green-200 text-green-800'
  if (status === 'PENDING') return 'bg-yellow-200 text-yellow-800'
  return 'bg-red-200 text-red-800'
}
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 space-y-10">
    <h1 class="text-3xl font-bold">Admin Panel</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Total Transaksi</p>
        <p class="text-3xl font-bold mt-1">{{ allTx.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">Berhasil</p>
        <p class="text-3xl font-bold mt-1 text-green-600">{{ successCount }}</p>
      </div>
    </div>

    <!-- Section 1: Riwayat Transaksi (Top 5) -->
    <section>
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold">Transaksi Terbaru</h2>
        <NuxtLink to="/admin/dashboard" class="text-sm text-blue-600 hover:underline">
          Lihat Selengkapnya &rarr;
        </NuxtLink>
      </div>

      <div v-if="transactionsPending" class="text-center py-6 dark:text-gray-400 text-gray-500">Memuat...</div>

      <div v-else
        class="overflow-x-auto rounded-xl border dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-white">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-700 text-left text-xs uppercase text-gray-500 dark:text-gray-300">
              <th class="py-3 px-4">Order ID</th>
              <th class="py-3 px-4">Event</th>
              <th class="py-3 px-4">Harga</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4 text-right">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in top5" :key="tx.id"
              class="border-t dark:border-gray-700 border-gray-200 hover:bg-gray-500 dark:hover:bg-gray-750">
              <td class="py-2.5 px-4 font-mono text-xs">{{ tx.orderId }}</td>
              <td class="py-2.5 px-4">{{ tx.event?.title || '-' }}</td>
              <td class="py-2.5 px-4 font-semibold">Rp {{ tx.event?.price?.toLocaleString('id-ID') ||
                tx.amount?.toLocaleString('id-ID') }}</td>
              <td class="py-2.5 px-4 text-center">
                <span :class="statusClass(tx.status)" class="py-1 px-3 rounded-full text-xs font-bold">
                  {{ tx.status }}
                </span>
              </td>
              <td class="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 text-xs">
                {{ new Date(tx.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) }}
              </td>
            </tr>
            <tr v-if="top5.length === 0">
              <td colspan="5" class="py-8 text-center dark:text-gray-400 text-gray-500">Belum ada transaksi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 2: Kelola Event -->
    <section>
      <div class="flex justify-between items-center mb-3">
        <h2 class="text-xl font-bold">Kelola Event</h2>
        <NuxtLink to="/admin/events" class="text-sm text-blue-600 hover:underline">
          Kelola Event &rarr;
        </NuxtLink>
      </div>

      <div v-if="eventsPending" class="text-center py-6 dark:text-gray-400 text-gray-500">Memuat...</div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="ev in allEv" :key="ev.id"
          class="rounded-xl border dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-white p-4 shadow-sm">
          <h3 class="font-bold text-base mb-1">{{ ev.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {{ ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year:
                'numeric'
            }) : 'Belum ada tanggal' }}
          </p>
          <div class="flex justify-between items-center text-sm">
            <span class="font-semibold text-blue-600 dark:text-blue-400">Rp {{ ev.price.toLocaleString('id-ID')
            }}</span>
            <span :class="ev.remaining_slots <= 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'"
              class="font-semibold text-xs">
              Stok: {{ ev.remaining_slots }}/{{ ev.total_slots }}
            </span>
          </div>
          <NuxtLink :to="`/admin/events`"
            class="mt-3 block text-center text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg transition-colors">
            Edit
          </NuxtLink>
        </div>
        <div v-if="allEv.length === 0" class="col-span-full text-center py-8 dark:text-gray-400 text-gray-500">
          Belum ada event
        </div>
      </div>

      <NuxtLink to="/admin/events"
        class="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
        + Buat Event Baru
      </NuxtLink>
    </section>
  </div>
</template>
