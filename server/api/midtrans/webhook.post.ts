import { snap } from "../../utils/midtrans";
import { prisma } from "../../utils/db";
import QRCode from "qrcode";
import { clearTicketCache } from "../../utils/cache";

export default defineEventHandler(async (event) => {
  // Penting untuk Ngrok/LocalTunnel agar tidak terblokir halaman peringatan
  setResponseHeader(event, "bypass-tunnel-reminder", "true");

  const body = await readBody(event);

  try {
    // Fungsi ini akan melempar error 404 jika Order ID tidak ditemukan di server Midtrans
    // (Misal: saat kamu klik tombol "Test" di dashboard Midtrans)
    const notification = await snap.transaction.notification(body);

    const orderId = notification.order_id;
    const status = notification.transaction_status;

    console.log(`Webhook diterima: Order ID ${orderId} - Status: ${status}`);

    if (status === "settlement" || status === "capture") {
      const transaction = await prisma.transaction.findUnique({
        where: { orderId: orderId },
        include: { event: true, tickets: true },
      });

      // Pastikan transaksi ada dan belum diproses sebelumnya (Idempotency)
      if (transaction && transaction.status !== "SUCCESS") {
        try {
          // Generate QR codes for each ticket with unique ticketCode
          const qrUpdates = transaction.tickets.map(async (ticket) => {
            const qrCodeDataUrl = await QRCode.toDataURL(ticket.ticketCode);
            return prisma.ticket.update({
              where: { id: ticket.id },
              data: { qrCode: qrCodeDataUrl },
            });
          });

          const qty = transaction.tickets.length || 1;

          // Build prisma update operations array
          const operations: any[] = [
            // Update transaction status
            prisma.transaction.update({
              where: { orderId: orderId },
              data: { status: "SUCCESS" },
            }),
            ...qrUpdates,
          ];

          // Add stock decrement for each ticket
          for (let i = 0; i < qty; i++) {
            operations.push(
              prisma.event.update({
                where: {
                  id: transaction.eventId,
                  remaining_slots: { gt: 0 },
                },
                data: {
                  remaining_slots: { decrement: 1 },
                },
              }),
            );
          }

          await prisma.$transaction(operations);
          clearTicketCache();

          console.log(
            `✅ ${qty} tiket + stok berhasil diperbarui untuk Order ID: ${orderId}`,
          );
        } catch (error: any) {
          // Jika kode P2025, berarti stok sudah 0 (Prisma error karena where tidak terpenuhi)
          if (error.code === "P2025") {
            console.error(
              `❌ GAGAL: Stok habis untuk Order ID: ${orderId}. Transaksi dibatalkan.`,
            );

            await prisma.transaction.update({
              where: { orderId: orderId },
              data: {
                status: "FAILED_OUT_OF_STOCK",
                notes:
                  "Pembayaran sukses tapi stok habis. Segera lakukan refund manual.",
              },
            });
          } else {
            console.error(
              `❌ GAGAL: Error database pada Order ID ${orderId}:`,
              error.message || error,
            );
          }
        }
      }
    }
  } catch (error: any) {
    // Jika error karena Order ID dummy dari tombol "Test", jangan biarkan app mati
    if (error.httpStatusCode === 404) {
      console.warn("\u26a0\ufe0f Notifikasi dummy dari Midtrans diabaikan.");
    } else {
      console.error("\u274c Webhook Error:", error.message);
    }
  }

  // Apapun yang terjadi, kembalikan status OK agar Midtrans berhenti mengirim ulang
  return { status: "ok" };
});
