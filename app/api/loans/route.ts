import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"

const loanSchema = z.object({
  recipient_name: z.string().min(2),
  item_name: z.string().min(2),
  description: z.string().optional(),
  quantity: z.number().min(1),
  borrowed_at: z.string().transform((str) => new Date(str)),
  return_by: z.string().transform((str) => new Date(str)),
  state_start: z.string().min(2),
})

export async function GET() {
  try {
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

    const loans = await prisma.loan.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(loans)
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json(
      { error: "Error al obtener los préstamos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const validatedData = loanSchema.parse(body)

    const loan = await prisma.loan.create({
      data: {
        user_id: user.id,
        recipient_name: validatedData.recipient_name,
        item_name: validatedData.item_name,
        description: validatedData.description,
        quantity: validatedData.quantity,
        borrowed_at: validatedData.borrowed_at,
        return_by: validatedData.return_by,
        state_start: validatedData.state_start,
      },
    })

    return NextResponse.json(loan)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating loan:", error)
    return NextResponse.json(
      { error: "Error al crear el préstamo" },
      { status: 500 }
    )
  }
}