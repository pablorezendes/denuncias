import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { DenunciaCompleta } from '@/lib/api/relatorios'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Exporta denúncias para Excel
 */
export function exportarParaExcel(
  denuncias: DenunciaCompleta[],
  nomeArquivo: string = 'relatorio-denuncias.xlsx'
) {
  // Preparar dados para a planilha principal
  const dados = denuncias.map(denuncia => ({
    'Protocolo': denuncia.protocolo,
    'Data Criação': format(new Date(denuncia.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    'Status': denuncia.status,
    'Prioridade': denuncia.prioridade,
    'Categorias': denuncia.categorias.join(', '),
    'Data Ocorrência': denuncia.data_ocorrencia 
      ? format(new Date(denuncia.data_ocorrencia), 'dd/MM/yyyy', { locale: ptBR })
      : '-',
    'Local Ocorrência': denuncia.local_ocorrencia || '-',
    'Descrição': denuncia.descricao.substring(0, 200) + (denuncia.descricao.length > 200 ? '...' : ''),
    'Pessoas Envolvidas': denuncia.pessoas_envolvidas?.substring(0, 100) || '-',
    'Responsável': denuncia.responsavel || '-',
    'Data Conclusão': denuncia.data_conclusao
      ? format(new Date(denuncia.data_conclusao), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      : '-',
    'Qtd. Anexos': denuncia.anexos.length,
    'Qtd. Histórico': denuncia.historico.length,
    'Qtd. Respostas': denuncia.respostas.length,
  }))

  // Criar workbook
  const wb = XLSX.utils.book_new()

  // Planilha principal
  const ws = XLSX.utils.json_to_sheet(dados)
  
  // Ajustar larguras das colunas
  const colWidths = [
    { wch: 15 }, // Protocolo
    { wch: 18 }, // Data Criação
    { wch: 15 }, // Status
    { wch: 12 }, // Prioridade
    { wch: 25 }, // Categorias
    { wch: 15 }, // Data Ocorrência
    { wch: 25 }, // Local Ocorrência
    { wch: 50 }, // Descrição
    { wch: 30 }, // Pessoas Envolvidas
    { wch: 20 }, // Responsável
    { wch: 18 }, // Data Conclusão
    { wch: 12 }, // Qtd. Anexos
    { wch: 15 }, // Qtd. Histórico
    { wch: 15 }, // Qtd. Respostas
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Denúncias')

  // Planilha de histórico (se houver)
  if (denuncias.some(d => d.historico.length > 0)) {
    const historicoData: any[] = []
    denuncias.forEach(denuncia => {
      denuncia.historico.forEach(h => {
        historicoData.push({
          'Protocolo': denuncia.protocolo,
          'Status Anterior': h.status_anterior || '-',
          'Status Novo': h.status_novo,
          'Data Alteração': format(new Date(h.data_alteracao), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          'Observação': h.observacao || '-',
          'Admin': h.admin_nome || '-',
        })
      })
    })
    const wsHistorico = XLSX.utils.json_to_sheet(historicoData)
    wsHistorico['!cols'] = [
      { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 50 }, { wch: 20 }
    ]
    XLSX.utils.book_append_sheet(wb, wsHistorico, 'Histórico')
  }

  // Planilha de respostas (se houver)
  if (denuncias.some(d => d.respostas.length > 0)) {
    const respostasData: any[] = []
    denuncias.forEach(denuncia => {
      denuncia.respostas.forEach(r => {
        respostasData.push({
          'Protocolo': denuncia.protocolo,
          'Resposta': r.resposta.substring(0, 200),
          'Data Resposta': format(new Date(r.data_resposta), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          'Admin': r.admin_nome || '-',
        })
      })
    })
    const wsRespostas = XLSX.utils.json_to_sheet(respostasData)
    wsRespostas['!cols'] = [
      { wch: 15 }, { wch: 60 }, { wch: 20 }, { wch: 20 }
    ]
    XLSX.utils.book_append_sheet(wb, wsRespostas, 'Respostas')
  }

  // Estatísticas
  const stats = {
    'Total de Denúncias': denuncias.length,
    'Pendentes': denuncias.filter(d => d.status === 'Pendente').length,
    'Em Análise': denuncias.filter(d => d.status === 'Em Análise').length,
    'Em Investigação': denuncias.filter(d => d.status === 'Em Investigação').length,
    'Concluídas': denuncias.filter(d => d.status === 'Concluída').length,
    'Arquivadas': denuncias.filter(d => d.status === 'Arquivada').length,
  }
  const wsStats = XLSX.utils.json_to_sheet([stats])
  wsStats['!cols'] = [{ wch: 25 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsStats, 'Estatísticas')

  // Gerar arquivo
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, nomeArquivo)
}

