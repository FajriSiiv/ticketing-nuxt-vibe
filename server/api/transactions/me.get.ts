import { requireAuth } from "../../utils/auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        event: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, transactions };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal mengambil riwayat transaksi.",
      error: error.message,
    };
  }
});
