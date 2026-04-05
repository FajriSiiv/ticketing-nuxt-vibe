import { H3Event, getRequestIP, createError } from "h3";

const store = new Map<string, { count: number; resetAt: number }>();
const LIMITS: Record<string, { max: number; windowMs: number }> = {
  login: { max: 5, windowMs: 60_000 },
  register: { max: 3, windowMs: 60_000 },
  book: { max: 5, windowMs: 60_000 },
  verify: { max: 10, windowMs: 60_000 },
  checkPayment: { max: 10, windowMs: 60_000 },
  webhook: { max: 30, windowMs: 60_000 },
};

export function rateLimit(event: H3Event, type: keyof typeof LIMITS) {
  // Bersihkan entry lama (setiap 5 menit)
  const now = Date.now();
  if (!rateLimit._lastCleanup || now - rateLimit._lastCleanup > 5 * 60_000) {
    rateLimit._lastCleanup = now;
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key);
    }
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const key = `${type}:${ip}`;
  const limit = LIMITS[type];
  if (!limit) return;

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + limit.windowMs });
    return;
  }

  entry.count++;
  if (entry.count > limit.max) {
    const remainingSec = Math.ceil((entry.resetAt - now) / 1000);
    throw createError({
      statusCode: 429,
      statusMessage: `Terlalu banyak permintaan. Coba lagi dalam ${remainingSec} detik.`,
    });
  }
}
rateLimit._lastCleanup = 0;
