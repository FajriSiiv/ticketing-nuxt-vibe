<template>
    <div :class="themeStore.theme === 'dark' ? 'min-h-[80vh] flex items-center justify-center' : 'min-h-[80vh] flex items-center justify-center bg-gray-100'">
        <div :class="themeStore.theme === 'dark'
            ? 'bg-gray-800 rounded-xl shadow-lg w-full max-w-md border border-gray-700'
            : 'bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-200 p-8'">

            <!-- Theme toggle -->
            <div class="flex justify-end mb-2">
                <button @click="themeStore.toggle"
                    :class="themeStore.theme === 'dark' ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'"
                    class="px-2 py-1 rounded text-sm transition-colors"
                    :title="themeStore.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
                    {{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}
                </button>
            </div>

            <h1 :class="themeStore.theme === 'dark' ? 'text-white' : 'text-gray-900'" class="text-3xl font-bold mb-6 text-center">
                {{ isRegister ? 'Daftar Akun' : 'Masuk' }}
            </h1>

            <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 px-8 pb-6">
                <!-- Email (only for register) -->
                <div v-if="isRegister">
                    <label class="block text-sm font-semibold mb-2 dark:text-gray-300 text-gray-700">Email</label>
                    <input v-model="form.email" type="email" :required="isRegister"
                        :class="themeStore.theme === 'dark'
                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500'"
                        class="w-full px-4 py-3 rounded-lg focus:outline-none transition-all border"
                        placeholder="nama@email.com" />
                </div>

                <div>
                    <label class="block text-sm font-semibold mb-2" :class="themeStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Nama Pengguna</label>
                    <input v-model="form.name" type="text" required
                        :class="themeStore.theme === 'dark'
                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500'"
                        class="w-full px-4 py-3 rounded-lg focus:outline-none transition-all border"
                        placeholder="Masukkan nama Anda..." />
                </div>

                <div>
                    <label class="block text-sm font-semibold mb-2" :class="themeStore.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">Password</label>
                    <input v-model="form.password" type="password" required minlength="6"
                        :class="themeStore.theme === 'dark'
                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500'"
                        class="w-full px-4 py-3 rounded-lg focus:outline-none transition-all border"
                        placeholder="Minimal 6 karakter" />
                </div>

                <div v-if="error" class="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm border border-red-500/50">
                    {{ error }}
                </div>

                <button :disabled="loading" type="submit"
                    class="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center disabled:opacity-75">
                    <span v-if="loading" class="animate-spin h-5 w-5 mr-3 border-2 border-white/20 border-t-white rounded-full"></span>
                    {{ loading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Masuk') }}
                </button>
            </form>

            <!-- Toggle login/register -->
            <div class="mt-4 text-center px-8 pb-4">
                <button @click="isRegister = !isRegister; error = ''" class="text-blue-400 hover:text-blue-300 text-sm">
                    {{ isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar' }}
                </button>
            </div>

            <!-- WhatsApp CTA Button -->
            <div class="mt-2 px-8 pb-8 pt-6" :class="themeStore.theme === 'dark' ? 'border-t border-gray-700' : 'border-t border-gray-200'">
                <p class="text-center text-sm mb-3" :class="themeStore.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">Butuh bantuan? Hubungi kami</p>
                <a href="https://wa.me/6282200000000" target="_blank" rel="noopener noreferrer"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>Chat via WhatsApp</span>
                </a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '~/stores/authStore'

definePageMeta({
    middleware: 'guest'
})

const authStore = useAuthStore()
const themeStore = useThemeStore()
const isRegister = ref(false)
const form = ref({ name: '', password: '', email: '' })
const loading = ref(false)
const error = ref('')

onMounted(() => themeStore.init())

const handleSubmit = async () => {
    if (!form.value.name.trim() || !form.value.password.trim()) return;

    loading.value = true
    error.value = ''
    try {
        if (isRegister.value) {
            await authStore.register(form.value.name, form.value.password, form.value.email)
        } else {
            await authStore.login(form.value.name, form.value.password)
        }

        if (authStore.user?.role === 'ADMIN') {
            navigateTo('/admin', { replace: true })
        } else {
            navigateTo('/', { replace: true })
        }
    } catch (e) {
        error.value = e?.data?.statusMessage || e?.message || 'Terjadi kesalahan'
    } finally {
        loading.value = false
    }
}
</script>
