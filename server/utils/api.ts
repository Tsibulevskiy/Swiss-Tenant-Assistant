export function apiSuccess<T>(data: T) {
  return {
    ok: true as const,
    data
  }
}
