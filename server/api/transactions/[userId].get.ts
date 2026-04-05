import { requireAuth } from "../../utils/auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const userId = getRouterParam(event, "userId");

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required",
    });
  }

  // User hanya bisa lihat transaksi sendiri, admin bisa lihat semua
  if (user.id !== userId && user.role !== "ADMIN") {
    throw createError({ statusCode: 403, statusMessage: "Akses ditolak" });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketCode: true,
            qrCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      transactions,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Gagal mengambil riwayat transaksi.",
      error: error.message,
    };
  }
});
