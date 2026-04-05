import { prisma } from "../../../utils/db";
import { clearTicketCache } from "../../../utils/cache";

export default defineEventHandler(async (event) => {
  const { id } = await getRouterParams(event);

  try {
    // Cek apakah ada transaksi SUCCESS terkait event ini
    const successTx = await prisma.transaction.findFirst({
      where: { eventId: id, status: "SUCCESS" },
    });

    if (successTx) {
      return { success: false, message: "Tidak bisa menghapus event yang sudah memiliki transaksi sukses" };
    }

    // Hapus semua ticket yang terkait dengan transaksi event ini
    const txIds = await prisma.transaction.findMany({
      where: { eventId: id },
      select: { id: true },
    });

    for (const tx of txIds) {
      await prisma.ticket.deleteMany({ where: { transactionId: tx.id } });
    }

    await prisma.transaction.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    clearTicketCache();
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
