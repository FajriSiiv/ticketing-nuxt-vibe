import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateBody } from "../../utils/validate";
import { setSession } from "../../utils/session";
import { rateLimit } from "../../utils/rateLimit";

const loginSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default defineEventHandler(async (event) => {
  rateLimit(event, "login");
  const body = await validateBody(event, loginSchema);

  const user = await prisma.user.findUnique({
    where: { name: body.name },
  });

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Nama atau password salah" });
  }

  if (!user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: "Akun ini belum memiliki password. Silakan hubungi admin untuk reset.",
    });
  }

  const isValid = await bcrypt.compare(body.password, user.password);
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: "Nama atau password salah" });
  }

  await setSession(event, {
    id: user.id,
    name: user.name,
    role: user.role,
  });

  return { id: user.id, name: user.name, role: user.role };
});
