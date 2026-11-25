"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { authClient } from "@/lib/auth-client"

type AuthFormProps = { mode: "sign-in" | "sign-up" }

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const isSignUp = mode === "sign-up"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password })

      if (result.error) {
        setError("No se pudo completar. Revisa tus datos e inténtalo de nuevo.")
        return
      }

      router.replace("/")
      router.refresh()
    } catch {
      setError("No se pudo completar. Inténtalo de nuevo más tarde.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" href="/" aria-label="Germango, volver al juego">GERMANGO</Link>
        <p className="auth-eyebrow">TU RUTA DE ALEMÁN</p>
        <h1 id="auth-title">{isSignUp ? "Crea tu cuenta" : "Qué bueno verte"}</h1>
        <p className="auth-description">
          {isSignUp
            ? "Regístrate gratis y consigue 60 minutos adicionales de juego."
            : "Inicia sesión para continuar con tu tiempo de juego."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label className="auth-field">
              <span>Nombre</span>
              <input
                autoComplete="name"
                maxLength={80}
                name="name"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          )}
          <label className="auth-field">
            <span>Correo electrónico</span>
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="auth-field">
            <span>Contraseña</span>
            <input
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              maxLength={128}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? "Un momento…" : isSignUp ? "Crear cuenta gratis" : "Iniciar sesión"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? "¿Ya tienes una cuenta? " : "¿Todavía no tienes cuenta? "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"}>
            {isSignUp ? "Inicia sesión" : "Regístrate gratis"}
          </Link>
        </p>
        <Link className="auth-back" href="/">Volver al juego</Link>
      </section>
    </main>
  )
}
