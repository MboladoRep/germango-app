import { GameClient } from "@/components/game-client"
import { getCurrentSession, isAdminEmail } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await getCurrentSession()
  const email = session?.user.email ?? null

  return (
    <GameClient
      isAuthenticated={Boolean(session?.user)}
      isAdmin={isAdminEmail(email)}
      email={email}
    />
  )
}
