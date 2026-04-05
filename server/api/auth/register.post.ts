import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateBody } from "../../utils/validate";
import { setSession } from "../../utils/session";
import { rateLimit } from "../../utils/rateLimit";

const registerSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(50),
  password: z.string().min(6, "Password minimal 6 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
});

export default defineEventHandler(async (event) => {
  rateLimit(event, "register");
  const body = await validateBody(event, registerSchema);

  const existing = await prisma.user.findUnique({ where: { name: body.name } });
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Nama sudah terdaftar" });
  }

  if (body.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingEmail) {
      throw createError({ statusCode: 409, statusMessage: "Email sudah terdaftar" });
    }
  }

  const hashedPassword = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email || null,
      password: hashedPassword,
    },
  });

  await setSession(event, {
    id: user.id,
    name: user.name,
    role: user.role,
  });

  return { id: user.id, name: user.name, role: user.role };
});
