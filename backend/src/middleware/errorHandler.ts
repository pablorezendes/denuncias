import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

export function errorHandler(
  error: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Erros de validação Zod
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'ValidationError',
      message: 'Dados inválidos',
      details: error.flatten().fieldErrors,
    })
  }

  // Rate limit
  if (error.statusCode === 429) {
    return reply.code(429).send({
      error: 'TooManyRequests',
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
    })
  }

  // Erros HTTP conhecidos
  if (error.statusCode && error.statusCode < 500) {
    return reply.code(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
    })
  }

  // Erros internos - logar e esconder detalhes
  req.log.error({ err: error, url: req.url, method: req.method }, 'Erro não tratado')
  return reply.code(500).send({
    error: 'InternalServerError',
    message: 'Ocorreu um erro interno. A equipe foi notificada.',
  })
}
