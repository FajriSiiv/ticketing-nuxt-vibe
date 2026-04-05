import { getUserSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await getUserSession(event);
  return { user };
});
