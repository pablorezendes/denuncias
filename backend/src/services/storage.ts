import { Client as MinioClient } from 'minio'
import { config } from '../config.js'

export const minio = new MinioClient({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
})

export const BUCKET = config.MINIO_BUCKET

export async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET).catch(() => false)
  if (!exists) {
    await minio.makeBucket(BUCKET)
  }
}

/**
 * Upload direto em buffer (usado na criação de denúncia com anexos).
 */
export async function uploadBuffer(
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await minio.putObject(BUCKET, path, buffer, buffer.length, {
    'Content-Type': contentType,
  })
}

/**
 * Gera URL assinada temporária (expira em minutos).
 */
export async function getSignedUrl(path: string, expiresSeconds = 300): Promise<string> {
  return minio.presignedGetObject(BUCKET, path, expiresSeconds)
}

/**
 * Remove arquivo do bucket.
 */
export async function removeObject(path: string): Promise<void> {
  await minio.removeObject(BUCKET, path)
}
