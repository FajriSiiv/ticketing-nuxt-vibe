import { z } from "zod";
import { validateBody } from "../../utils/validate";
import { requireAuth } from "../../utils/auth";
import { snap } from "../../utils/midtrans";
import { clearTicketCache } from "../../utils/cache";
import { rateLimit } from "../../utils/rateLimit";

const bookSchema = z.object({
  eventId: z.string().uuid("Event ID tidak valid"),
  quantity: z
    .number({ error: "Quantity harus angka" })
    .min(1, "Minimal 1 tiket")
    .max(3, "Maksimal 3 tiket sekali beli"),
});

export default defineEventHandler(async (event) => {
  rateLimit(event, "book");
  const user = await requireAuth(event);
  const body = await validateBody(event, bookSchema);

  const { eventId, quantity } = body;

  console.log("[BOOK]", { eventId, quantity, userId: user.id });

  try {
    let targetEventPrice = 0;
    let targetEventTitle = "";
    let transactionId = "";

    // Generate ticket codes first
    const ticketCodes: string[] = [];
    for (let i = 0; i < quantity; i++) {
      ticketCodes.push(
        `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${i}`,
      );
    }
    console.log("[BOOK] Ticket codes:", ticketCodes);

    const newTransaction = await prisma.$transaction(async (tx) => {
      const targetEvent = await tx.event.findUnique({ where: { id: eventId } });
      console.log(
        "[BOOK] Event found:",
        !!targetEvent,
        "remaining:",
        targetEvent?.remaining_slots,
      );

      if (!targetEvent || targetEvent.remaining_slots < quantity) {
        throw new Error("STOK_HABIS");
      }

      targetEventPrice = targetEvent.price;
      targetEventTitle = targetEvent.title;

      const orderId = `TIX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const trx = await tx.transaction.create({
        data: {
          eventId,
          userId: user.id,
          amount: targetEvent.price * quantity,
          orderId,
          status: "PENDING",
        },
      });
      console.log("[BOOK] Transaction created:", trx.id);

      // Create individual ticket records sequentially (pg adapter issue with Promise.all)
      for (const code of ticketCodes) {
        await tx.ticket.create({
          data: { transactionId: trx.id, ticketCode: code },
        });
      }
      console.log("[BOOK] Tickets created:", ticketCodes.length);

      transactionId = trx.id;
      return trx;
    });
    console.log("[BOOK] Transaction completed, total:", newTransaction.amount);

    const midtransParams = {
      transaction_details: {
        order_id: newTransaction.orderId,
        gross_amount: targetEventPrice * quantity,
      },
      item_details: [
        {
          id: eventId,
          price: targetEventPrice,
          quantity,
          name: targetEventTitle.substring(0, 50),
        },
      ],
    };

    console.log("[BOOK] Midtrans params:", JSON.stringify(midtransParams));
    const snapResponse = await snap.createTransaction(midtransParams);
    console.log("[BOOK] Snap response received");

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { snapToken: snapResponse.token },
    });

    newTransaction.snapToken = snapResponse.token;

    clearTicketCache(); // Invalidate cache karena stok berubah
    return { success: true, transaction: newTransaction };
  } catch (error: any) {
    console.error("[BOOK ERROR]", error.message || error);
    console.error("[BOOK ERROR] Stack:", error.stack);
    const message =
      error.message === "STOK_HABIS"
        ? "Maaf, tiket sudah habis terjual!"
        : error.message || "Gagal memproses pesanan.";

    return { success: false, message };
  }
});
