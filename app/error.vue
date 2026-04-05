<script setup lang="ts">
const props = defineProps<{
  error: { statusCode: number; statusMessage: string; message: string }
}>()

const error = computed(() => ({
  statusCode: props.error?.statusCode || 500,
  statusMessage: props.error?.statusMessage || 'Terjadi kesalahan',
}))

const countdown = ref(30)
let timer: ReturnType<typeof setInterval>

function goHome() {
  clearInterval(timer)
  navigateTo('/')
}

onMounted(() => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      goHome()
    }
  }, 1000)
})

onUnmounted(() => clearInterval(timer))

const title = computed(() => {
  if (error.value.statusCode === 404) return 'Halaman Tidak Ditemukan'
  if (error.value.statusCode === 403) return 'Akses Ditolak'
  if (error.value.statusCode === 401) return 'Belum Login'
  return 'Terjadi Kesalahan'
})

const description = computed(() => {
  if (error.value.statusCode === 404) return 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.'
  if (error.value.statusCode === 403) return 'Kamu tidak memiliki akses ke halaman ini.'
  if (error.value.statusCode === 401) return 'Silakan login terlebih dahulu.'
  return `Terjadi kesalahan di server (${error.value.statusCode}). Tim kami sedang menangani.`
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
    <div class="text-center max-w-md bg-gray-800 rounded-2xl shadow-2xl p-10 border border-gray-700">
      <p class="text-8xl font-bold text-blue-500 mb-4">{{ error.statusCode }}</p>
      <h1 class="text-2xl font-bold text-white mb-2">{{ title }}</h1>
      <p class="text-gray-400 mb-8">{{ description }}</p>

      <button
        @click="goHome()"
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Kembali ke Beranda
      </button>

      <p class="text-sm text-gray-500 mt-6">
        Otomatis kembali dalam <span class="text-blue-400 font-bold">{{ countdown }}</span> detik
      </p>
    </div>
  </div>
</template>
