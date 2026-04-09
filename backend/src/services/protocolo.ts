import { randomBytes } from 'node:crypto'

/**
 * Gera um protocolo de 8 caracteres usando crypto.randomBytes.
 * Alfabeto: 0-9 A-Z (36 chars) — 36^8 ≈ 2.8 trilhões de combinações.
 */
export function gerarProtocolo(): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const bytes = randomBytes(8)
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += alphabet[bytes[i] % alphabet.length]
  }
  return result
}
