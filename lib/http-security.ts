export function isSameOriginRequest(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin
}
