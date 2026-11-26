import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { paymentRequests, playUsage } from "@/lib/db/schema"

const GUEST_COOKIE = "germango_guest"
const GUEST_SECONDS = 15 * 60
const ACCOUNT_SECONDS = 60 * 60

export type GameActor = {
  actorId: string
  userId: string | null
  guestCookieValue: string | null
  needsGuestCookie: boolean
}

function signGuestId(id: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(id).digest("hex")
}

function readGuestId(value: string | undefined) {
  if (!value) return null
  const [id, signature] = value.split(".")
  if (!id || !signature || !/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f]{64}$/i.test(signature)) return null
  const expected = signGuestId(id)
  const actualBytes = Buffer.from(signature, "hex")
  const expectedBytes = Buffer.from(expected, "hex")
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes) ? id : null
}

export async function getGameActor(): Promise<GameActor> {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user.id ?? null

  if (userId) {
    return {
      actorId: `user:${userId}`,
      userId,
      guestCookieValue: null,
      needsGuestCookie: false,
    }
  }

  const cookieStore = await cookies()
  const existingCookie = cookieStore.get(GUEST_COOKIE)?.value
  const guestId = readGuestId(existingCookie) ?? randomUUID()
  const guestCookieValue = `${guestId}.${signGuestId(guestId)}`

  return {
    actorId: `guest:${guestId}`,
    userId: null,
    guestCookieValue,
    needsGuestCookie: guestCookieValue !== existingCookie,
  }
}

export async function hasGameAccess(actor: GameActor) {
  if (actor.userId) {
    const [approvedPayment] = await db
      .select({ id: paymentRequests.id })
      .from(paymentRequests)
      .where(and(eq(paymentRequests.userId, actor.userId), eq(paymentRequests.status, "approved")))
      .limit(1)

    if (approvedPayment) return true
  }

  const secondsLimit = actor.userId ? ACCOUNT_SECONDS : GUEST_SECONDS
  const [usage] = await db
    .select({ secondsUsed: playUsage.secondsUsed })
    .from(playUsage)
    .where(eq(playUsage.actorId, actor.actorId))
    .limit(1)

  return Boolean(usage && usage.secondsUsed < secondsLimit)
}

export function withGameActorCookie(response: NextResponse, actor: GameActor) {
  if (actor.needsGuestCookie && actor.guestCookieValue) {
    response.cookies.set(GUEST_COOKIE, actor.guestCookieValue, {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return response
}
