export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin")
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim()
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const protocol = forwardedProtocol || new URL(request.url).protocol.replace(":", "")

  if (!origin || !host || !["http", "https"].includes(protocol)) return false

  try {
    return new URL(origin).origin === new URL(`${protocol}://${host}`).origin
  } catch {
    return false
  }
}
