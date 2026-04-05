// Cache untuk daftar ticket event list
export const ticketCache = { data: null as any, time: 0 };
export const TTL = 30 * 60 * 1000; // 30 menit

export function clearTicketCache() {
  ticketCache.data = null;
  ticketCache.time = 0;
}
