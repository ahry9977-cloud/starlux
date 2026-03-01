export function ForbiddenError(message: string) {
  const err = new Error(message) as Error & { code?: string };
  err.code = "FORBIDDEN";
  return err;
}
