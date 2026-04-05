import type { H3Event } from "h3";
import { getUserSession } from "./session";

export async function requireAuth(event: H3Event) {
  const user = await getUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return user;
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event);
  if (user.role !== "ADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: Admin only" });
  }
  return user;
}
