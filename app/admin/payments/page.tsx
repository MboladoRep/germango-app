import { asc, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { AdminPayments } from "@/components/admin-payments"
import { db } from "@/lib/db"
import { paymentRequests, user } from "@/lib/db/schema"
import { getCurrentSession, isAdminEmail } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export default async function AdminPaymentsPage() {
  const session = await getCurrentSession()
  if (!session?.user) redirect("/sign-in")
  if (!isAdminEmail(session.user.email)) redirect("/")

  const requests = await db
    .select({
      id: paymentRequests.id,
      userId: paymentRequests.userId,
      email: user.email,
      reference: paymentRequests.paymentReference,
      createdAt: paymentRequests.createdAt,
    })
    .from(paymentRequests)
    .leftJoin(user, eq(paymentRequests.userId, user.id))
    .where(eq(paymentRequests.status, "pending"))
    .orderBy(asc(paymentRequests.createdAt))
    .limit(100)

  return (
    <AdminPayments
      requests={requests.map((request) => ({
        ...request,
        email: request.email ?? "Cuenta eliminada",
        createdAt: request.createdAt.toISOString(),
      }))}
    />
  )
}
