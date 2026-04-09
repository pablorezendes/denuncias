import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { criarDenuncia } from '@/lib/api/denuncias'
import { listarCategorias } from '@/lib/api/denuncias'
import type { Categoria } from '@/types/database'
import { ArrowLeft, CheckCircle, Upload, X, FileText } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const schema = z.object({
  descricao: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  categorias: z.array(z.number()).min(1, 'Selecione pelo menos uma categoria'),
  data_ocorrencia: z.string().optional(),
  local_ocorrencia: z.string().optional(),
  pessoas_envolvidas: z.string().optional(),
  anexos: z.array(z.instanceof(File)).optional(),
})

type FormData = z.infer<typeof schema>

export default function NovaDenuncia() {
  const navigate = useNavigate()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [protocolo, setProtocolo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [anexos, setAnexos] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      categorias: [],
    },
  })

  const categoriasSelecionadas = watch('categorias') || []
  
  // Função para atualizar categorias quando checkbox é clicado
  function handleCategoriaChange(categoriaId: number, checked: boolean) {
    const current = categoriasSelecionadas;
    if (checked) {
      setValue('categorias', [...current, categoriaId], { shouldValidate: true });
    } else {
      setValue('categorias', current.filter(id => id !== categoriaId), { shouldValidate: true });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      
      if (file.size > maxSize) {
        alert(`Arquivo ${file.name} é muito grande. Tamanho máximo: 10MB`)
        return false
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipo de arquivo não permitido para ${file.name}. Use: JPG, PNG ou PDF`)
        return false
      }
      
      return true
    })
    
    setAnexos(prev => [...prev, ...validFiles])
  }

  function removeAnexo(index: number) {
    setAnexos(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    loadCategorias()
  }, [])

  async function loadCategorias() {
    try {
      const data = await listarCategorias()
      setCategorias(data)
    } catch (err) {
      setError('Erro ao carregar categorias')
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const novoProtocolo = await criarDenuncia({
        descricao: data.descricao,
        categorias: data.categorias,
        data_ocorrencia: data.data_ocorrencia || undefined,
        local_ocorrencia: data.local_ocorrencia || undefined,
        pessoas_envolvidas: data.pessoas_envolvidas || undefined,
        anexos: anexos.length > 0 ? anexos : undefined,
      })
      setProtocolo(novoProtocolo)
      setAnexos([]) // Limpar anexos após sucesso
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar denúncia')
    } finally {
      setLoading(false)
    }
  }

  if (protocolo) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-hsfa-soft to-hsfa-bg">
        <Header showNav={false} />
        
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white rounded-xl shadow-hsfa-lg p-8 max-w-md w-full border border-hsfa-muted">
            <div className="text-center">
              <div className="bg-hsfa-success-light w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-hsfa-success" />
              </div>
              <h2 className="text-2xl font-bold text-hsfa-primary mb-4">
                Denúncia Registrada!
              </h2>
              <p className="text-hsfa-text-soft mb-6">
                Sua denúncia foi registrada com sucesso. Guarde o protocolo abaixo para acompanhar o status.
              </p>
              <div className="bg-hsfa-soft border-2 border-hsfa-primary rounded-lg p-4 mb-6">
                <p className="text-sm text-hsfa-text-soft mb-1">Protocolo</p>
                <p className="text-2xl font-bold text-hsfa-primary">{protocolo}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/consultar?protocolo=${protocolo}`)}
                  className="w-full bg-hsfa-primary text-white py-3 px-4 rounded-lg hover:bg-hsfa-primary-dark transition-colors font-semibold"
                >
                  Consultar Status
                </button>
                <button
                  onClick={() => {
                    setProtocolo(null)
                    navigate('/')
                  }}
                  className="w-full bg-hsfa-bg-soft text-hsfa-text-soft py-3 px-4 rounded-lg hover:bg-hsfa-muted transition-colors font-semibold"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-hsfa-soft to-hsfa-bg">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-hsfa-primary hover:text-hsfa-primary-dark mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>

          <div className="bg-white rounded-xl shadow-hsfa-lg p-8 border border-hsfa-muted">
            <h1 className="text-3xl font-bold text-hsfa-primary mb-6">
              Nova Denúncia
            </h1>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Descrição da Denúncia <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('descricao')}
                rows={6}
                className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                placeholder="Descreva detalhadamente a ocorrência..."
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.descricao.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Categorias <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categorias.map((categoria) => (
                  <label
                    key={categoria.id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      categoriasSelecionadas?.includes(categoria.id)
                        ? 'border-hsfa-primary bg-hsfa-soft shadow-sm'
                        : 'border-hsfa-muted hover:border-hsfa-primary-light hover:bg-hsfa-soft'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={categoria.id}
                      checked={categoriasSelecionadas?.includes(categoria.id) || false}
                      onChange={(e) => handleCategoriaChange(categoria.id, e.target.checked)}
                      className="mr-2"
                    />
                    <span className={`text-sm font-medium ${
                      categoriasSelecionadas?.includes(categoria.id)
                        ? 'text-hsfa-primary'
                        : 'text-hsfa-text-soft'
                    }`}>{categoria.nome}</span>
                  </label>
                ))}
              </div>
              {errors.categorias && (
                <p className="mt-1 text-sm text-red-600">{errors.categorias.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Data da Ocorrência
                </label>
                <input
                  type="date"
                  {...register('data_ocorrencia')}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                  Local da Ocorrência
                </label>
                <input
                  type="text"
                  {...register('local_ocorrencia')}
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                  placeholder="Ex: Setor X, Sala Y"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Pessoas Envolvidas (opcional)
              </label>
              <textarea
                {...register('pessoas_envolvidas')}
                rows={3}
                className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                placeholder="Descreva as pessoas envolvidas, se aplicável..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Anexos (opcional)
              </label>
              <div className="border-2 border-dashed border-hsfa-muted rounded-lg p-6 hover:border-hsfa-primary transition-colors">
                <input
                  type="file"
                  id="anexos"
                  multiple
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="anexos"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-hsfa-primary mb-2" />
                  <span className="text-sm text-hsfa-text-soft">
                    Clique para selecionar arquivos ou arraste aqui
                  </span>
                  <span className="text-xs text-hsfa-text-soft mt-1">
                    Formatos aceitos: JPG, PNG, PDF (máx. 10MB cada)
                  </span>
                </label>
              </div>

              {anexos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {anexos.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-hsfa-bg-soft p-3 rounded-lg border border-hsfa-muted"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-hsfa-primary" />
                        <span className="text-sm text-hsfa-text-soft font-medium">{file.name}</span>
                        <span className="text-xs text-hsfa-text-soft">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnexo(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-hsfa-primary text-white py-3 px-6 rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
              >
                {loading ? 'Registrando...' : 'Registrar Denúncia'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border-2 border-hsfa-muted rounded-lg hover:bg-hsfa-bg-soft transition-colors font-semibold text-hsfa-text-soft"
              >
                Cancelar
              </button>
            </div>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

