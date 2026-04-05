import { z } from "zod";
import { validateBody } from "../../utils/validate";
import { requireAdmin } from "../../utils/auth";
import { prisma } from "../../utils/db";

const checkinSchema = z.object({
  ticketCode: z.string().min(1, "Ticket code wajib diisi"),
});

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await validateBody(event, checkinSchema);
  const { ticketCode } = body;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        transaction: {
          include: {
            event: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!ticket) {
      return {
        success: false,
        message: "Tiket tidak ditemukan",
        ticket: null,
      };
    }

    if (ticket.transaction.status !== "SUCCESS") {
      return {
        success: false,
        message: `Status pembayaran tiket ini belum selesai: ${ticket.transaction.status}`,
        ticket: {
          ticketCode: ticket.ticketCode,
          eventTitle: ticket.transaction.event.title,
          buyerName: ticket.transaction.user.name,
          status: ticket.transaction.status,
          isUsed: ticket.isUsed,
        },
      };
    }

    if (ticket.isUsed) {
      return {
        success: false,
        message: "Tiket sudah pernah di-check-in sebelumnya",
        ticket: {
          ticketCode: ticket.ticketCode,
          eventTitle: ticket.transaction.event.title,
          buyerName: ticket.transaction.user.name,
          status: ticket.transaction.status,
          isUsed: true,
          scannedAt: ticket.scannedAt,
        },
      };
    }

    // Mark as used
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { isUsed: true, scannedAt: new Date() },
      include: {
        transaction: {
          include: {
            event: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return {
      success: true,
      message: "Check-in berhasil!",
      ticket: {
        ticketCode: updated.ticketCode,
        eventTitle: updated.transaction.event.title,
        buyerName: updated.transaction.user.name,
        scannedAt: updated.scannedAt,
      },
    };
  } catch (err: any) {
    console.error("[CHECKIN ERROR]", err.message || err);
    return { success: false, message: "Terjadi kesalahan server" };
  }
});
