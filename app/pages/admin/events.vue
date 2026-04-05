<script setup>
definePageMeta({
  middleware: ['admin']
})

const events = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingEvent = ref(null)
const formErrors = ref('')

const formatEventDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

const form = ref({
  title: '',
  description: '',
  price: 0,
  total_slots: 0,
  eventDate: ''
})

const fetchEvents = async () => {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/events')
    if (res.success) events.value = res.events
  } catch (e) {
    console.error('Failed to fetch events', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchEvents())

const openCreate = () => {
  editingEvent.value = null
  form.value = { title: '', description: '', price: 0, total_slots: 0, eventDate: '' }
  formErrors.value = ''
  showModal.value = true
}

const openEdit = (eventItem) => {
  editingEvent.value = eventItem
  form.value = {
    title: eventItem.title,
    description: eventItem.description || '',
    price: eventItem.price,
    total_slots: eventItem.total_slots,
    eventDate: formatEventDate(eventItem.eventDate)
  }
  formErrors.value = ''
  showModal.value = true
}

const saveEvent = async () => {
  formErrors.value = ''

  if (!form.value.title.trim()) {
    formErrors.value = 'Judul wajib diisi'
    return
  }
  if (!form.value.price || form.value.price <= 0) {
    formErrors.value = 'Harga harus lebih dari 0'
    return
  }
  if (!form.value.total_slots || form.value.total_slots <= 0) {
    formErrors.value = 'Kuota harus lebih dari 0'
    return
  }

  try {
    if (editingEvent.value) {
      const res = await $fetch(`/api/admin/events/${editingEvent.value.id}`, {
        method: 'PUT',
        body: form.value
      })
      if (res.success) {
        showModal.value = false
        await fetchEvents()
      } else {
        formErrors.value = res.message
      }
    } else {
      const res = await $fetch('/api/admin/events', {
        method: 'POST',
        body: form.value
      })
      if (res.success) {
        showModal.value = false
        await fetchEvents()
      } else {
        formErrors.value = res.message
      }
    }
  } catch (e) {
    formErrors.value = 'Gagal menyimpan data'
  }
}

const deleteEvent = async (id) => {
  if (!confirm('Yakin ingin menghapus event ini? Semua transaksi terkait juga akan dihapus.')) return
  try {
    const res = await $fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    if (res.success) {
      await fetchEvents()
    } else {
      alert(res.message)
    }
  } catch (e) {
    alert('Gagal menghapus event')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-white">Kelola Event</h1>
      <button @click="openCreate"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
        + Buat Event Baru
      </button>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      @click.self="showModal = false">
      <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-700">
        <h2 class="text-xl font-bold text-white mb-4">
          {{ editingEvent ? 'Edit Event' : 'Buat Event Baru' }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-semibold mb-1">Judul Event</label>
            <input v-model="form.title" type="text" placeholder="Contoh: Konser Musik 2025"
              class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-semibold mb-1">Deskripsi</label>
            <textarea v-model="form.description" rows="3" placeholder="Deskripsi event..."
              class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-gray-300 text-sm font-semibold mb-1">Tanggal Event</label>
            <input v-model="form.eventDate" type="date"
              class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-300 text-sm font-semibold mb-1">Harga (Rp)</label>
              <input v-model.number="form.price" type="number" min="0" placeholder="50000"
                class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-gray-300 text-sm font-semibold mb-1">Total Kuota</label>
              <input v-model.number="form.total_slots" type="number" min="1" placeholder="100"
                class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div v-if="formErrors" class="bg-red-500/20 text-red-400 p-3 rounded text-sm border border-red-500/50">
            {{ formErrors }}
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showModal = false"
            class="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors">
            Batal
          </button>
          <button @click="saveEvent"
            class="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            {{ editingEvent ? 'Simpan' : 'Buat' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Events Table -->
    <div v-if="loading" class="text-center py-10">
      <p class="text-gray-400">Memuat event...</p>
    </div>

    <div v-else-if="events.length === 0" class="text-center py-10 bg-gray-800 rounded-lg shadow-lg">
      <p class="text-gray-400">Belum ada event.</p>
    </div>

    <div v-else class="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
      <table class="min-w-full leading-normal">
        <thead>
          <tr class="bg-gray-900 uppercase text-sm leading-normal text-gray-300">
            <th class="py-3 px-6 text-left">Tanggal</th>
            <th class="py-3 px-6 text-left">Judul</th>
            <th class="py-3 px-6 text-right">Harga</th>
            <th class="py-3 px-6 text-center">Stok</th>
            <th class="py-3 px-6 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="ev in events" :key="ev.id" class="border-b border-gray-700 hover:bg-gray-750">
            <td class="py-3 px-6 text-xs text-gray-400 whitespace-nowrap">
              {{ ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short',
                year: 'numeric' }) : '-' }}
            </td>
            <td class="py-3 px-6">
              <p class="font-semibold text-white">{{ ev.title }}</p>
              <p v-if="ev.description" class="text-gray-400 text-xs truncate max-w-xs">{{ ev.description }}</p>
            </td>
            <td class="py-3 px-6 text-right text-white font-semibold">
              Rp {{ ev.price.toLocaleString('id-ID') }}
            </td>
            <td class="py-3 px-6 text-center">
              <span :class="ev.remaining_slots <= 0 ? 'text-red-400' : 'text-green-400'">
                {{ ev.remaining_slots }}/{{ ev.total_slots }}
              </span>
            </td>
            <td class="py-3 px-6 text-center flex gap-2 justify-center">
              <button @click="openEdit(ev)"
                class="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded transition-colors">
                Edit
              </button>
              <button @click="deleteEvent(ev.id)"
                class="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors">
                Hapus
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
