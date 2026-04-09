import { api } from './http'

/**
 * Valida se o arquivo é permitido (usado no UI antes do upload).
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido. Use: JPG, PNG ou PDF' }
  }

  return { valid: true }
}

interface UploadResponse {
  uploads: Array<{ nome: string; storagePath: string }>
}

/**
 * Envia arquivos para um protocolo de denúncia via endpoint da API.
 * O backend valida magic bytes, salva no MinIO e registra em `anexos`.
 */
export async function uploadAnexosParaProtocolo(
  protocolo: string,
  files: File[],
): Promise<string[]> {
  if (files.length === 0) return []

  const form = new FormData()
  for (const file of files) {
    form.append('files', file, file.name)
  }

  const resp = await api.post<UploadResponse>('/uploads', form, {
    params: { protocolo },
    skipAuth: true, // endpoint público (denunciante anônimo)
  })
  return resp.uploads.map((u) => u.storagePath)
}

// ------------------------------------------------------------
// Compatibilidade com código antigo
// ------------------------------------------------------------

/**
 * @deprecated Use `uploadAnexosParaProtocolo` — upload por denunciaId
 * não é mais suportado no novo backend (precisa de protocolo para
 * permitir uploads anônimos).
 */
export async function uploadFile(_file: File, _denunciaId: number): Promise<string> {
  throw new Error(
    'uploadFile() foi removido. Use uploadAnexosParaProtocolo(protocolo, files).',
  )
}

/**
 * @deprecated
 */
export async function uploadFiles(_files: File[], _denunciaId: number): Promise<string[]> {
  throw new Error(
    'uploadFiles() foi removido. Use uploadAnexosParaProtocolo(protocolo, files).',
  )
}

/**
 * @deprecated Agora a exclusão de anexos é feita via backend ao excluir a denúncia.
 */
export async function deleteFile(_filePath: string): Promise<void> {
  throw new Error('deleteFile() foi removido. Exclusão é feita via backend.')
}

/**
 * @deprecated Backend retorna URLs assinadas temporárias via /denuncias/:id/anexos.
 */
export function getPublicUrl(_filePath: string): string {
  throw new Error(
    'getPublicUrl() foi removido. Use buscarAnexosDenuncia(id) para obter URLs assinadas.',
  )
}
