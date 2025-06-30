import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db/prisma"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(
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

    // Verificar que el préstamo pertenece al usuario
    const loan = await prisma.loan.findFirst({
      where: {
        id: id,
        user_id: user.id,
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string || "loan"

    if (!file) {
      return NextResponse.json({ error: "No se encontró archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o WebP" },
        { status: 400 }
      )
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 5MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Crear nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.name)
    const filename = `${loan.id}-${uniqueSuffix}${extension}`
    const filepath = path.join(process.cwd(), "public/uploads/loans", filename)

    // Guardar archivo
    await writeFile(filepath, buffer)

    // Guardar referencia en base de datos
    const photo = await prisma.loanPhoto.create({
      data: {
        loan_id: loan.id,
        url: `/uploads/loans/${filename}`,
        type: type,
      },
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error("Error uploading photo:", error)
    return NextResponse.json(
      { error: "Error al subir la foto" },
      { status: 500 }
    )
  }
}

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

    // Verificar que el préstamo pertenece al usuario
    const loan = await prisma.loan.findFirst({
      where: {
        id: id,
        user_id: user.id,
      },
      include: {
        photos: {
          orderBy: {
            uploaded_at: "desc",
          },
        },
      },
    })

    if (!loan) {
      return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 })
    }

    return NextResponse.json(loan.photos)
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json(
      { error: "Error al obtener las fotos" },
      { status: 500 }
    )
  }
}