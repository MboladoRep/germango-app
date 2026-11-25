import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() })
}

export function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.GERMANGO_ADMIN_EMAIL?.trim().toLowerCase()
  return Boolean(adminEmail && email?.trim().toLowerCase() === adminEmail)
}
