import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"

const returnSchema = z.object({
  state_end: z.string().min(2),
  returned_at: z.string().transform((str) => new Date(str)),
})

export async function PATCH(
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
    })

    if (!loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    if (loan.returned_at) {
      return NextResponse.json(
        { error: "Este préstamo ya fue devuelto" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = returnSchema.parse(body)

    const updatedLoan = await prisma.loan.update({
      where: { id: id },
      data: {
        state_end: validatedData.state_end,
        returned_at: validatedData.returned_at,
      },
    })

    return NextResponse.json(updatedLoan)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error marking loan as returned:", error)
    return NextResponse.json(
      { error: "Error al marcar el préstamo como devuelto" },
      { status: 500 }
    )
  }
}