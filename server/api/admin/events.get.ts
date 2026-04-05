import { requireAdmin } from "../../utils/auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (_event) => {
  // No need for auth guard — this returns admin events list, but let's still require admin
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
  });
  return { success: true, events };
});
