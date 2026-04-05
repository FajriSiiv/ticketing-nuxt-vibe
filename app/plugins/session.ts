export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  // Restore session from server (httpOnly cookie)
  try {
    const { user } = await $fetch("/api/auth/session");
    if (user) {
      authStore.user = user;
    }
  } catch {
    // Not logged in
  }
});
