import { randomUUID } from "node:crypto"
import { and, desc, eq, sql } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { savedPhrases } from "@/lib/db/schema"
import { getGameActor, hasGameAccess, withGameActorCookie } from "@/lib/game-actor"
import { isSameOriginRequest } from "@/lib/http-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_TRANSLATION_LENGTH = 200
const MAX_TRANSLATION_BYTES = 480
const MAX_PHRASE_LENGTH = 300
const MAX_SAVED_PHRASES = 50

function response(actor: Awaited<ReturnType<typeof getGameActor>>, body: unknown, status = 200) {
  const result = NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
  return withGameActorCookie(result, actor)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function cleanPhrase(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function GET() {
  const actor = await getGameActor()
  if (!(await hasGameAccess(actor))) {
    return response(actor, { error: "Tu acceso al juego ha terminado." }, 403)
  }

  const phrases = await db
    .select({
      id: savedPhrases.id,
      spanish: savedPhrases.spanish,
      german: savedPhrases.german,
      createdAt: savedPhrases.createdAt,
    })
    .from(savedPhrases)
    .where(eq(savedPhrases.userId, actor.actorId))
    .orderBy(desc(savedPhrases.createdAt))
    .limit(MAX_SAVED_PHRASES)

  return response(actor, { phrases })
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }

  const actor = await getGameActor()
  if (!(await hasGameAccess(actor))) {
    return response(actor, { error: "Tu acceso al juego ha terminado." }, 403)
  }

  let body: Record<string, unknown> | null = null
  try {
    body = asRecord(await request.json())
  } catch {
    return response(actor, { error: "La solicitud no es válida." }, 400)
  }

  if (body?.action === "translate") {
    const spanish = cleanPhrase(body.text)
    if (!spanish || spanish.length > MAX_TRANSLATION_LENGTH) {
      return response(actor, { error: "Escribe una frase de hasta 200 caracteres." }, 400)
    }
    if (Buffer.byteLength(spanish, "utf8") > MAX_TRANSLATION_BYTES) {
      return response(actor, { error: "La frase es demasiado larga para el servicio de traducción. Acórtala un poco." }, 400)
    }

    try {
      const url = new URL("https://api.mymemory.translated.net/get")
      url.searchParams.set("q", spanish)
      url.searchParams.set("langpair", "es|de")
      url.searchParams.set("mt", "1")
      const upstream = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      })
      if (!upstream.ok) {
        const status = upstream.status === 429 ? 429 : 502
        return response(actor, { error: "El servicio de traducción no está disponible ahora." }, status)
      }

      const data = asRecord(await upstream.json())
      if (data?.quotaFinished === true) {
        return response(actor, { error: "Se alcanzó el límite gratuito diario de 5.000 caracteres. Inténtalo mañana." }, 429)
      }
      if (Number(data?.responseStatus) !== 200) {
        return response(actor, { error: "No se encontró una traducción para esa frase." }, 502)
      }

      const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("es")
      const matches = Array.isArray(data?.matches)
        ? data.matches.map(asRecord).filter((match): match is Record<string, unknown> => Boolean(match))
        : []
      const exactMatch = matches
        .filter((match) => typeof match.segment === "string"
          && normalize(match.segment) === normalize(spanish)
          && typeof match.translation === "string"
          && !match.translation.includes("_"))
        .sort((a, b) => Number(b.quality ?? 0) - Number(a.quality ?? 0))[0]
      const responseData = asRecord(data?.responseData)
      const fallback = typeof responseData?.translatedText === "string" && !responseData.translatedText.includes("_")
        ? responseData.translatedText
        : matches.find((match) => typeof match.translation === "string" && !match.translation.includes("_"))?.translation
      const german = String(exactMatch?.translation ?? fallback ?? "").trim()
      if (!german) return response(actor, { error: "No se encontró una traducción para esa frase." }, 502)
      return response(actor, { translation: german })
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError"
      return response(actor, {
        error: timedOut ? "El servicio de traducción tardó demasiado. Inténtalo de nuevo." : "No se pudo traducir ahora. Inténtalo de nuevo.",
      }, 502)
    }
  }

  if (body?.action === "save") {
    const spanish = cleanPhrase(body.spanish)
    const german = cleanPhrase(body.german)
    if (!spanish || !german || spanish.length > MAX_PHRASE_LENGTH || german.length > MAX_PHRASE_LENGTH) {
      return response(actor, { error: "La frase debe tener entre 1 y 300 caracteres en ambos idiomas." }, 400)
    }

    const [existing] = await db
      .select({ id: savedPhrases.id, spanish: savedPhrases.spanish, german: savedPhrases.german })
      .from(savedPhrases)
      .where(and(
        eq(savedPhrases.userId, actor.actorId),
        sql`lower(${savedPhrases.spanish}) = lower(${spanish})`,
        sql`lower(${savedPhrases.german}) = lower(${german})`,
      ))
      .limit(1)

    if (existing) return response(actor, { phrase: existing, alreadySaved: true })

    const existingPhrases = await db
      .select({ id: savedPhrases.id })
      .from(savedPhrases)
      .where(eq(savedPhrases.userId, actor.actorId))
      .limit(MAX_SAVED_PHRASES)

    if (existingPhrases.length >= MAX_SAVED_PHRASES) {
      return response(actor, { error: "Has llegado al máximo de 50 frases guardadas." }, 409)
    }

    const [phrase] = await db
      .insert(savedPhrases)
      .values({ id: randomUUID(), userId: actor.actorId, spanish, german })
      .returning({
        id: savedPhrases.id,
        spanish: savedPhrases.spanish,
        german: savedPhrases.german,
      })

    return response(actor, { phrase, alreadySaved: false }, 201)
  }

  return response(actor, { error: "Acción no válida." }, 400)
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 })
  }

  const actor = await getGameActor()
  if (!(await hasGameAccess(actor))) {
    return response(actor, { error: "Tu acceso al juego ha terminado." }, 403)
  }

  const id = new URL(request.url).searchParams.get("id")?.trim()
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return response(actor, { error: "La frase no es válida." }, 400)
  }

  const [deleted] = await db
    .delete(savedPhrases)
    .where(and(eq(savedPhrases.id, id), eq(savedPhrases.userId, actor.actorId)))
    .returning({ id: savedPhrases.id })

  if (!deleted) return response(actor, { error: "No se encontró esa frase." }, 404)
  return response(actor, { deleted: true })
}
