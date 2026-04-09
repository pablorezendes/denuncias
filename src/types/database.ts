export type DenunciaStatus = 'Pendente' | 'Em Análise' | 'Em Investigação' | 'Concluída' | 'Arquivada'
export type DenunciaPrioridade = 'Baixa' | 'Média' | 'Alta' | 'Urgente'
export type NivelAcesso = 'admin' | 'supervisor' | 'analista'

export interface Denuncia {
  id: number
  protocolo: string
  descricao: string
  anexo: string | null
  status: DenunciaStatus
  prioridade: DenunciaPrioridade
  ip_denunciante: string | null
  user_agent: string | null
  data_ocorrencia: string | null
  local_ocorrencia: string | null
  pessoas_envolvidas: string | null
  data_criacao: string
  data_atualizacao: string
  data_conclusao: string | null
  conclusao_descricao: string | null
  admin_responsavel_id: number | null
  categorias?: string[]
  responsavel?: string
}

export interface Categoria {
  id: number
  nome: string
  descricao: string | null
  cor: string
  icone: string | null
  ordem: number
  ativo: boolean
  requer_aprovacao: boolean
  data_criacao: string
  data_atualizacao: string
}

export interface HistoricoStatus {
  id: number
  denuncia_id: number
  status_anterior: DenunciaStatus | null
  status_novo: DenunciaStatus
  admin_id: number | null
  observacao: string | null
  data_alteracao: string
  admin_nome?: string
}

export interface User {
  id: number
  nome: string
  email: string
  usuario: string
  ativo: boolean
  tentativas_login: number
  bloqueado_ate: string | null
  ultimo_acesso: string | null
  force_password_change: boolean
  created_at: string
  updated_at: string | null
  roles?: string[]
}

export interface Role {
  id: number
  nome: string
  descricao: string | null
  nivel: number
  ativo: boolean
  created_at: string
}

export interface Permission {
  id: number
  nome: string
  descricao: string | null
  slug: string
  created_at: string
}

export interface Resposta {
  id: number
  denuncia_id: number
  admin_id: number
  resposta: string
  data_criacao: string
  admin_usuario?: string
}

export interface Anexo {
  id: number
  denuncia_id: number
  nome_arquivo: string
  tipo_arquivo: string | null
  tamanho: number | null
  data_upload: string
}

