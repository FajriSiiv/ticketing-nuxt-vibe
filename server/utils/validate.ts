import type { H3Event } from "h3";
import type { z } from "zod";

export async function validateBody<T extends z.ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const body = await readBody(event);
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      const zodError = error as z.ZodError;
      const messages = zodError.issues.map((issue) => issue.message).join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: messages,
      });
    }
    throw error;
  }
}
