import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import { listarDenuncias, excluirDenuncia, excluirDenunciasEmMassa } from '@/lib/api/denuncias'
import type { Denuncia, User, DenunciaStatus } from '@/types/database'
import { Search, ChevronLeft, ChevronRight, Trash2, Eye, CheckSquare, Square } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ListarDenunciasProps {
  user: User
  onLogout: () => void
}

const statusColors: Record<DenunciaStatus, string> = {
  Pendente: 'bg-hsfa-warning-light text-hsfa-warning border border-hsfa-warning',
  'Em Análise': 'bg-hsfa-soft text-hsfa-primary border border-hsfa-primary',
  'Em Investigação': 'bg-hsfa-warning-light text-hsfa-warning border border-hsfa-warning',
  Concluída: 'bg-hsfa-success-light text-hsfa-success border border-hsfa-success',
  Arquivada: 'bg-hsfa-bg-soft text-hsfa-text-soft border border-hsfa-muted',
}

export default function ListarDenuncias({ user, onLogout }: ListarDenunciasProps) {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<DenunciaStatus | ''>('')
  const [buscaProtocolo, setBuscaProtocolo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deletingMultiple, setDeletingMultiple] = useState(false)

  useEffect(() => {
    loadDenuncias()
  }, [page, filtroStatus])

  async function loadDenuncias() {
    setLoading(true)
    setError(null)

    try {
      const result = await listarDenuncias({
        status: filtroStatus || undefined,
        page,
        limit: 20,
      })

      let filtered = result.data

      if (buscaProtocolo) {
        filtered = filtered.filter((d) =>
          d.protocolo.toLowerCase().includes(buscaProtocolo.toLowerCase())
        )
      }

      setDenuncias(filtered)
      setTotalPages(result.totalPages)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar denúncias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDenuncias()
  }, [buscaProtocolo])

  async function handleExcluir(denunciaId: number, protocolo: string) {
    if (!confirm(`Tem certeza que deseja excluir a denúncia ${protocolo}? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingId(denunciaId)
    setError(null)

    try {
      await excluirDenuncia(denunciaId)
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(denunciaId)
        return newSet
      })
      await loadDenuncias()
    } catch (err: any) {
      console.error('Erro ao excluir denúncia:', err)
      setError(err.message || 'Erro ao excluir denúncia')
    } finally {
      setDeletingId(null)
    }
  }

  function toggleSelect(denunciaId: number) {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(denunciaId)) {
        newSet.delete(denunciaId)
      } else {
        newSet.add(denunciaId)
      }
      return newSet
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === denuncias.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(denuncias.map(d => d.id)))
    }
  }

  async function handleExcluirEmMassa() {
    if (selectedIds.size === 0) {
      setError('Selecione pelo menos uma denúncia para excluir')
      return
    }

    const count = selectedIds.size
    if (!confirm(`Tem certeza que deseja excluir ${count} denúncia(s)? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingMultiple(true)
    setError(null)

    try {
      const idsArray = Array.from(selectedIds)
      const resultado = await excluirDenunciasEmMassa(idsArray)
      
      if (resultado.falhas.length > 0) {
        const falhasMsg = resultado.falhas.map(f => `ID ${f.id}: ${f.erro}`).join('\n')
        setError(`Algumas denúncias não puderam ser excluídas:\n${falhasMsg}`)
      }

      if (resultado.sucesso.length > 0) {
        setSelectedIds(new Set())
        await loadDenuncias()
      }
    } catch (err: any) {
      console.error('Erro ao excluir denúncias em massa:', err)
      setError(err.message || 'Erro ao excluir denúncias')
    } finally {
      setDeletingMultiple(false)
    }
  }

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <div className="min-h-screen bg-hsfa-bg-soft">
        {/* Header */}
        <header className="bg-white border-b border-hsfa-muted shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-hsfa-primary">
              Gerenciar Denúncias
            </h1>
            <p className="text-sm text-hsfa-text-soft mt-1">
              Visualize, analise e gerencie todas as denúncias registradas
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Buscar por Protocolo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hsfa-text-muted w-5 h-5" />
                <input
                  type="text"
                  value={buscaProtocolo}
                  onChange={(e) => setBuscaProtocolo(e.target.value)}
                  placeholder="Digite o protocolo..."
                  className="w-full pl-10 pr-4 py-2 border border-hsfa-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Filtrar por Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value as DenunciaStatus | '')
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-hsfa-muted rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Em Investigação">Em Investigação</option>
                <option value="Concluída">Concluída</option>
                <option value="Arquivada">Arquivada</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Lista de Denúncias */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-hsfa-text-soft">Carregando denúncias...</div>
          </div>
        ) : denuncias.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-hsfa-text-soft">Nenhuma denúncia encontrada</p>
          </div>
        ) : (
          <>
            {selectedIds.size > 0 && (
              <div className="mb-4 flex items-center justify-between bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <span className="text-yellow-800 font-semibold">
                  {selectedIds.size} denúncia(s) selecionada(s)
                </span>
                <button
                  onClick={handleExcluirEmMassa}
                  disabled={deletingMultiple}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <Trash2 className="w-5 h-5" />
                  {deletingMultiple ? 'Excluindo...' : `Excluir ${selectedIds.size} selecionada(s)`}
                </button>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-hsfa-bg-soft">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="text-hsfa-primary hover:text-hsfa-primary-dark"
                        title="Selecionar todas"
                      >
                        {selectedIds.size === denuncias.length && denuncias.length > 0 ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Protocolo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Categorias
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-hsfa-text-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {denuncias.map((denuncia) => (
                    <tr 
                      key={denuncia.id} 
                      className={`hover:bg-hsfa-bg-soft ${selectedIds.has(denuncia.id) ? 'bg-hsfa-soft' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleSelect(denuncia.id)}
                          className="text-hsfa-primary hover:text-hsfa-primary-dark"
                        >
                          {selectedIds.has(denuncia.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-hsfa-text">
                          {denuncia.protocolo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[denuncia.status]}`}
                        >
                          {denuncia.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-hsfa-text">
                          {denuncia.categorias?.join(', ') || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-hsfa-text">
                          {format(new Date(denuncia.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-hsfa-text">
                          {denuncia.responsavel || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/admin/denuncias/${denuncia.protocolo}`}
                            className="text-hsfa-primary hover:text-hsfa-primary-dark flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar
                          </Link>
                          <button
                            onClick={() => handleExcluir(denuncia.id, denuncia.protocolo)}
                            disabled={deletingId === denuncia.id}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingId === denuncia.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-hsfa-muted rounded-lg hover:bg-hsfa-bg-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>
                <span className="text-hsfa-secondary">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-hsfa-muted rounded-lg hover:bg-hsfa-bg-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

