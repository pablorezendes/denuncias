import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { buscarDenunciaPorProtocolo, buscarHistoricoStatus } from '@/lib/api/denuncias'
import type { Denuncia, HistoricoStatus } from '@/types/database'
import { Search, ArrowLeft, Clock, CheckCircle, AlertCircle, FileText, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const statusIcons = {
  Pendente: Clock,
  'Em Análise': FileText,
  'Em Investigação': AlertCircle,
  Concluída: CheckCircle,
  Arquivada: Archive,
}

const statusColors = {
  Pendente: 'bg-hsfa-warning-light text-hsfa-warning border border-hsfa-warning',
  'Em Análise': 'bg-hsfa-soft text-hsfa-primary border border-hsfa-primary',
  'Em Investigação': 'bg-hsfa-warning-light text-hsfa-warning border border-hsfa-warning',
  Concluída: 'bg-hsfa-success-light text-hsfa-success border border-hsfa-success',
  Arquivada: 'bg-hsfa-bg-soft text-hsfa-text-soft border border-hsfa-muted',
}

export default function ConsultarDenuncia() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') || '')
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null)
  const [historico, setHistorico] = useState<HistoricoStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (!protocolo.trim()) {
      setError('Por favor, informe o protocolo')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await buscarDenunciaPorProtocolo(protocolo.trim().toUpperCase())
      if (!data) {
        setError('Denúncia não encontrada')
        setDenuncia(null)
        setHistorico([])
        return
      }

      setDenuncia(data)
      const historicoData = await buscarHistoricoStatus(data.id)
      setHistorico(historicoData)
      setSearchParams({ protocolo: protocolo.trim().toUpperCase() })
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar denúncia')
      setDenuncia(null)
      setHistorico([])
    } finally {
      setLoading(false)
    }
  }

  const StatusIcon = denuncia ? statusIcons[denuncia.status] : null

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-hsfa-soft to-hsfa-bg">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-hsfa-primary hover:text-hsfa-primary-dark mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>

          <div className="bg-white rounded-xl shadow-hsfa-lg p-8 mb-6 border border-hsfa-muted">
            <h1 className="text-3xl font-bold text-hsfa-primary mb-6">
              Consultar Denúncia
            </h1>

            <div className="flex gap-4">
              <input
                type="text"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Digite o protocolo da denúncia"
                className="flex-1 px-4 py-3 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors uppercase font-medium"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-hsfa-primary text-white px-6 py-3 rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-md"
              >
                <Search className="w-5 h-5" />
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {denuncia && (
            <div className="space-y-6">
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
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

