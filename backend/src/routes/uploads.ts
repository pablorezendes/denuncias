import type { FastifyPluginAsync } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'
import { z } from 'zod'
import { db } from '../db/client.js'
import { anexos, denuncias } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'
import { uploadBuffer, ensureBucket } from '../services/storage.js'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'application/pdf'])

const uploadQuery = z.object({
  protocolo: z.string().length(8),
})

export const uploadsRoutes: FastifyPluginAsync = async (app) => {
  await ensureBucket()

  // POST /api/uploads?protocolo=XXXXXXXX
  // Recebe multipart, valida magic bytes, envia para MinIO, registra em `anexos`.
  app.post('/', async (req, reply) => {
    const { protocolo } = uploadQuery.parse(req.query)

    // Busca denúncia pelo protocolo
    const denuncia = await db.query.denuncias.findFirst({
      where: eq(denuncias.protocolo, protocolo.toUpperCase()),
    })
    if (!denuncia) return reply.code(404).send({ error: 'Denúncia não encontrada' })

    const parts = req.parts()
    const results: Array<{ nome: string; storagePath: string }> = []

    for await (const part of parts) {
      if (part.type !== 'file') continue

      const buffer = await part.toBuffer()

      if (buffer.length > MAX_SIZE) {
        return reply.code(413).send({ error: 'Arquivo excede 10MB' })
      }

      // Valida magic bytes reais (não confia no content-type enviado)
      const detected = await fileTypeFromBuffer(buffer)
      if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
        return reply
          .code(415)
          .send({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.' })
      }

      const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${denuncia.id}/${Date.now()}-${safeName}`

      await uploadBuffer(path, buffer, detected.mime)

      await db.insert(anexos).values({
        denunciaId: denuncia.id,
        nomeArquivo: part.filename,
        tipoArquivo: detected.mime,
        tamanho: buffer.length,
        storagePath: path,
      })

      results.push({ nome: part.filename, storagePath: path })
    }

    return reply.code(201).send({ uploads: results })
  })
}
