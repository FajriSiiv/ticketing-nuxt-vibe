<template>
    <div class="dashboard-page">
        <button @click="refreshData()" class="bg-blue-600 text-white px-2 py-1 text-xs rounded mb-4">
            Force Reload Data
        </button>
        <NuxtLink to="/admin/events"
            class="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs rounded transition-colors">
            Kelola Event
        </NuxtLink>
        <span v-if="pending || pageLoading" class="ml-2 text-xs text-yellow-500 italic">
            <span>{{ pageLoading ? 'Memuat halaman...' : 'Memuat...' }}</span>
        </span>
        <div class="p-8 min-h-screen">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-3xl font-bold mb-6">Riwayat Transaksi</h1>

                <!-- Statistik Ringkas -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div class="bg-gray-700 p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <p class="text-sm  uppercase font-semibold">Total Transaksi</p>
                        <p class="text-2xl font-bold">{{ total }}</p>
                    </div>
                    <div class="bg-gray-700 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                        <p class="text-sm  uppercase font-semibold">Berhasil (Success)</p>
                        <p class="text-2xl font-bold text-green-600">{{ successCount }}</p>
                    </div>
                    <div class="bg-gray-700 p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                        <p class="text-sm  uppercase font-semibold">Halaman</p>
                        <p class="text-2xl font-bold">{{ currentPage }} / {{ totalPages }}</p>
                    </div>
                </div>

                <!-- Tabel Transaksi -->
                <div v-if="transactions && transactions.length > 0"
                    class="bg-gray-700 rounded-lg shadow overflow-hidden">
                    <div v-if="pageLoading"
                        class="bg-teal-800 text-white animate-pulse py-2 px-6 text-center font-medium">
                        Memuat data...
                    </div>
                    <table v-else class="min-w-full leading-normal">
                        <thead>
                            <tr class="bg-gray-700 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 text-left">Order ID</th>
                                <th class="py-3 px-6 text-left">Event</th>
                                <th class="py-3 px-6 text-left">Harga</th>
                                <th class="py-3 px-6 text-center">Status</th>
                                <th class="py-3 px-6 text-center">Tanggal</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm font-light">
                            <tr v-for="tx in transactions" :key="tx.id"
                                class="border-b border-gray-200 hover:bg-gray-500">
                                <td class="py-3 px-6 text-left font-mono">{{ tx.orderId }}</td>
                                <td class="py-3 px-6 text-left">{{ tx.event?.title }}</td>
                                <td class="py-3 px-6 text-left">Rp {{ tx.event?.price?.toLocaleString() }}</td>
                                <td class="py-3 px-6 text-center">
                                    <span :class="{
                                        'bg-green-200 text-green-800': tx.status === 'SUCCESS' || tx.status === 'SETTLEMENT',
                                        'bg-yellow-200 text-yellow-800': tx.status === 'PENDING',
                                        'bg-red-200 text-red-800': tx.status === 'FAILED' || tx.status === 'FAILED_OUT_OF_STOCK' || tx.status === 'CANCEL' || tx.status === 'EXPIRE',
                                    }" class="py-1 px-3 rounded-full text-xs font-bold">
                                        {{ tx.status }}
                                    </span>
                                </td>
                                <td class="py-3 px-6 text-center">
                                    {{ new Date(tx.createdAt).toLocaleString('id-ID') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-4">
                    <button :disabled="currentPage <= 1" @click="changePage(currentPage - 1)"
                        class="px-3 py-1 text-sm rounded bg-gray-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors">
                        &laquo; Prev
                    </button>

                    <template v-for="p in visiblePages" :key="p">
                        <button v-if="typeof p === 'number'"
                            :class="p === currentPage ? 'bg-blue-600 font-bold' : 'bg-gray-600 hover:bg-gray-500'"
                            @click="changePage(p)" class="px-3 py-1 text-sm rounded text-white transition-colors">
                            {{ p }}
                        </button>
                        <span v-else class="px-2 text-white">...</span>
                    </template>

                    <button :disabled="currentPage >= totalPages" @click="changePage(currentPage + 1)"
                        class="px-3 py-1 text-sm rounded bg-gray-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-500 transition-colors">
                        Next &raquo;
                    </button>
                </div>

                <div v-else class="text-center p-10 bg-gray-800 rounded-lg">
                    <p class="text-gray-400 italic">Belum ada data transaksi atau sedang memuat...</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

const user = useAuthUser()

definePageMeta({
    middleware: ['admin']
})

const PAGE_SIZE = 10

const currentPage = ref(1)
const total = ref(0)
const transactions = ref([])
const pageLoading = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const visiblePages = computed(() => {
    const pages = []
    const show = totalPages.value
    if (show <= 7) {
        for (let i = 1; i <= show; i++) pages.push(i)
        return pages
    }
    pages.push(1)
    if (currentPage.value > 3) pages.push('...')
    const start = Math.max(2, currentPage.value - 1)
    const end = Math.min(show - 1, currentPage.value + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage.value < show - 2) pages.push('...')
    pages.push(show)
    return pages
})

async function fetchTransactions() {
    pageLoading.value = true
    try {
        const res = await $fetch('/api/admin/transactions', {
            query: { page: currentPage.value, limit: PAGE_SIZE }
        })
        transactions.value = res.transactions || []
        total.value = res.total || 0
    } catch (e) {
        console.error('Gagal fetch transaksi:', e)
    } finally {
        pageLoading.value = false
    }
}

onMounted(async () => {
    console.log("Component Mounted. User role:", user.value?.role)
    await fetchTransactions()
})

function refreshData() {
    currentPage.value = 1
    fetchTransactions()
}

async function changePage(page) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    await fetchTransactions()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const successCount = computed(() => {
    return transactions.value?.filter(t => t.status === 'SUCCESS' || t.status === 'SETTLEMENT').length || 0
})

// Auto-refresh 5 menit + auto verify PENDING
let interval
onMounted(() => {
    interval = setInterval(async () => {
        if (transactions.value) {
            const pendingTrx = transactions.value.filter(
                (t) => t.status === 'PENDING'
            )
            for (const t of pendingTrx) {
                try {
                    await $fetch('/api/transactions/verify', {
                        method: 'POST',
                        body: { orderId: t.orderId }
                    })
                } catch (e) {
                    // Gagal verify satu, lanjut berikutnya
                }
            }
        }
        await fetchTransactions()
    }, 300000)
})
onUnmounted(() => clearInterval(interval))
</script>
