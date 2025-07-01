# Loan Tracker

Sistema de seguimiento de préstamos personales con autenticación, dashboard interactivo y gestión completa de préstamos.

## Instalación

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd loan-tracker

# Instalar dependencias con pnpm
pnpm install

# Generar cliente de Prisma
pnpm prisma generate

# Configurar base de datos
pnpm prisma db push

# Iniciar servidor de desarrollo
pnpm dev

# Ejecutar tests (opcional)
pnpm test
```

## Configuración

Crea un archivo `.env.local` con las siguientes variables:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
```

## Características

- 🔐 **Autenticación completa** - Registro y login de usuarios
- 📊 **Dashboard interactivo** - Vista general de todos los préstamos
- ➕ **Crear préstamos** - Formulario completo con validaciones
- ✅ **Marcar devoluciones** - Registra cuando te devuelven artículos
- 🔍 **Búsqueda y filtros** - Encuentra préstamos rápidamente
- 🌓 **Modo oscuro** - Interfaz adaptable
- 📱 **Diseño responsive** - Funciona en móvil y desktop

## Uso

1. **Registro**: Crea una cuenta en `/auth/register`
2. **Login**: Inicia sesión en `/auth/login`
3. **Dashboard**: Ve todos tus préstamos y estadísticas
4. **Nuevo préstamo**: Click en "Nuevo Préstamo" para registrar uno
5. **Marcar devolución**: Click en "Marcar como devuelto" cuando te regresen el artículo

## Tecnologías

- Next.js 15 con App Router
- TypeScript
- Prisma ORM con SQLite
- NextAuth para autenticación
- Tailwind CSS
- React Query
- React Hook Form + Zod
- Jest + React Testing Library

## Testing

El proyecto incluye una suite completa de tests con alta cobertura:

```bash
# Ejecutar todos los tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Ver reporte de cobertura
pnpm test:coverage
```

**Cobertura actual**: 93% líneas, 92% statements, 81% branches, 89% funciones