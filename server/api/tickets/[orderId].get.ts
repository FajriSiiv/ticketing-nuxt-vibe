import { requireAuth } from "../../utils/auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { orderId } = await getRouterParams(event);

  try {
    const ticket = await prisma.transaction.findFirst({
      where: { orderId, userId: user.id },
      include: { event: true, tickets: true },
    });

    if (!ticket) {
      return { success: false, message: "Tiket tidak ditemukan" };
    }

    return { success: true, ticket };
  } catch {
    return { success: false, message: "Terjadi kesalahan server" };
  }
});
