import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentRequests, playUsage } from "@/lib/db/schema"
import { isSameOriginRequest } from "@/lib/http-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GUEST_COOKIE = "germango_guest"
const GUEST_SECONDS = 15 * 60
const ACCOUNT_SECONDS = 60 * 60
const MAX_HEARTBEAT_SECONDS = 20

function signGuestId(id: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET!)
    .update(id)
    .digest("hex")
}

function readGuestId(value: string | undefined) {
  if (!value) return null
  const [id, signature] = value.split(".")
  if (!id || !signature || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/i.test(signature)) return null
  const expected = signGuestId(id)
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex")) ? id : null
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null
  const cookieStore = await cookies()
  const existingCookie = cookieStore.get(GUEST_COOKIE)?.value
  const existingGuestId = readGuestId(existingCookie)
  const guestId = user ? null : existingGuestId ?? randomUUID()
  const guestCookieValue = guestId ? `${guestId}.${signGuestId(guestId)}` : null
  const needsGuestCookie = Boolean(guestCookieValue && guestCookieValue !== existingCookie)

  let active = false
  try {
    const body: unknown = await request.json()
    active = typeof body === "object" && body !== null && "active" in body && body.active === true
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 })
  }

  let paymentStatus: "pending" | "approved" | "rejected" | null = null
  if (user) {
    const [latestPayment] = await db
      .select({ status: paymentRequests.status })
      .from(paymentRequests)
      .where(eq(paymentRequests.userId, user.id))
      .orderBy(desc(paymentRequests.createdAt))
      .limit(1)
    paymentStatus = latestPayment?.status ?? null

    const [approvedPayment] = await db
      .select({ id: paymentRequests.id })
      .from(paymentRequests)
      .where(and(eq(paymentRequests.userId, user.id), eq(paymentRequests.status, "approved")))
      .limit(1)

    if (approvedPayment) {
      const response = NextResponse.json({
        allowed: true,
        tier: "paid",
        remainingSeconds: null,
        paymentStatus: "approved",
        isAuthenticated: true,
      })
      if (needsGuestCookie) response.cookies.set(GUEST_COOKIE, guestCookieValue!, guestCookieOptions())
      return response
    }
  }

  const actorId = user ? `user:${user.id}` : `guest:${guestId}`
  const secondsLimit = user ? ACCOUNT_SECONDS : GUEST_SECONDS
  const [usage] = await db
    .insert(playUsage)
    .values({ actorId, userId: user?.id ?? null, secondsUsed: 0 })
    .onConflictDoUpdate({
      target: playUsage.actorId,
      set: {
        userId: user?.id ?? null,
        secondsUsed: sql`LEAST(
          ${secondsLimit},
          ${playUsage.secondsUsed} + CASE
            WHEN ${active} THEN GREATEST(
              0,
              LEAST(
                ${MAX_HEARTBEAT_SECONDS},
                FLOOR(EXTRACT(EPOCH FROM (now() - ${playUsage.lastHeartbeatAt})))::integer
              )
            )
            ELSE 0
          END
        )`,
        lastHeartbeatAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ secondsUsed: playUsage.secondsUsed })

  const usedSeconds = Number(usage?.secondsUsed ?? 0)
  const response = NextResponse.json({
    allowed: usedSeconds < secondsLimit,
    tier: user ? "account" : "guest",
    remainingSeconds: Math.max(0, secondsLimit - usedSeconds),
    paymentStatus,
    isAuthenticated: Boolean(user),
  })
  if (needsGuestCookie) response.cookies.set(GUEST_COOKIE, guestCookieValue!, guestCookieOptions())
  return response
}

function guestCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "development" ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  }
}
