// server/api/tickets/list.get.ts
import { prisma } from "../../utils/db";
import { ticketCache, TTL } from "../../utils/cache";

export default defineEventHandler(async () => {
  const now = Date.now();
  if (ticketCache.data && now - ticketCache.time < TTL) {
    return ticketCache.data;
  }

  const data = await prisma.event.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  ticketCache.data = data;
  ticketCache.time = now;
  return data;
});
