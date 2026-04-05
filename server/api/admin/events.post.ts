import { requireAdmin } from "../../utils/auth";
import { prisma } from "../../utils/db";
import { clearTicketCache } from "../../utils/cache";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const { title, description, price, total_slots, eventDate } = body;

  if (!title || !price || total_slots === undefined) {
    return { success: false, message: "title, price, dan total_slots wajib diisi" };
  }

  try {
    // Check: maksimal 5 event
    const count = await prisma.event.count();
    if (count >= 5) {
      return { success: false, message: "Maksimal 5 event. Hapus event lama terlebih dahulu." };
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || "",
        price: parseInt(price),
        total_slots: parseInt(total_slots),
        remaining_slots: parseInt(total_slots),
        eventDate: eventDate ? new Date(eventDate) : null,
      },
    });

    clearTicketCache();
    return { success: true, event: newEvent };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
