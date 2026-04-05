<script setup>
definePageMeta({ middleware: 'admin' })

const ticketCode = ref('')
const loading = ref(false)
const result = ref(null)
const scanning = ref(false)
const scannerKey = ref(0) // Force re-mount for reset

// Client-side QR scanner
let html5QrCode = null

const startScanner = async () => {
  scanning.value = true
  result.value = null
  scannerKey.value++
  await nextTick()

  const { Html5Qrcode } = await import('html5-qrcode')
  html5QrCode = new Html5Qrcode('qr-reader')

  try {
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // QR code scanned — stop scanner and process
        html5QrCode.stop().then(() => {
          scanning.value = false
          ticketCode.value = decodedText
          handleCheckin()
        }).catch(() => {
          scanning.value = false
          ticketCode.value = decodedText
          handleCheckin()
        })
      },
      () => {
        // Scan error — ignore, user may not hold QR steady
      }
    )
  } catch (err) {
    console.error('Scanner start failed:', err)
    scanning.value = false
    alert('Gagal mengakses kamera. Gunakan input manual.')
  }
}

const stopScanner = async () => {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
    } catch (_e) { }
    html5QrCode = null
  }
  scanning.value = false
}

const handleCheckin = async () => {
  if (!ticketCode.value.trim()) return

  loading.value = true
  result.value = null

  try {
    const res = await $fetch('/api/tickets/checkin', {
      method: 'POST',
      body: { ticketCode: ticketCode.value.trim() },
    })
    result.value = res
    if (res.success) {
      ticketCode.value = ''
    }
  } catch (err) {
    result.value = { success: false, message: err?.data?.message || err?.statusMessage || 'Gagal menghubungi server' }
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => { })
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-6 space-y-6">
    <h1 class="text-2xl font-bold">Check-in Scanner</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">Scan QR Code tiket atau masukkan ticket code secara manual.</p>

    <!-- Camera Scanner -->
    <div class="rounded-xl border dark:border-gray-700 border-gray-200 p-4">
      <div class="flex justify-between items-center mb-3">
        <h2 class="font-semibold">Scan via Kamera</h2>
        <button v-if="scanning" @click="stopScanner"
          class="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
          Stop Scanner
        </button>
      </div>

      <div v-if="!scanning" class="text-center py-6">
        <button @click="startScanner" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Mulai Kamera
        </button>
      </div>

      <div v-else class="rounded-lg overflow-hidden bg-black">
        <div :key="scannerKey" id="qr-reader" class="w-full max-w-md mx-auto"></div>
      </div>
    </div>

    <!-- Manual Input -->
    <div class="rounded-xl border dark:border-gray-700 border-gray-200 p-4">
      <h2 class="font-semibold mb-3">Input Manual</h2>
      <form @submit.prevent="handleCheckin" class="flex gap-2">
        <input v-model="ticketCode" type="text" placeholder="TKT-xxxxx-xxxxx-0"
          class="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white border-gray-300" />
        <button type="submit" :disabled="loading || !ticketCode.trim()"
          class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
          {{ loading ? 'Memproses...' : 'Check-in' }}
        </button>
      </form>
    </div>

    <!-- Result -->
    <div v-if="result" :class="result.success
      ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-700'
      : 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-700'" class="rounded-xl border p-4 space-y-2">
      <p class="font-bold"
        :class="result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
        {{ result.success ? '✅' : '❌' }} {{ result.message }}
      </p>
      <template v-if="result.ticket">
        <div class="text-sm space-y-1 dark:text-gray-300 text-gray-700">
          <p><strong>Tiket:</strong> {{ result.ticket.ticketCode }}</p>
          <p><strong>Event:</strong> {{ result.ticket.eventTitle }}</p>
          <p><strong>Pembeli:</strong> {{ result.ticket.buyerName }}</p>
          <p v-if="result.ticket.scannedAt"><strong>Scanned at:</strong> {{ new
            Date(result.ticket.scannedAt).toLocaleString('id-ID') }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
#qr-reader video {
  border-radius: 0.5rem;
}
</style>
