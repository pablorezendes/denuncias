import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import { buscarDenunciaPorProtocolo, buscarHistoricoStatus, atualizarStatusDenuncia, excluirDenuncia } from '@/lib/api/denuncias'
import type { Denuncia, User, DenunciaStatus, HistoricoStatus } from '@/types/database'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Archive, Save, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface VisualizarDenunciaProps {
  user: User
  onLogout: () => void
}

const statusIcons = {
  Pendente: Clock,
  'Em Análise': FileText,
  'Em Investigação': AlertCircle,
  Concluída: CheckCircle,
  Arquivada: Archive,
}

const statusColors = {
  Pendente: 'bg-hsfa-warning-claro text-hsfa-warning border border-hsfa-warning',
  'Em Análise': 'bg-hsfa-soft text-hsfa-primary border border-hsfa-primary',
  'Em Investigação': 'bg-hsfa-warning-claro text-hsfa-warning border border-hsfa-warning',
  Concluída: 'bg-hsfa-success-claro text-hsfa-success border border-hsfa-success',
  Arquivada: 'bg-hsfa-bg-soft text-hsfa-text-soft border border-hsfa-muted',
}

export default function VisualizarDenuncia({ user, onLogout }: VisualizarDenunciaProps) {
  const { protocolo } = useParams<{ protocolo: string }>()
  const navigate = useNavigate()
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null)
  const [historico, setHistorico] = useState<HistoricoStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [novoStatus, setNovoStatus] = useState<DenunciaStatus>('Pendente')
  const [observacao, setObservacao] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (protocolo) {
      loadDenuncia()
    }
  }, [protocolo])

  async function loadDenuncia() {
    if (!protocolo) return

    setLoading(true)
    setError(null)

    try {
      const data = await buscarDenunciaPorProtocolo(protocolo)
      if (!data) {
        setError('Denúncia não encontrada')
        return
      }

      setDenuncia(data)
      setNovoStatus(data.status)

      const historicoData = await buscarHistoricoStatus(data.id)
      setHistorico(historicoData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar denúncia')
    } finally {
      setLoading(false)
    }
  }

  async function handleAtualizarStatus() {
    if (!denuncia) return

    // Não fazer nada se o status não mudou
    if (novoStatus === denuncia.status) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await atualizarStatusDenuncia(denuncia.id, novoStatus, observacao, user.id)
      // Recarregar dados da denúncia para mostrar atualização
      await loadDenuncia()
      setObservacao('')
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err)
      setError(err.message || 'Erro ao atualizar status')
    } finally {
      setSaving(false)
    }
  }

  async function handleExcluir() {
    if (!denuncia) return

    if (!confirm(`Tem certeza que deseja excluir a denúncia ${denuncia.protocolo}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await excluirDenuncia(denuncia.id)
      navigate('/admin/denuncias')
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir denúncia')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-hsfa-bg-soft flex items-center justify-center">
        <div className="text-hsfa-text-soft">Carregando...</div>
      </div>
    )
  }

  if (!denuncia) {
    return (
      <div className="min-h-screen bg-hsfa-bg-soft flex items-center justify-center">
        <div className="text-center">
          <p className="text-hsfa-text-soft mb-4">Denúncia não encontrada</p>
          <button
            onClick={() => navigate('/admin/denuncias')}
            className="text-hsfa-primary hover:text-hsfa-primary-dark"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusIcons[denuncia.status]

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <div className="min-h-screen bg-hsfa-bg-soft">
        {/* Header */}
        <header className="bg-white border-b border-hsfa-muted shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/admin/denuncias')}
                  className="flex items-center gap-2 text-hsfa-text hover:text-hsfa-primary transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-hsfa-primary">
                    Denúncia: {denuncia.protocolo}
                  </h1>
                  <p className="text-sm text-hsfa-text-soft mt-1">
                    Detalhes e histórico da denúncia
                  </p>
                </div>
              </div>
              <button
                onClick={handleExcluir}
                disabled={deleting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Trash2 className="w-5 h-5" />
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
          {/* Informações da Denúncia */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-hsfa-lg p-8 border border-hsfa-muted">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-hsfa-primary mb-2">
                    Protocolo: {denuncia.protocolo}
                  </h2>
                  <p className="text-hsfa-text-soft">
                    Registrada em {format(new Date(denuncia.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {StatusIcon && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusColors[denuncia.status]}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-semibold">{denuncia.status}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-hsfa-text-soft mb-1">Descrição</h3>
                  <p className="text-hsfa-text break-words whitespace-pre-wrap">{denuncia.descricao}</p>
                </div>

                {denuncia.categorias && denuncia.categorias.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-hsfa-text-soft mb-2">Categorias</h3>
                    <div className="flex flex-wrap gap-2">
                      {denuncia.categorias.map((cat, idx) => (
                        <span
                          key={idx}
                          className="bg-hsfa-soft text-hsfa-primary px-3 py-1 rounded-full text-sm font-medium border border-hsfa-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {denuncia.local_ocorrencia && (
                  <div>
                    <h3 className="text-sm font-medium text-hsfa-text-soft mb-1">Local da Ocorrência</h3>
                    <p className="text-hsfa-text break-words">{denuncia.local_ocorrencia}</p>
                  </div>
                )}

                {denuncia.data_ocorrencia && (
                  <div>
                    <h3 className="text-sm font-medium text-hsfa-text-soft mb-1">Data da Ocorrência</h3>
                    <p className="text-hsfa-text">
                      {format(new Date(denuncia.data_ocorrencia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {denuncia.pessoas_envolvidas && (
                  <div>
                    <h3 className="text-sm font-medium text-hsfa-text-soft mb-1">Pessoas Envolvidas</h3>
                    <p className="text-hsfa-text break-words whitespace-pre-wrap">{denuncia.pessoas_envolvidas}</p>
                  </div>
                )}

                {denuncia.conclusao_descricao && (
                  <div className="bg-hsfa-success-claro border-2 border-hsfa-success rounded-lg p-4">
                    <h3 className="text-sm font-medium text-hsfa-success mb-1">Conclusão</h3>
                    <p className="text-hsfa-text break-words whitespace-pre-wrap">{denuncia.conclusao_descricao}</p>
                  </div>
                )}
              </div>
            </div>

            {historico.length > 0 && (
              <div className="bg-white rounded-xl shadow-hsfa-lg p-8 border border-hsfa-muted">
                <h3 className="text-xl font-bold text-hsfa-primary mb-6">Histórico de Atualizações</h3>
                <div className="space-y-4">
                  {historico.map((item) => (
                    <div key={item.id} className="border-l-4 border-hsfa-primary pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-hsfa-primary">
                            {item.status_anterior ? `${item.status_anterior} → ${item.status_novo}` : item.status_novo}
                          </p>
                          <p className="text-sm text-hsfa-text-soft">
                            {format(new Date(item.data_alteracao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {item.observacao && (
                            <p className="mt-2 text-hsfa-text break-words">{item.observacao}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Painel de Ações */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-hsfa-lg p-6 border border-hsfa-muted">
              <h3 className="text-lg font-semibold text-hsfa-primary mb-4">
                Atualizar Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                    Novo Status
                  </label>
                  <select
                    value={novoStatus}
                    onChange={(e) => setNovoStatus(e.target.value as DenunciaStatus)}
                    className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Em Investigação">Em Investigação</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Arquivada">Arquivada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                    Observação (opcional)
                  </label>
                  <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                    placeholder="Adicione uma observação sobre a mudança de status..."
                  />
                </div>

                <button
                  onClick={handleAtualizarStatus}
                  disabled={saving || novoStatus === denuncia.status}
                  className="w-full bg-hsfa-primary text-white py-3 px-4 rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando...' : 'Atualizar Status'}
                </button>
              </div>
            </div>

            {denuncia.responsavel && (
              <div className="bg-white rounded-xl shadow-hsfa-lg p-6 border border-hsfa-muted">
                <h3 className="text-lg font-semibold text-hsfa-primary mb-2">
                  Responsável
                </h3>
                <p className="text-hsfa-text">{denuncia.responsavel}</p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
