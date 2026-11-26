"use client"

import Link from "next/link"
import { type FormEvent, useEffect, useState } from "react"
import useSWR from "swr"
import { authClient } from "@/lib/auth-client"
import { GAME_MARKUP } from "@/components/game-markup"

const HEARTBEAT_MS = 10_000
const PAYPAL_LINK = "https://paypal.me/MiguelBoladoesa"
const LEGACY_SCRIPTS = [
  "/js/data/vocab.js?v=9.6.2",
  "/js/data/course.js?v=9.6.2",
  "/js/state.js?v=9.6.2",
  "/js/audio.js?v=9.6.2",
  "/js/questions.js?v=9.6.2",
  "/js/ui.js?v=9.6.2",
  "/js/speech.js?v=9.6.2",
  "/js/lesson.js?v=9.6.2",
  "/js/main.js?v=9.6.2",
  "/extras.js?v=9.6.2",
]

type AccessSnapshot = {
  allowed: boolean
  tier: "guest" | "account" | "paid"
  remainingSeconds: number | null
  paymentStatus: "pending" | "approved" | "rejected" | null
  isAuthenticated: boolean
}

declare global {
  interface Window {
    __germangoScriptsPromise?: Promise<void>
  }
}

function loadLegacyScripts() {
  if (window.__germangoScriptsPromise) return window.__germangoScriptsPromise

  window.__germangoScriptsPromise = (async () => {
    for (const src of LEGACY_SCRIPTS) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.async = false
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("No se pudo cargar el juego."))
        document.body.appendChild(script)
      })
    }
  })()

  return window.__germangoScriptsPromise
}

async function fetchAccessSnapshot(): Promise<AccessSnapshot> {
  const response = await fetch("/api/game/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active: document.visibilityState === "visible" }),
    cache: "no-store",
  })
  if (!response.ok) throw new Error("No se pudo comprobar el acceso.")
  return response.json()
}

function formatTime(seconds: number | null | undefined) {
  if (seconds == null) return "Sin límite"
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`
}

type GameClientProps = {
  isAuthenticated: boolean
  isAdmin: boolean
  email: string | null
}

export function GameClient({ isAuthenticated, isAdmin, email }: GameClientProps) {
  const { data: access, error, mutate } = useSWR<AccessSnapshot>("germango-access", fetchAccessSnapshot, {
    refreshInterval: (latest) => latest?.allowed ? HEARTBEAT_MS : 0,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
  })
  const [gameError, setGameError] = useState(false)

  useEffect(() => {
    if (!access?.allowed) return
    let mounted = true
    loadLegacyScripts()
      .catch(() => {
        if (mounted) setGameError(true)
      })
    return () => { mounted = false }
  }, [access?.allowed])

  async function signOut() {
    await authClient.signOut()
    window.location.assign("/")
  }

  return (
    <div className="game-shell">
      <div className="access-toolbar">
        <div className="access-summary" role="status" aria-live="polite">
          <span className={`access-dot ${access?.allowed ? "is-active" : ""}`} aria-hidden="true" />
          <span>
            {!access
              ? "Comprobando acceso…"
              : access.tier === "paid"
                ? "Acceso ilimitado activo"
                : `${access.tier === "guest" ? "Invitado" : "Cuenta gratuita"} · ${formatTime(access.remainingSeconds)} restantes`}
          </span>
        </div>
        <nav className="access-actions" aria-label="Cuenta">
          {isAdmin && <Link className="toolbar-link" href="/admin/payments">Pagos</Link>}
          {isAuthenticated ? (
            <>
              <span className="account-email">{email}</span>
              <button className="toolbar-button" onClick={signOut} type="button">Salir</button>
            </>
          ) : (
            <>
              <Link className="toolbar-link" href="/sign-in">Iniciar sesión</Link>
              <Link className="toolbar-button toolbar-primary" href="/sign-up">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>

      <div
        className="legacy-game"
        aria-hidden={!access?.allowed}
        dangerouslySetInnerHTML={{ __html: GAME_MARKUP }}
        inert={!access?.allowed}
      />

      {(!access || !access.allowed) && (
        <section className="access-wall" role="dialog" aria-modal="true" aria-labelledby="access-wall-title">
          <div className="access-card">
            <span className="access-eyebrow">GERMANGO · APRENDE A TU RITMO</span>
            {!access && !error && (
              <>
                <div className="access-spinner" aria-hidden="true" />
                <h1 id="access-wall-title">Preparando tu juego</h1>
                <p>Estamos comprobando tu tiempo disponible.</p>
              </>
            )}
            {error && (
              <>
                <h1 id="access-wall-title">No pudimos comprobar el acceso</h1>
                <p>Comprueba tu conexión y vuelve a intentarlo.</p>
                <button className="access-primary" onClick={() => void mutate()} type="button">Reintentar</button>
              </>
            )}
            {access && !access.allowed && !access.isAuthenticated && (
              <>
                <h1 id="access-wall-title">Tus 15 minutos gratuitos han terminado</h1>
                <p>Crea una cuenta gratis para obtener 60 minutos adicionales y conservar tu progreso.</p>
                <Link className="access-primary" href="/sign-up">Crear cuenta gratis</Link>
                <Link className="access-secondary" href="/sign-in">Ya tengo una cuenta</Link>
              </>
            )}
            {access?.isAuthenticated && !access.allowed && access.paymentStatus === "pending" && (
              <>
                <h1 id="access-wall-title">Estamos revisando tu pago</h1>
                <p>Tu solicitud está pendiente de aprobación manual. Puedes volver a comprobar el estado cuando quieras.</p>
                <button className="access-primary" onClick={() => void mutate()} type="button">Comprobar estado</button>
              </>
            )}
            {access?.isAuthenticated && !access.allowed && access.paymentStatus !== "pending" && (
              <>
                <h1 id="access-wall-title">Has agotado tus 60 minutos gratuitos</h1>
                <p>
                  Desbloquea el acceso ilimitado con un pago único de <strong>5 €</strong>.
                  {access.paymentStatus === "rejected" && " No pudimos confirmar la referencia anterior; puedes enviar una nueva."}
                </p>
                <a className="access-primary" href={PAYPAL_LINK} rel="noreferrer" target="_blank">
                  Pagar 5 € con PayPal
                </a>
                <PaymentReferenceForm onSubmitted={() => void mutate()} />
                <p className="payment-note">Después del pago, envía su referencia. El acceso se activa cuando Miguel lo apruebe.</p>
              </>
            )}
            {!access && error && <Link className="access-secondary" href="/">Volver al juego</Link>}
          </div>
        </section>
      )}

      {gameError && (
        <div className="game-load-error" role="alert">
          <p>No se pudo cargar el juego.</p>
          <button className="toolbar-button" onClick={() => window.location.reload()} type="button">Recargar</button>
        </div>
      )}
    </div>
  )
}

function PaymentReferenceForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [reference, setReference] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function submitReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setSubmitting(true)
    try {
      const response = await fetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
      if (!response.ok) {
        setMessage("No se pudo registrar. Comprueba si ya tienes una solicitud pendiente.")
        return
      }
      setReference("")
      setMessage("Solicitud enviada. El acceso se habilitará tras la revisión manual.")
      onSubmitted()
    } catch {
      setMessage("No se pudo enviar. Inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="payment-reference-form" onSubmit={submitReference}>
      <label htmlFor="payment-reference">Referencia de la transacción PayPal</label>
      <input
        id="payment-reference"
        autoComplete="off"
        maxLength={120}
        minLength={4}
        onChange={(event) => setReference(event.target.value)}
        placeholder="Por ejemplo, el ID del pago"
        required
        value={reference}
      />
      <button className="access-secondary" disabled={submitting} type="submit">
        {submitting ? "Enviando…" : "Ya pagué · enviar referencia"}
      </button>
      {message && <p className="payment-note" role="status">{message}</p>}
      <p className="payment-note">No incluyas contraseñas ni datos bancarios.</p>
    </form>
  )
}
