import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentRequests } from "@/lib/db/schema"
import { isAdminEmail } from "@/lib/server-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 })
  }

  const status = typeof body === "object" && body !== null && "status" in body ? body.status : null
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Estado no válido." }, { status: 400 })
  }

  const [updated] = await db
    .update(paymentRequests)
    .set({ status, reviewedAt: new Date(), reviewedBy: session.user.email })
    .where(and(eq(paymentRequests.id, id), eq(paymentRequests.status, "pending")))
    .returning({ id: paymentRequests.id })

  if (!updated) return NextResponse.json({ error: "La solicitud ya fue revisada." }, { status: 409 })
  return NextResponse.json({ status })
}
