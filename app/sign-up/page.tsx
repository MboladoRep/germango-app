import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth-form"
import { getCurrentSession } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const session = await getCurrentSession()
  if (session?.user) redirect("/")
  return <AuthForm mode="sign-up" />
}
