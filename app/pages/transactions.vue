<script setup>
const user = useAuthUser()
const transactions = ref([])
const loading = ref(true)
const vaData = ref(null)
const fetchingVa = ref(false)
const selectedTrx = ref(null)

const fetchTransactions = async () => {
  if (!user.value?.id) return
  try {
    const response = await $fetch(`/api/transactions/${user.value.id}`)
    if (response.success) {
      transactions.value = response.transactions

      // Sync status: verify semua PENDING yang punya snapToken
      const pendingTrx = response.transactions.filter(
        (t) => t.status === 'PENDING' && t.snapToken
      )
      for (const t of pendingTrx) {
        try {
          await $fetch('/api/transactions/verify', {
            method: 'POST',
            body: { orderId: t.orderId }
          })
        } catch (e) {
          // Gagal verify satu, lanjut ke berikutnya
        }
      }

      // Ambil ulang setelah sync
      const refreshed = await $fetch(`/api/transactions/${user.value.id}`)
      if (refreshed.success) {
        transactions.value = refreshed.transactions
      }
    }
  } catch (error) {
    console.error('Failed to fetch transactions', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchTransactions()
})

// Auto-refresh 30 detik
let interval
onMounted(() => {
  interval = setInterval(() => fetchTransactions(), 30000)
})
onUnmounted(() => clearInterval(interval))

const getStatusColor = (status) => {
  const base = 'px-3 py-1 rounded-full text-xs font-medium'
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
    case 'SETTLEMENT':
      return `${base} dark:bg-green-900 dark:text-green-300 bg-green-100 text-green-800`
    case 'PENDING':
      return `${base} dark:bg-yellow-900 dark:text-yellow-300 bg-yellow-100 text-yellow-800`
    case 'EXPIRE':
    case 'CANCEL':
    case 'FAILED':
    case 'FAILED_OUT_OF_STOCK':
      return `${base} dark:bg-red-900 dark:text-red-300 bg-red-100 text-red-800`
    case 'CHALLENGE':
      return `${base} dark:bg-orange-900 dark:text-orange-300 bg-orange-100 text-orange-800`
    default:
      return `${base} dark:bg-gray-700 dark:text-gray-300 bg-gray-100 text-gray-800`
  }
}

const getStatusLabel = (status) => {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
    case 'SETTLEMENT':
      return 'Lunas'
    case 'PENDING':
      return 'Menunggu Pembayaran'
    case 'EXPIRE':
      return 'Kadaluarsa'
    case 'CANCEL':
      return 'Dibatalkan'
    case 'FAILED':
      return 'Gagal'
    case 'FAILED_OUT_OF_STOCK':
      return 'Stok Habis (Refund)'
    case 'CHALLENGE':
      return 'Diverifikasi Manual'
    default:
      return status
  }
}

async function fetchVA(trx) {
  selectedTrx.value = trx
  fetchingVa.value = true
  try {
    const res = await $fetch('/api/transactions/check-payment', {
      params: { orderId: trx.orderId }
    })
    if (res.success) {
      vaData.value = { bcaVa: res.bcaVa, grossAmount: res.grossAmount }
    }
  } catch (e) {
    console.error('Failed to fetch VA:', e)
  } finally {
    fetchingVa.value = false
  }
}

function clearVA() {
  vaData.value = null
  selectedTrx.value = null
  fetchingVa.value = false
}

async function copyVA(va) {
  await navigator.clipboard.writeText(va)
  alert('VA berhasil disalin!')
}

const payPending = async (trx) => {
  if (!selectedTrx.value?.snapToken && !trx.snapToken) {
    alert('Token pembayaran tidak tersedia. Silakan buat pesanan baru.')
    return
  }
  const triggerSnap = () => {
    if (window.snap) {
      window.snap.pay(trx.snapToken, {
        onSuccess: async () => {
          try {
            const res = await $fetch('/api/transactions/verify', {
              method: 'POST',
              body: { orderId: trx.orderId }
            })
            if (res.success && res.status === 'SUCCESS') {
              alert('Pembayaran Berhasil! Terima kasih.')
              await fetchTransactions()
            } else {
              alert('Pembayaran diproses tapi status belum lunas. Silakan cek kembali.')
              await fetchTransactions()
            }
          } catch (e) {
            alert('Gagal memverifikasi pembayaran. Silakan cek riwayat transaksi.')
            await fetchTransactions()
          }
        },
        onPending: () => {
          alert('Menunggu pembayaran Anda!')
          fetchTransactions()
        },
        onError: () => {
          alert('Pembayaran Gagal!')
          fetchTransactions()
        },
        onClose: () => {
          fetchTransactions()
        }
      })
    } else {
      setTimeout(triggerSnap, 500)
    }
  }
  triggerSnap()
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <div class="w-full flex justify-center items-center">

      <h1
        class="text-3xl font-bold mb-6 px-4 py-2 rounded shadow-md dark:text-white dark:bg-gray-800 text-gray-900 bg-white w-fit">
        Riwayat Transaksi
      </h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <p class=" dark:text-gray-400 text-gray-600">Memuat riwayat transaksi...</p>
    </div>

    <div v-else-if="!user" class="text-center py-10 rounded-lg shadow-lg dark:bg-gray-800 bg-white">
      <p class="dark:text-gray-400 text-gray-600">Anda harus login terlebih dahulu.</p>
      <NuxtLink to="/login"
        class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Login
      </NuxtLink>
    </div>

    <div v-else-if="transactions.length === 0" class="text-center py-10 rounded-lg shadow-lg dark:bg-gray-800 bg-white">
      <p class="dark:text-gray-400 text-gray-600">Anda belum memiliki transaksi.</p>
      <NuxtLink to="/" class="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Cari Tiket Event
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div v-for="trx in transactions" :key="trx.id"
        class="rounded-lg shadow border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4  transition-colors duration-300 dark:bg-gray-800 dark:border-gray-700 hover:dark:border-gray-500 bg-white border-gray-200 hover:border-gray-400">
        <div>
          <h2 class="text-xl font-semibold dark:text-white text-gray-900">{{ trx.event?.title || 'Event tidak diketahui'
          }}</h2>
          <p class="text-sm dark:text-gray-400 text-gray-500 mt-1">Order ID: <span
              class="dark:text-gray-300 text-gray-700 font-mono">{{ trx.orderId
              }}</span></p>
          <p class="text-sm dark:text-gray-400 text-gray-500">Tanggal: <span class="dark:text-gray-300 text-gray-700">{{
            new
              Date(trx.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric', hour:
                  '2-digit', minute: '2-digit'
              }) }}</span></p>
          <p v-if="trx.tickets && trx.tickets.length > 0" class="text-sm text-blue-400 mt-1">
            Jumlah Tiket: <span class="font-bold">{{ trx.tickets.length }}</span>
          </p>
          <p v-if="trx.notes" class="text-sm dark:text-gray-400 text-gray-500 mt-1">Catatan: <span
              class="dark:text-gray-300 text-gray-700">{{
                trx.notes }}</span></p>
        </div>

        <div class="flex flex-col items-end gap-2 text-right min-w-[180px]">
          <span class="text-lg font-bold dark:text-white text-gray-900">Rp {{ trx.amount.toLocaleString('id-ID')
          }}</span>
          <span :class="getStatusColor(trx.status)">
            {{ getStatusLabel(trx.status) }}
          </span>

          <!-- Action Buttons -->
          <div v-if="trx.status === 'PENDING' && trx.snapToken" class="w-full mt-4">
            <!-- VA Display Area -->
            <div v-if="selectedTrx?.orderId === trx.orderId && fetchingVa"
              class="mt-2 text-sm dark:text-gray-300 text-gray-700">
              Memuat detail pembayaran...
            </div>
            <div v-if="selectedTrx?.orderId === trx.orderId && vaData && !fetchingVa"
              class="mt-2 p-4 rounded-lg border dark:border-gray-600 bg-gray-200 dark:bg-gray-900">
              <p class="text-xs font-semibold uppercase dark:text-gray-100 text-gray-900 mb-2">Virtual Account BCA</p>
              <div v-if="vaData.bcaVa" class="flex items-center gap-2">
                <code
                  class="text-lg font-mono font-bold dark:text-white text-gray-900">{{ vaData.bcaVa.va_number }}</code>
                <button @click="copyVA(vaData.bcaVa.va_number)"
                  class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors">
                  Copy
                </button>
              </div>
              <p v-else class="text-sm text-gray-900 dark:text-gray-200 text-gray-500">VA BCA tidak ditemukan untuk
                transaksi ini.</p>
              <div class="flex gap-2 mt-3">
                <button @click="payPending(trx)"
                  class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                  Bayar Sekarang
                </button>
                <button @click="clearVA()"
                  class="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                  Tutup
                </button>
              </div>
              <p class="text-xs dark:text-gray-100 text-gray-900 mt-2">Nominal: Rp {{
                Number(vaData.grossAmount).toLocaleString('id-ID') }}</p>
            </div>

            <div v-else class="flex flex-col items-end gap-1">
              <button @click="fetchVA(trx)"
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                Lihat VA BCA
              </button>
              <button @click="payPending(trx)"
                class="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors">
                Bayar Sekarang via Snap
              </button>
            </div>
          </div>
          <div v-if="trx.status === 'SUCCESS' || trx.status === 'SETTLEMENT'"
            class="mt-2 flex flex-col items-end gap-1">
            <NuxtLink :to="`/my-ticket/${trx.orderId}`"
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors inline-block">
              Lihat Tiket
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
