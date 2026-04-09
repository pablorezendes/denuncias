import { api } from './http'

export interface Notification {
  id: number
  user_id: number
  tipo: 'denuncia_nova' | 'denuncia_atualizada' | 'denuncia_concluida' | 'atribuicao'
  titulo: string
  mensagem: string
  lida: boolean
  data_criacao: string
  denuncia_id?: number
}

/**
 * Busca notificações de um usuário.
 */
export async function buscarNotificacoes(
  userId: number,
  apenasNaoLidas = false,
): Promise<Notification[]> {
  return api.get<Notification[]>('/notifications', {
    params: {
      userId,
      apenasNaoLidas: apenasNaoLidas ? 'true' : undefined,
    },
  })
}

/**
 * Marca notificação como lida.
 */
export async function marcarComoLida(notificacaoId: number): Promise<void> {
  await api.patch(`/notifications/${notificacaoId}/lida`)
}

/**
 * Marca todas as notificações de um usuário como lidas.
 */
export async function marcarTodasComoLidas(userId: number): Promise<void> {
  await api.patch('/notifications/marcar-todas', { userId })
}

/**
 * Conta notificações não lidas.
 */
export async function contarNotificacoesNaoLidas(userId: number): Promise<number> {
  const { count } = await api.get<{ count: number }>('/notifications/count-nao-lidas', {
    params: { userId },
  })
  return count
}

/**
 * Envio de notificações é feito pelo backend ao criar denúncia.
 * Esta função existe apenas para compatibilidade — não faz nada.
 */
export async function notificarNovaDenuncia(
  _denunciaId: number,
  _protocolo: string,
): Promise<void> {
  // Backend já dispara as notificações ao criar a denúncia
}

/**
 * @deprecated Criação de notificações é responsabilidade do backend.
 */
export async function criarNotificacao(): Promise<void> {
  // noop
}

/**
 * @deprecated Criação de notificações é responsabilidade do backend.
 */
export async function criarNotificacoes(): Promise<void> {
  // noop
}
