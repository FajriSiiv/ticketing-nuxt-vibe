<script setup lang="ts">
import { useTicketStore } from '~/stores/ticketStore'
import { useAuthUser } from '../composables/useAuth'

const ticketStore = useTicketStore()
const user = useAuthUser()

const showQuantityModal = ref(false)
const selectedEvent = ref<any>(null)
const selectedQuantity = ref(1)

const maxBuyQuantity = computed(() => {
  if (!selectedEvent.value) return 1
  return Math.min(3, selectedEvent.value.remaining_slots)
})

const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return 'Belum ditentukan'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const openQuantityModal = (eventItem: any) => {
  if (!user.value) {
    alert("Anda harus login terlebih dahulu")
    return
  }
  selectedEvent.value = eventItem
  selectedQuantity.value = 1
  showQuantityModal.value = true
}

const handleCheckout = () => {
  if (!selectedEvent.value || !user.value) {
    alert("Anda harus login terlebih dahulu")
    return
  }
  showQuantityModal.value = false
  ticketStore.checkout(selectedEvent.value.id, selectedQuantity.value)
}

onMounted(async () => {
  await ticketStore.fetchEvents()
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Event Tersedia</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Temukan dan beli tiket event favoritmu</p>
    </div>

    <div v-if="ticketStore.loading" class="text-center py-10 dark:text-gray-400 text-gray-600">
      Sedang memuat data...
    </div>

    <div v-else-if="ticketStore.events.length === 0"
      class="text-center py-16 bg-gray-800 rounded-xl dark:bg-gray-800 bg-gray-100">
      <p class="dark:text-gray-400 text-gray-500">Belum ada event tersedia.</p>
    </div>

    <!-- Grid: 1 mobile, 2 tablet, 5 desktop -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div v-for="event in ticketStore.events" :key="event.id"
        class="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-4 pb-3">
          <h2 class="font-bold text-lg text-white leading-tight line-clamp-2">{{ event.title }}</h2>
          <p class="text-blue-200 text-xs mt-1">{{ formatDate(event.eventDate) }}</p>
        </div>

        <!-- Body -->
        <div class="flex-1 p-4 space-y-2">
          <p v-if="event.description"
            class="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">{{ event.description }}</p>

          <div class="space-y-1 pt-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500 dark:text-gray-400">Harga</span>
              <span class="font-bold text-blue-600 dark:text-blue-400">Rp {{ event.price.toLocaleString('id-ID') }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500 dark:text-gray-400">Sisa Stok</span>
              <span :class="event.remaining_slots <= 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'" class="font-semibold">
                {{ event.remaining_slots }} / {{ event.total_slots }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 pt-0">
          <button @click="openQuantityModal(event)"
            class="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="event.remaining_slots <= 0 || ticketStore.loading">
            {{ event.remaining_slots > 0 ? 'Beli Tiket' : 'Habis' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Quantity Selection Modal -->
    <div v-if="showQuantityModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showQuantityModal = false">
      <div class="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-white">Pilih Jumlah Tiket</h2>
          <button @click="showQuantityModal = false"
            class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div class="bg-gray-700 rounded-lg p-3 mb-4">
          <p class="text-white font-semibold text-sm">{{ selectedEvent?.title }}</p>
          <p class="text-gray-300 text-xs mt-1">
            Rp {{ selectedEvent?.price.toLocaleString('id-ID') }} &times; <span class="font-bold">{{ selectedQuantity }}</span>
            = <span class="text-green-400 font-bold">Rp {{ (selectedEvent?.price * selectedQuantity).toLocaleString('id-ID') }}</span>
          </p>
          <p class="text-gray-400 text-xs mt-1">Sisa stok: {{ selectedEvent?.remaining_slots }}</p>
        </div>

        <div class="flex justify-center gap-2 mb-4">
          <button
            v-for="qty in Math.min(3, selectedEvent?.remaining_slots)"
            :key="qty"
            @click="selectedQuantity = qty"
            :class="[
              'w-12 h-12 rounded-full font-bold text-lg transition-all border-2',
              selectedQuantity === qty
                ? 'bg-green-500 border-green-500 text-white scale-110 shadow-lg'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-400'
            ]">
            {{ qty }}
          </button>
        </div>

        <div class="bg-blue-900/40 border border-blue-800 rounded-lg p-3 mb-4">
          <p class="text-blue-300 text-xs">Setiap tiket akan memiliki QR Code unik untuk check-in terpisah</p>
        </div>

        <button @click="handleCheckout"
          :disabled="!selectedQuantity || ticketStore.loading"
          class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors">
          {{ ticketStore.loading ? 'Memproses...' : `Checkout (${selectedQuantity} tiket)` }}
        </button>
      </div>
    </div>
  </div>
</template>
