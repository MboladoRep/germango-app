"use client"

import Link from "next/link"
import { useState } from "react"

type PaymentRequest = {
  id: string
  userId: string
  email: string
  reference: string
  createdAt: string
}

export function AdminPayments({ requests: initialRequests }: { requests: PaymentRequest[] }) {
  const [requests, setRequests] = useState(initialRequests)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id)
    setMessage("")
    try {
      const response = await fetch(`/api/admin/payment-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        setMessage("No se pudo actualizar la solicitud. Recarga el panel e inténtalo de nuevo.")
        return
      }
      setRequests((current) => current.filter((request) => request.id !== id))
    } catch {
      setMessage("No se pudo actualizar la solicitud. Inténtalo de nuevo.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="auth-eyebrow">GERMANGO · ADMINISTRACIÓN</p>
          <h1>Revisar pagos</h1>
          <p>Verifica cada pago de 5 € en PayPal antes de activar el acceso ilimitado.</p>
        </div>
        <Link className="toolbar-button" href="/">Volver al juego</Link>
      </div>

      {message && <p className="auth-error" role="alert">{message}</p>}
      {requests.length === 0 ? (
        <section className="admin-empty">
          <h2>No hay pagos pendientes</h2>
          <p>Las nuevas solicitudes aparecerán aquí para su revisión.</p>
        </section>
      ) : (
        <div className="payment-list">
          {requests.map((request) => (
            <article className="payment-card" key={request.id}>
              <div className="payment-card-head">
                <div>
                  <h2>{request.email}</h2>
                  <p>Cuenta: {request.userId}</p>
                </div>
                <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString("es-ES")}</time>
              </div>
              <dl className="payment-details">
                <div><dt>Importe esperado</dt><dd>5 €</dd></div>
                <div><dt>Referencia declarada</dt><dd>{request.reference}</dd></div>
              </dl>
              <div className="payment-actions">
                <button disabled={busyId === request.id} onClick={() => void review(request.id, "approved")} type="button">
                  Aprobar · activar acceso ilimitado
                </button>
                <button className="payment-reject" disabled={busyId === request.id} onClick={() => void review(request.id, "rejected")} type="button">
                  Rechazar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
