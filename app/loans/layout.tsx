import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/dashboard/main-nav"

export default async function LoansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <>
      <MainNav userEmail={session.user?.email || ''} />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  )
}