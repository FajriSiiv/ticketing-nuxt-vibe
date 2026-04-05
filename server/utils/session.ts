import type { H3Event } from "h3";

export interface SessionUser {
  id: string;
  name: string;
  role: "USER" | "ADMIN";
}

const SESSION_NAME = "auth_session";

interface SessionData {
  user: SessionUser | null;
}

async function getH3Session(event: H3Event) {
  return await useSession<SessionData>(event, {
    name: SESSION_NAME,
    password: process.env.NUXT_SESSION_PASSWORD!,
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

export async function setSession(event: H3Event, user: SessionUser) {
  const session = await getH3Session(event);
  await session.update({ user });
}

export async function getUserSession(event: H3Event): Promise<SessionUser | null> {
  const session = await getH3Session(event);
  return session.data.user ?? null;
}

export async function clearUserSession(event: H3Event) {
  const session = await getH3Session(event);
  await session.clear();
}
