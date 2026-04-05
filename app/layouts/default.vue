<script setup>
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

const authStore = useAuthStore()
const user = useAuthUser()
const themeStore = useThemeStore()

const showUserDropdown = ref(false)

onMounted(() => themeStore.init())

const handleLogout = () => {
    console.log('logout clicked')
    const yakin = window.confirm("Apakah Anda yakin ingin keluar? Sesi Anda akan berakhir.")
    if (yakin) {
        console.log('logout clicked')
        authStore.logout()
        alert("Anda telah berhasil logout.")
    }
}

const closeDropdown = (e) => {
    if (!e.target.closest('[data-user-dropdown]')) {
        showUserDropdown.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', closeDropdown)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', closeDropdown)
})
</script>

<template>
    <div
        :class="themeStore.theme === 'dark' ? 'min-h-screen bg-gray-900 text-white' : 'min-h-screen bg-gray-100 text-gray-900'">
        <nav :class="themeStore.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'"
            class="p-4 mb-6 flex items-center justify-between border-b-2">
            <!-- Left: Brand -->
            <NuxtLink to="/" class="font-bold text-xl text-blue-600 shrink-0">EventApp</NuxtLink>

            <!-- Center: Page Links -->
            <div class="absolute left-1/2 -translate-x-1/2 hidden md:flex gap-4 items-center">
                <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin"
                    class="text-sm text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Admin Dashboard
                </NuxtLink>
                <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/checkin"
                    class="text-sm text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Check-in Scanner
                </NuxtLink>
                <NuxtLink v-if="user" to="/transactions"
                    class="text-sm text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Riwayat Transaksi
                </NuxtLink>
            </div>

            <!-- Right: Theme Toggle + User / Login -->
            <div class="flex items-center gap-3">
                <button @click="themeStore.toggle"
                    :class="themeStore.theme === 'dark' ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'"
                    class="px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0"
                    :title="themeStore.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'">
                    {{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}
                </button>

                <template v-if="user">
                    <div class="relative shrink-0" data-user-dropdown>
                        <button @click.stop="showUserDropdown = !showUserDropdown"
                            class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div
                                class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                {{ (user.name || user.email).charAt(0).toUpperCase() }}
                            </div>
                            <span class="text-sm font-medium hidden sm:inline max-w-32 truncate">
                                {{ user.name || user.email }}
                            </span>
                        </button>

                        <div v-if="showUserDropdown"
                            class="absolute right-0 mt-2 w-40 rounded-lg shadow-lg border z-50 dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-200 py-1 px-2">
                            <button @click="handleLogout(); showUserDropdown = false"
                                class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 cursor-pointer rounded-md">
                                Logout
                            </button>
                        </div>
                    </div>
                </template>

                <NuxtLink v-else to="/login" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                    Login
                </NuxtLink>
            </div>
        </nav>

        <!-- Mobile nav (shown below md) -->
        <div class="md:hidden container mx-auto px-4 mb-4">
            <div class="flex gap-4 text-xs">
                <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin"
                    class="text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Admin
                </NuxtLink>
                <NuxtLink v-if="user?.role === 'ADMIN'" to="/admin/checkin"
                    class="text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Check-in
                </NuxtLink>
                <NuxtLink v-if="user" to="/transactions" class="text-gray-500 hover:text-blue-500 dark:text-gray-400">
                    Riwayat Transaksi
                </NuxtLink>
            </div>
        </div>

        <main class="container mx-auto px-4">
            <slot />
        </main>
    </div>
</template>
