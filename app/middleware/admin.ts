// middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuthUser();
  if (!user.value) {
    return navigateTo("/login");
  }
  if (user.value.role !== "ADMIN") {
    return navigateTo("/");
  }
});
