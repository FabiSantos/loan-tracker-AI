import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { LoanDetailsClient } from "@/components/loans/loan-details-client"
import { authOptions } from "@/lib/auth/authOptions"

export default async function LoanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/login")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/auth/login")
  }

  const loan = await prisma.loan.findFirst({
    where: {
      id: id,
      user_id: user.id,
    },
    include: {
      photos: true,
      reminders: true,
    },
  })

  if (!loan) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <LoanDetailsClient loan={loan} />
    </div>
  )
}