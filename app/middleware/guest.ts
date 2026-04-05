// middleware/guest.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useAuthUser();

  // Jika user SUDAH login, dan mencoba akses halaman login
  if (user.value) {
    // Tampilkan pesan di console untuk debug
    console.log("Anda sudah login, tidak boleh ke halaman login!");

    // Lempar balik ke dashboard atau home
    return navigateTo("/");
  }
});
