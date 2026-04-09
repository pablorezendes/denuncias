import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { users } from '../db/schema/index.js'
import { verifyPassword } from '../services/hash.js'
import { getUserPermissions, getUserRoles } from '../services/permissions.js'
import { config } from '../config.js'

const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuário obrigatório'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

export const authRoutes: FastifyPluginAsync = async (app) => {
  // ---------------- POST /api/auth/login ----------------
  app.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: config.RATE_LIMIT_LOGIN_MAX,
          timeWindow: `${config.RATE_LIMIT_LOGIN_WINDOW_MIN} minutes`,
          errorResponseBuilder: () => ({
            error: 'TooManyRequests',
            message: 'Muitas tentativas de login. Aguarde alguns minutos.',
          }),
        },
      },
    },
    async (req, reply) => {
      const body = loginSchema.parse(req.body)

      const user = await db.query.users.findFirst({
        where: eq(users.usuario, body.usuario),
      })

      if (!user || !user.ativo) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Usuário ou senha inválidos' })
      }

      // Bloqueado?
      if (user.bloqueadoAte && new Date(user.bloqueadoAte) > new Date()) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Usuário temporariamente bloqueado. Tente novamente mais tarde.',
        })
      }

      // Verificar senha
      const ok = await verifyPassword(body.senha, user.senhaHash)
      if (!ok) {
        // Incrementa tentativas + bloqueia se passar do limite (5)
        const novasTentativas = (user.tentativasLogin ?? 0) + 1
        const deveBloquear = novasTentativas >= 5
        await db
          .update(users)
          .set({
            tentativasLogin: novasTentativas,
            bloqueadoAte: deveBloquear ? new Date(Date.now() + 15 * 60_000) : user.bloqueadoAte,
          })
          .where(eq(users.id, user.id))

        return reply.code(401).send({ error: 'Unauthorized', message: 'Usuário ou senha inválidos' })
      }

      // Login OK: resetar tentativas e atualizar último acesso
      await db
        .update(users)
        .set({
          ultimoAcesso: new Date(),
          tentativasLogin: 0,
          bloqueadoAte: null,
        })
        .where(eq(users.id, user.id))

      // Buscar roles e permissões
      const [rolesArr, perms] = await Promise.all([
        getUserRoles(user.id),
        getUserPermissions(user.id),
      ])

      const payload = {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        email: user.email,
        roles: rolesArr,
        permissions: perms,
      }

      const token = app.jwt.sign(payload)

      return reply.send({
        token,
        user: {
          ...payload,
          forcePasswordChange: user.forcePasswordChange ?? false,
          ultimoAcesso: user.ultimoAcesso,
        },
      })
    },
  )

  // ---------------- GET /api/auth/me ----------------
  app.get('/me', { onRequest: [app.authenticate] }, async (req) => {
    return { user: req.user }
  })

  // ---------------- POST /api/auth/logout ----------------
  // Stateless JWT: cliente só precisa descartar o token.
  // Este endpoint existe apenas por conveniência de auditoria futura.
  app.post('/logout', { onRequest: [app.authenticate] }, async () => {
    return { ok: true }
  })
}
