import { coreApi } from "../../utils/midtrans";
import { prisma } from "../../utils/db";
import QRCode from "qrcode";
import { requireAuth } from "../../utils/auth";
import { clearTicketCache } from "../../utils/cache";
import { rateLimit } from "../../utils/rateLimit";

export default defineEventHandler(async (event) => {
  rateLimit(event, "verify");
  const user = await requireAuth(event);
  const body = await readBody(event);
  const { orderId } = body;

  if (!orderId) {
    return { success: false, message: "Order ID wajib" };
  }

  // Cek ownership: user hanya bisa verify transaksi sendiri, admin bisa semua
  const existing = await prisma.transaction.findUnique({
    where: { orderId },
    include: { event: true, tickets: true },
  });

  if (!existing || (existing.userId !== user.id && user.role !== "ADMIN")) {
    return { success: false, message: "Akses ditolak" };
  }

  try {
    // Jika sudah SUCCESS, skip (idempotency)
    if (existing.status === "SUCCESS" || existing.status === "SETTLEMENT") {
      return {
        success: true,
        status: existing.status,
        noChange: true,
        transaction: existing,
      };
    }

    let finalStatus: string;

    try {
      // Cek langsung ke Midtrans API menggunakan CoreApi (bukan Snap)
      const statusResponse = await coreApi.transaction.status(orderId);
      const txStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      if (txStatus === "settlement") {
        finalStatus = "SUCCESS";
      } else if (txStatus === "capture") {
        finalStatus = fraudStatus === "accept" ? "SUCCESS" : "CHALLENGE";
      } else if (txStatus === "cancel") {
        finalStatus = "CANCEL";
      } else if (txStatus === "expire") {
        finalStatus = "EXPIRE";
      } else if (txStatus === "deny") {
        finalStatus = "FAILED";
      } else if (txStatus === "pending") {
        finalStatus = "PENDING";
      } else {
        finalStatus = txStatus.toUpperCase();
      }

      console.log(
        `[Verify] Order ${orderId} -> Midtrans says: ${txStatus} -> final: ${finalStatus}`,
      );
    } catch (e: any) {
      console.log(
        `[Verify] Gagal hubungi Midtrans untuk ${orderId}: ${e.message}`,
      );
      return {
        success: true,
        status: existing.status,
        skipped: true,
        message: e.message,
      };
    }

    // Update database
    if (finalStatus === "SUCCESS" || finalStatus === "SETTLEMENT") {
      try {
        const qty = existing.tickets.length || 1;

        const operations: any[] = [
          prisma.transaction.update({
            where: { orderId },
            data: { status: "SUCCESS" },
          }),
        ];

        // Generate QR for each ticket
        for (const ticket of existing.tickets) {
          const qrCodeDataUrl = await QRCode.toDataURL(ticket.ticketCode);
          operations.push(
            prisma.ticket.update({
              where: { id: ticket.id },
              data: { qrCode: qrCodeDataUrl },
            })
          );
        }

        // Decrement stock for each ticket
        for (let i = 0; i < qty; i++) {
          operations.push(
            prisma.event.update({
              where: {
                id: existing.eventId,
                remaining_slots: { gt: 0 },
              },
              data: { remaining_slots: { decrement: 1 } },
            })
          );
        }

        await prisma.$transaction(operations);
        clearTicketCache();

        const updated = await prisma.transaction.findUnique({
          where: { orderId },
          include: { event: true, tickets: true },
        });

        return { success: true, status: "SUCCESS", transaction: updated };
      } catch (stockErr: any) {
        console.error(
          "DEBUG: transaction error:",
          stockErr.message || stockErr,
        );
        if (stockErr.code === "P2025") {
          await prisma.transaction.update({
            where: { orderId },
            data: {
              status: "FAILED_OUT_OF_STOCK",
              notes:
                "Pembayaran sukses tapi stok habis. Segera lakukan refund manual.",
            },
          });
          return {
            success: false,
            message: "Gagal: Stok habis setelah pembayaran",
          };
        }
        return {
          success: false,
          message:
            "Gagal memproses pembayaran: " +
            (stockErr.message || "Unknown error"),
        };
      }
    } else {
      // Update cancel/expire/failed/dll tapi skip jika masih PENDING
      if (finalStatus !== "PENDING") {
        await prisma.transaction.update({
          where: { orderId },
          data: { status: finalStatus },
        });
      }
      return { success: true, status: finalStatus };
    }
  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    return {
      success: false,
      message: error.message || "Gagal verifikasi pembayaran",
    };
  }
});
