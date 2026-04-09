import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import type { User } from '@/types/database'
import { 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  FileDown,
  Filter,
  BarChart3,
  TrendingUp,
  Calendar,
  Search
} from 'lucide-react'
import { buscarDenunciasParaRelatorio, buscarDenunciaCompletaPorProtocolo, type RelatorioFilters } from '@/lib/api/relatorios'
import { exportarParaExcel } from '@/utils/exportExcel'
import { exportarParaPDF, exportarDenunciaConfidencial } from '@/utils/exportPdf'
import { buscarEstatisticasDashboard, type DashboardStats } from '@/lib/api/stats'
import { listarCategorias } from '@/lib/api/denuncias'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface RelatoriosProps {
  user: User
  onLogout: () => void
}

const COLORS = {
  primary: '#01717B',
  secondary: '#2E3A55',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0891B2',
}

const STATUS_COLORS: Record<string, string> = {
  Pendente: COLORS.warning,
  'Em Análise': COLORS.info,
  'Em Investigação': COLORS.warning,
  Concluída: COLORS.success,
  Arquivada: '#6B7280',
}

export default function Relatorios({ user, onLogout }: RelatoriosProps) {
  const [filtros, setFiltros] = useState<RelatorioFilters>({
    dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
  })
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [protocoloBusca, setProtocoloBusca] = useState('')

  useEffect(() => {
    loadCategorias()
  }, [])

  useEffect(() => {
    if (filtros.dataInicio && filtros.dataFim) {
      loadData()
    }
  }, [filtros])

  async function loadCategorias() {
    try {
      const data = await listarCategorias()
      setCategorias(data)
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    }
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [denunciasData, statsData] = await Promise.all([
        buscarDenunciasParaRelatorio(filtros),
        buscarEstatisticasDashboard(filtros),
      ])
      setDenuncias(denunciasData)
      setStats(statsData)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key: keyof RelatorioFilters, value: any) {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFiltros({
      dataInicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
      dataFim: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  function handleExportExcel() {
    if (denuncias.length === 0) {
      alert('Não há dados para exportar')
      return
    }
    const nomeArquivo = `relatorio-denuncias-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    exportarParaExcel(denuncias, nomeArquivo)
  }

  function handleExportPDF() {
    if (denuncias.length === 0) {
      alert('Não há dados para exportar')
      return
    }
    const nomeArquivo = `relatorio-denuncias-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    const titulo = `Relatório de Denúncias - ${format(new Date(filtros.dataInicio!), 'dd/MM/yyyy', { locale: ptBR })} a ${format(new Date(filtros.dataFim!), 'dd/MM/yyyy', { locale: ptBR })}`
    exportarParaPDF(denuncias, nomeArquivo, titulo)
  }

  function handlePrint() {
    window.print()
  }

  async function handleBuscarDenunciaConfidencial() {
    if (!protocoloBusca.trim()) {
      alert('Digite um protocolo')
      return
    }
    try {
      const denuncia = await buscarDenunciaCompletaPorProtocolo(protocoloBusca.trim())
      if (!denuncia) {
        alert('Denúncia não encontrada')
        return
      }
      exportarDenunciaConfidencial(denuncia)
    } catch (err: any) {
      alert(`Erro ao buscar denúncia: ${err.message}`)
    }
  }

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <div className="min-h-screen bg-hsfa-bg-soft">
        {/* Header */}
        <header className="bg-white border-b border-hsfa-muted shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-hsfa-primary">
                  Relatórios e Análises
                </h1>
                <p className="text-sm text-hsfa-text-soft mt-1">
                  Gere relatórios completos e exporte em diferentes formatos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={loading || denuncias.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={loading || denuncias.length === 0}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <FileDown className="w-5 h-5" />
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  disabled={loading || denuncias.length === 0}
                  className="flex items-center gap-2 bg-hsfa-primary text-white px-4 py-2 rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow-hsfa-lg p-6 mb-6 border border-hsfa-muted">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-hsfa-primary" />
              <h2 className="text-xl font-semibold text-hsfa-primary">Filtros de Relatório</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio || ''}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filtros.dataFim || ''}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Status
                </label>
                <select
                  value={filtros.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                >
                  <option value="">Todos</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Em Investigação">Em Investigação</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Arquivada">Arquivada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Prioridade
                </label>
                <select
                  value={filtros.prioridade || ''}
                  onChange={(e) => handleFilterChange('prioridade', e.target.value || undefined)}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                >
                  <option value="">Todas</option>
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Categoria
                </label>
                <select
                  value={filtros.categoriaId || ''}
                  onChange={(e) => handleFilterChange('categoriaId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-hsfa-bg-soft text-hsfa-text-soft rounded-lg hover:bg-hsfa-muted transition-colors font-semibold"
                >
                  Limpar
                </button>
                <button
                  onClick={loadData}
                  className="w-full px-4 py-2 bg-hsfa-primary text-white rounded-lg hover:bg-hsfa-primary-dark transition-colors font-semibold"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Opções de inclusão */}
            <div className="mt-4 pt-4 border-t border-hsfa-muted">
              <h3 className="text-sm font-semibold text-hsfa-secondary mb-2">Incluir no Relatório:</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.incluirAnexos !== false}
                    onChange={(e) => handleFilterChange('incluirAnexos', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-hsfa-primary rounded border-hsfa-muted focus:ring-hsfa-primary"
                  />
                  <span className="ml-2 text-sm text-hsfa-text">Anexos</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.incluirHistorico !== false}
                    onChange={(e) => handleFilterChange('incluirHistorico', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-hsfa-primary rounded border-hsfa-muted focus:ring-hsfa-primary"
                  />
                  <span className="ml-2 text-sm text-hsfa-text">Histórico</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filtros.incluirRespostas !== false}
                    onChange={(e) => handleFilterChange('incluirRespostas', e.target.checked)}
                    className="form-checkbox h-4 w-4 text-hsfa-primary rounded border-hsfa-muted focus:ring-hsfa-primary"
                  />
                  <span className="ml-2 text-sm text-hsfa-text">Respostas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Busca de denúncia confidencial */}
          <div className="bg-white rounded-xl shadow-hsfa-lg p-6 mb-6 border border-hsfa-muted">
            <h2 className="text-xl font-semibold text-hsfa-primary mb-4">Formulário Confidencial Individual</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite o protocolo da denúncia"
                value={protocoloBusca}
                onChange={(e) => setProtocoloBusca(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
              />
              <button
                onClick={handleBuscarDenunciaConfidencial}
                className="flex items-center gap-2 bg-hsfa-secondary text-white px-6 py-2 rounded-lg hover:bg-hsfa-secondary/90 transition-colors font-semibold"
              >
                <Search className="w-5 h-5" />
                Gerar PDF Confidencial
              </button>
            </div>
            <p className="text-sm text-hsfa-text-soft mt-2">
              Gera um formulário confidencial completo da denúncia com logo e rodapé do hospital
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-hsfa-text-soft">Carregando dados...</div>
            </div>
          ) : (
            <>
              {/* Estatísticas */}
              {stats && (
                <div className="grid md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-hsfa-text-soft mb-1">Total</p>
                        <p className="text-3xl font-bold text-hsfa-primary">{stats.total}</p>
                      </div>
                      <div className="bg-hsfa-soft w-12 h-12 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-hsfa-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-hsfa-text-soft mb-1">Pendentes</p>
                        <p className="text-3xl font-bold text-hsfa-warning">
                          {stats.porStatus.find(s => s.status === 'Pendente')?.count || 0}
                        </p>
                      </div>
                      <div className="bg-hsfa-warning-claro w-12 h-12 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-hsfa-warning" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-hsfa-text-soft mb-1">Concluídas</p>
                        <p className="text-3xl font-bold text-hsfa-success">
                          {stats.porStatus.find(s => s.status === 'Concluída')?.count || 0}
                        </p>
                      </div>
                      <div className="bg-hsfa-success-claro w-12 h-12 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-hsfa-success" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-hsfa-text-soft mb-1">Últimas 24h</p>
                        <p className="text-3xl font-bold text-hsfa-info">{stats.recentes}</p>
                      </div>
                      <div className="bg-hsfa-info-claro w-12 h-12 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-hsfa-info" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gráficos */}
              {stats && (
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-hsfa-lg p-6 border border-hsfa-muted">
                    <h3 className="text-lg font-semibold text-hsfa-primary mb-4">Denúncias por Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.porStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.primary}>
                          {stats.porStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS.primary} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl shadow-hsfa-lg p-6 border border-hsfa-muted">
                    <h3 className="text-lg font-semibold text-hsfa-primary mb-4">Top Categorias</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.porCategoria}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ categoria, percent }: any) => `${categoria} (${((percent || 0) * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {stats.porCategoria.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tabela de denúncias */}
              <div className="bg-white rounded-xl shadow-hsfa-lg overflow-hidden border border-hsfa-muted print:shadow-none">
                <div className="p-6 border-b border-hsfa-muted">
                  <h2 className="text-xl font-semibold text-hsfa-primary">
                    Denúncias ({denuncias.length})
                  </h2>
                </div>
                {denuncias.length === 0 ? (
                  <div className="p-12 text-center text-hsfa-text-soft">
                    Nenhuma denúncia encontrada com os filtros selecionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-hsfa-muted">
                      <thead className="bg-hsfa-bg-soft">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Protocolo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Prioridade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Categorias
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                            Descrição
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-hsfa-muted">
                        {denuncias.map((denuncia) => (
                          <tr key={denuncia.id} className="hover:bg-hsfa-bg-soft">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-hsfa-primary">
                              {denuncia.protocolo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-hsfa-text">
                              {format(new Date(denuncia.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                denuncia.status === 'Concluída' ? 'bg-hsfa-success-claro text-hsfa-success' :
                                denuncia.status === 'Pendente' ? 'bg-hsfa-warning-claro text-hsfa-warning' :
                                denuncia.status === 'Em Análise' ? 'bg-hsfa-info-claro text-hsfa-info' :
                                'bg-hsfa-bg-soft text-hsfa-text-soft'
                              }`}>
                                {denuncia.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-hsfa-text">
                              {denuncia.prioridade}
                            </td>
                            <td className="px-6 py-4 text-sm text-hsfa-text">
                              <div className="flex flex-wrap gap-1">
                                {denuncia.categorias.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-hsfa-soft text-hsfa-primary px-2 py-1 rounded text-xs"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-hsfa-text">
                              <div className="max-w-md truncate">
                                {denuncia.descricao}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          header, .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .bg-hsfa-bg-soft {
            background: white;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

