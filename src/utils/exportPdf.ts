import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DenunciaCompleta } from '@/lib/api/relatorios'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Exporta denúncias para PDF
 */
export function exportarParaPDF(
  denuncias: DenunciaCompleta[],
  nomeArquivo: string = 'relatorio-denuncias.pdf',
  titulo: string = 'Relatório de Denúncias'
) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin

  // Cabeçalho
  doc.setFontSize(18)
  doc.setTextColor(1, 113, 123) // HSFA Primary
  doc.setFont('helvetica', 'bold')
  doc.text('Hospital São Francisco de Assis', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  doc.setFontSize(14)
  doc.setTextColor(46, 58, 85) // HSFA Secondary
  doc.setFont('helvetica', 'normal')
  doc.text(titulo, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 5
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 10

  // Estatísticas resumidas
  const stats = [
    ['Total de Denúncias', denuncias.length.toString()],
    ['Pendentes', denuncias.filter(d => d.status === 'Pendente').length.toString()],
    ['Em Análise', denuncias.filter(d => d.status === 'Em Análise').length.toString()],
    ['Concluídas', denuncias.filter(d => d.status === 'Concluída').length.toString()],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Estatística', 'Quantidade']],
    body: stats,
    theme: 'striped',
    headStyles: { fillColor: [1, 113, 123], textColor: 255 },
    margin: { top: yPos, left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Tabela principal de denúncias
  const dados = denuncias.map(denuncia => [
    denuncia.protocolo,
    format(new Date(denuncia.data_criacao), 'dd/MM/yyyy', { locale: ptBR }),
    denuncia.status,
    denuncia.prioridade,
    denuncia.categorias.join(', '),
    denuncia.descricao.substring(0, 50) + (denuncia.descricao.length > 50 ? '...' : ''),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Protocolo', 'Data', 'Status', 'Prioridade', 'Categorias', 'Descrição']],
    body: dados,
    theme: 'striped',
    headStyles: { fillColor: [1, 113, 123], textColor: 255 },
    margin: { top: yPos, left: margin, right: margin },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 50 },
    },
    didDrawPage: (data: any) => {
      // Rodapé em cada página
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(
        'Hospital São Francisco de Assis - R. 9-A, 110 - St. Aeroporto, Goiânia - GO, 74075-250',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
      doc.text(
        `Telefone: (62) 3221-8000 | E-mail: contato@hsfasaude.com.br | Página ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      )
    },
  })

  // Salvar PDF
  doc.save(nomeArquivo)
}

/**
 * Exporta uma denúncia individual para PDF (formulário confidencial)
 */
export function exportarDenunciaConfidencial(denuncia: DenunciaCompleta) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Cabeçalho com logo (espaço reservado)
  doc.setFillColor(1, 113, 123)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F')
  
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('Hospital São Francisco de Assis', pageWidth / 2, yPos + 8, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text('FORMULÁRIO CONFIDENCIAL DE DENÚNCIA', pageWidth / 2, yPos + 13, { align: 'center' })
  
  yPos += 25

  // Informações da denúncia
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('DADOS DA DENÚNCIA', margin, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  const dados = [
    ['Protocolo:', denuncia.protocolo],
    ['Data de Registro:', format(new Date(denuncia.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })],
    ['Status:', denuncia.status],
    ['Prioridade:', denuncia.prioridade],
    ['Categorias:', denuncia.categorias.join(', ') || 'Não informado'],
  ]

  dados.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 40, yPos)
    yPos += 6
  })

  yPos += 5

  // Descrição
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO DA DENÚNCIA:', margin, yPos)
  yPos += 6
  
  doc.setFont('helvetica', 'normal')
  const descricaoLines = doc.splitTextToSize(denuncia.descricao, pageWidth - 2 * margin)
  descricaoLines.forEach((line: string) => {
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }
    doc.text(line, margin, yPos)
    yPos += 5
  })

  yPos += 5

  // Dados adicionais
  if (denuncia.data_ocorrencia) {
    doc.setFont('helvetica', 'bold')
    doc.text('Data da Ocorrência:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(format(new Date(denuncia.data_ocorrencia), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), margin + 50, yPos)
    yPos += 6
  }

  if (denuncia.local_ocorrencia) {
    doc.setFont('helvetica', 'bold')
    doc.text('Local da Ocorrência:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const localLines = doc.splitTextToSize(denuncia.local_ocorrencia, pageWidth - 2 * margin - 50)
    localLines.forEach((line: string) => {
      doc.text(line, margin + 50, yPos)
      yPos += 5
    })
    yPos += 2
  }

  if (denuncia.pessoas_envolvidas) {
    doc.setFont('helvetica', 'bold')
    doc.text('Pessoas Envolvidas:', margin, yPos)
    yPos += 6
    doc.setFont('helvetica', 'normal')
    const pessoasLines = doc.splitTextToSize(denuncia.pessoas_envolvidas, pageWidth - 2 * margin)
    pessoasLines.forEach((line: string) => {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })
    yPos += 5
  }

  // Histórico
  if (denuncia.historico.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFont('helvetica', 'bold')
    doc.text('HISTÓRICO DE ATUALIZAÇÕES:', margin, yPos)
    yPos += 8

    denuncia.historico.forEach((h, index) => {
      if (yPos > pageHeight - 50) {
        doc.addPage()
        yPos = margin
      }

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${h.status_anterior ? `${h.status_anterior} → ` : ''}${h.status_novo}`, margin, yPos)
      yPos += 5
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(`Data: ${format(new Date(h.data_alteracao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, margin + 5, yPos)
      yPos += 4
      
      if (h.admin_nome) {
        doc.text(`Responsável: ${h.admin_nome}`, margin + 5, yPos)
        yPos += 4
      }
      
      if (h.observacao) {
        const obsLines = doc.splitTextToSize(`Observação: ${h.observacao}`, pageWidth - 2 * margin - 10)
        obsLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPos)
          yPos += 4
        })
      }
      
      yPos += 3
    })
  }

  // Conclusão
  if (denuncia.conclusao_descricao) {
    if (yPos > pageHeight - 60) {
      doc.addPage()
      yPos = margin
    }
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('CONCLUSÃO:', margin, yPos)
    yPos += 6
    
    doc.setFont('helvetica', 'normal')
    const conclusaoLines = doc.splitTextToSize(denuncia.conclusao_descricao, pageWidth - 2 * margin)
    conclusaoLines.forEach((line: string) => {
      if (yPos > pageHeight - 40) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      'Hospital São Francisco de Assis - R. 9-A, 110 - St. Aeroporto, Goiânia - GO, 74075-250',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      'Telefone: (62) 3221-8000 | E-mail: contato@hsfasaude.com.br | www.hsfasaude.com.br',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    )
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Este documento é CONFIDENCIAL e destinado exclusivamente ao uso interno. Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 2,
      { align: 'center' }
    )
  }

  doc.save(`denuncia-confidencial-${denuncia.protocolo}.pdf`)
}

