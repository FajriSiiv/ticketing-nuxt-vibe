import { coreApi } from "../../utils/midtrans";
import { requireAuth } from "../../utils/auth";
import { prisma } from "../../utils/db";
import { rateLimit } from "../../utils/rateLimit";

export default defineEventHandler(async (event) => {
  rateLimit(event, "checkPayment");
  const user = await requireAuth(event);
  const { orderId } = getQuery(event);

  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: "orderId is required" });
  }

  const trx = await prisma.transaction.findUnique({
    where: { orderId: orderId as string },
    select: { userId: true },
  });

  if (!trx || trx.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: "Akses ditolak" });
  }

  try {
    const status = await coreApi.transaction.status(orderId as string);

    const vaNumbers = status?.va_numbers || [];
    const bcaVa = vaNumbers.find((v: any) => v.bank === "bca");

    return {
      success: true,
      orderId: status.order_id,
      transactionStatus: status.transaction_status,
      vaNumbers,
      bcaVa: bcaVa || null,
      grossAmount: status.gross_amount,
    };
  } catch (error: any) {
    console.error("Failed to get transaction:", error.message);
    return {
      success: false,
      message: "Gagal mengambil detail transaksi dari Midtrans.",
    };
  }
});
