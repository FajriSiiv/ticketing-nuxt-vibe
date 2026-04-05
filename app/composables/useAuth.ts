// composables/useAuth.ts
export const useAuthUser = () => {
  const authStore = useAuthStore();
  // Kita bungkus dalam computed agar reaktif (ikut berubah kalau user logout/login)
  return computed(() => authStore.user);
};
