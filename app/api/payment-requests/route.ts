import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentRequests } from "@/lib/db/schema"
import { isSameOriginRequest } from "@/lib/http-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: "Inicia sesión para enviar la solicitud." }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 })
  }

  const reference = typeof body === "object" && body !== null && "reference" in body && typeof body.reference === "string"
    ? body.reference.trim()
    : ""
  if (reference.length < 4 || reference.length > 120) {
    return NextResponse.json({ error: "Introduce una referencia válida del pago." }, { status: 400 })
  }

  const [approved] = await db
    .select({ id: paymentRequests.id })
    .from(paymentRequests)
    .where(and(eq(paymentRequests.userId, session.user.id), eq(paymentRequests.status, "approved")))
    .limit(1)
  if (approved) return NextResponse.json({ error: "Tu acceso de pago ya está activo." }, { status: 409 })

  const [pending] = await db
    .select({ id: paymentRequests.id })
    .from(paymentRequests)
    .where(and(eq(paymentRequests.userId, session.user.id), eq(paymentRequests.status, "pending")))
    .limit(1)
  if (pending) return NextResponse.json({ error: "Ya tienes un pago pendiente de revisión." }, { status: 409 })

  try {
    await db.insert(paymentRequests).values({
      id: randomUUID(),
      userId: session.user.id,
      paymentReference: reference,
      status: "pending",
    })
  } catch {
    return NextResponse.json({ error: "No se pudo enviar la solicitud. Inténtalo de nuevo." }, { status: 409 })
  }

  return NextResponse.json({ status: "pending" }, { status: 201 })
}
