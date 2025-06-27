import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
      },
    })

    return NextResponse.json(
      { message: 'Usuario creado exitosamente', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { message: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}