import { requireAdmin } from "../../utils/auth";
import { prisma } from "../../utils/db";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  try {
    const query = getQuery(event);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const total = await prisma.transaction.count();
    const transactions = await prisma.transaction.findMany({
      include: {
        event: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
    return { transactions, total, page, limit };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data transaksi",
    });
  }
});
