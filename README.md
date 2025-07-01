# Loan Tracker

Sistema de seguimiento de préstamos personales con autenticación, dashboard interactivo y gestión completa de préstamos.

🌐 **Demo en vivo**: [https://loan-tracker-ai-fabi.vercel.app](https://loan-tracker-ai-fabi.vercel.app)

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

### Desarrollo Local

Crea un archivo `.env` con las siguientes variables:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-jwt-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-aqui"
```

### Producción (Vercel)

Para desplegar en Vercel:

1. Fork este repositorio
2. Conecta tu repositorio con Vercel
3. Configura las siguientes variables de entorno en Vercel:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_SECRET="genera-un-secret-seguro"
NEXTAUTH_URL="https://tu-app.vercel.app"
NEXTAUTH_SECRET="genera-otro-secret-seguro"
```

**Nota**: Puedes usar PostgreSQL con [Neon](https://neon.tech) para una base de datos gratuita.

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
- Prisma ORM con PostgreSQL (producción) / SQLite (desarrollo)
- NextAuth para autenticación
- Tailwind CSS
- React Query
- React Hook Form + Zod
- Jest + React Testing Library
- Vercel (deployment)

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