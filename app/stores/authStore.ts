export const useAuthStore = defineStore("auth", () => {
  const user = useState<{
    id: string;
    name: string;
    role: "USER" | "ADMIN";
  } | null>("auth_user", () => null);

  const login = async (name: string, password: string) => {
    const data = await $fetch("/api/auth/login", {
      method: "POST",
      body: { name, password },
    });
    user.value = data as { id: string; name: string; role: "USER" | "ADMIN" };
  };

  const register = async (name: string, password: string, email?: string) => {
    const data = await $fetch("/api/auth/register", {
      method: "POST",
      body: { name, password, email },
    });
    user.value = data as { id: string; name: string; role: "USER" | "ADMIN" };
  };

  const logout = async () => {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/login");
  };

  return { user, login, register, logout };
});
