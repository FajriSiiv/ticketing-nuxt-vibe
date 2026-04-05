import { prisma } from "../../../utils/db";
import { clearTicketCache } from "../../../utils/cache";

export default defineEventHandler(async (event) => {
  const { id } = await getRouterParams(event);
  const body = await readBody(event);

  try {
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.price !== undefined && { price: parseInt(body.price) }),
        ...(body.total_slots !== undefined && {
          total_slots: parseInt(body.total_slots),
          remaining_slots: parseInt(body.total_slots),
        }),
        ...(body.eventDate !== undefined && {
          eventDate: body.eventDate ? new Date(body.eventDate) : null,
        }),
      },
    });

    clearTicketCache();
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
});
