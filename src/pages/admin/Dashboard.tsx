import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import type { User } from '@/types/database'
import { FileText, Users, BarChart3, Filter, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { buscarEstatisticasDashboard, type DashboardStats, type DashboardFilters } from '@/lib/api/stats'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

interface DashboardProps {
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

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<DashboardFilters>({})

  useEffect(() => {
    loadStats()
  }, [filtros])

  async function loadStats() {
    setLoading(true)
    setError(null)
    try {
      const data = await buscarEstatisticasDashboard(filtros)
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterChange(key: keyof DashboardFilters, value: any) {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFiltros({})
  }

  return (
    <AdminLayout user={user} onLogout={onLogout}>
      <div className="min-h-screen bg-hsfa-bg-soft">
        {/* Header */}
        <header className="bg-white border-b border-hsfa-muted shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-hsfa-primary">
              Dashboard
            </h1>
            <p className="text-sm text-hsfa-text-soft mt-1">
              Visão geral do sistema de denúncias
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-hsfa-lg p-6 mb-6 border border-hsfa-muted">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-hsfa-primary" />
            <h2 className="text-xl font-semibold text-hsfa-primary">Filtros</h2>
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
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-hsfa-bg-soft text-hsfa-text-soft rounded-lg hover:bg-hsfa-muted transition-colors font-semibold"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-hsfa-text-soft">Carregando estatísticas...</div>
          </div>
        ) : stats && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-hsfa-text-soft mb-1">Total de Denúncias</p>
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
                    <p className="text-sm text-hsfa-text-soft mb-1">Últimas 24h</p>
                    <p className="text-3xl font-bold text-hsfa-info">{stats.recentes}</p>
                  </div>
                  <div className="bg-hsfa-info-claro w-12 h-12 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-hsfa-info" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-hsfa-text-soft mb-1">Pendentes Urgentes</p>
                    <p className="text-3xl font-bold text-hsfa-warning">{stats.pendentesUrgentes}</p>
                  </div>
                  <div className="bg-hsfa-warning-claro w-12 h-12 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-hsfa-warning" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-hsfa-text-soft mb-1">Tempo Médio Resolução</p>
                    <p className="text-3xl font-bold text-hsfa-success">
                      {stats.tempoMedioResolucao ? `${stats.tempoMedioResolucao} dias` : '-'}
                    </p>
                  </div>
                  <div className="bg-hsfa-success-claro w-12 h-12 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-hsfa-success" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Status */}
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

              {/* Gráfico de Categorias */}
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

            {/* Gráfico de Evolução Mensal */}
            <div className="bg-white rounded-xl shadow-hsfa-lg p-6 border border-hsfa-muted mb-6">
              <h3 className="text-lg font-semibold text-hsfa-primary mb-4">Evolução Mensal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.porMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={2} name="Denúncias" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cards de Navegação */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                to="/admin/denuncias"
                className="bg-white rounded-xl shadow-hsfa p-6 hover:shadow-hsfa-lg transition-all group border border-hsfa-muted hover:border-hsfa-primary"
              >
                <div className="bg-hsfa-soft w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-hsfa-primary transition-colors">
                  <FileText className="w-6 h-6 text-hsfa-primary group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-semibold text-hsfa-primary mb-2">
                  Gerenciar Denúncias
                </h2>
                <p className="text-hsfa-text-soft">
                  Visualize, analise e gerencie todas as denúncias registradas
                </p>
              </Link>

              <Link
                to="/admin/usuarios"
                className="bg-white rounded-xl shadow-hsfa p-6 hover:shadow-hsfa-lg transition-all group border border-hsfa-muted hover:border-hsfa-primary"
              >
                <div className="bg-hsfa-soft w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-hsfa-primary transition-colors">
                  <Users className="w-6 h-6 text-hsfa-primary group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-semibold text-hsfa-primary mb-2">
                  Gerenciar Usuários
                </h2>
                <p className="text-hsfa-text-soft">
                  Gerencie usuários e permissões do sistema
                </p>
              </Link>

              <div className="bg-white rounded-xl shadow-hsfa p-6 border border-hsfa-muted">
                <div className="bg-hsfa-success-claro w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-hsfa-success" />
                </div>
                <h2 className="text-xl font-semibold text-hsfa-primary mb-2">
                  Relatórios
                </h2>
                <p className="text-hsfa-text-soft">
                  Acesse relatórios e estatísticas do sistema
                </p>
              </div>
            </div>
          </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
