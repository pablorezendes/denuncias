import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// Tipos do usuário autenticado
export interface AuthUser {
  id: number
  usuario: string
  nome: string
  email: string
  roles: string[]
  permissions: string[]
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requirePermission: (perm: string) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: AuthUser
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser
    user: AuthUser
  }
}

export function registerAuthDecorators(app: FastifyInstance) {
  // Verifica JWT e popula req.user
  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify()
    } catch {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Token inválido ou expirado' })
    }
  })

  // Verifica permissão específica
  app.decorate('requirePermission', function (perm: string) {
    return async function (req: FastifyRequest, reply: FastifyReply) {
      try {
        await req.jwtVerify()
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
      if (!req.user.permissions?.includes(perm)) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: `Permissão necessária: ${perm}`,
        })
      }
    }
  })
}
