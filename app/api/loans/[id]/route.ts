import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
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
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(loan)
  } catch (error) {
    console.error("Error fetching loan:", error)
    return NextResponse.json(
      { error: "Error al obtener el préstamo" },
      { status: 500 }
    )
  }
}