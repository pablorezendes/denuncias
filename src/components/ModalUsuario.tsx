import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save, Eye, EyeOff } from 'lucide-react'
import { criarUsuario, atualizarUsuario, listarRoles, buscarUsuarioPorId } from '@/lib/api/users'
import type { Role } from '@/types/database'

interface ModalUsuarioProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  usuarioId?: number | null
}

// Schema de validação para criar usuário
const criarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  usuario: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  ativo: z.boolean().default(true),
  roles: z.array(z.number()).min(1, 'Selecione pelo menos um perfil'),
})

// Schema de validação para editar usuário (senha opcional)
const editarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  usuario: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  ativo: z.boolean().default(true),
  roles: z.array(z.number()).min(1, 'Selecione pelo menos um perfil'),
})

type CriarFormData = z.infer<typeof criarSchema>
type EditarFormData = z.infer<typeof editarSchema>

export default function ModalUsuario({ isOpen, onClose, onSuccess, usuarioId }: ModalUsuarioProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const isEdit = !!usuarioId

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CriarFormData | EditarFormData>({
    resolver: zodResolver(isEdit ? editarSchema : criarSchema),
    defaultValues: {
      nome: '',
      email: '',
      usuario: '',
      senha: '',
      ativo: true,
      roles: [],
    },
  })

  const rolesSelecionados = watch('roles') || []

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      if (isEdit && usuarioId) {
        loadUsuario()
      } else {
        reset({
          nome: '',
          email: '',
          usuario: '',
          senha: '',
          ativo: true,
          roles: [],
        })
      }
    }
  }, [isOpen, usuarioId, isEdit])

  async function loadRoles() {
    setLoadingRoles(true)
    try {
      const data = await listarRoles()
      setRoles(data)
    } catch (err: any) {
      setError(`Erro ao carregar perfis: ${err.message}`)
    } finally {
      setLoadingRoles(false)
    }
  }

  async function loadUsuario() {
    if (!usuarioId) return

    setLoading(true)
    setError(null)
    try {
      const usuario = await buscarUsuarioPorId(usuarioId)
      if (usuario) {
        reset({
          nome: usuario.nome,
          email: usuario.email,
          usuario: usuario.usuario,
          senha: '', // Não preencher senha ao editar
          ativo: usuario.ativo,
          roles: usuario.roles?.map((r: any) => r.id) || [],
        })
      }
    } catch (err: any) {
      setError(`Erro ao carregar usuário: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  function handleRoleChange(roleId: number, checked: boolean) {
    const current = rolesSelecionados
    if (checked) {
      setValue('roles', [...current, roleId], { shouldValidate: true })
    } else {
      setValue('roles', current.filter(id => id !== roleId), { shouldValidate: true })
    }
  }

  async function onSubmit(data: CriarFormData | EditarFormData) {
    setLoading(true)
    setError(null)

    try {
      if (isEdit && usuarioId) {
        // Editar usuário
        const updateData: any = {
          nome: data.nome,
          email: data.email,
          usuario: data.usuario,
          ativo: data.ativo,
        }

        // Só atualizar senha se foi preenchida
        if (data.senha && data.senha.length > 0) {
          // TODO: Hash da senha deve ser feito via Edge Function
          // Por enquanto, vamos apenas atualizar os outros campos
          // A senha será atualizada separadamente via Edge Function
          updateData.senha = data.senha
        }

        await atualizarUsuario(usuarioId, {
          ...updateData,
          roles: data.roles,
        })
      } else {
        // Criar usuário
        if (!data.senha || data.senha.length === 0) {
          setError('Senha é obrigatória para criar novo usuário')
          setLoading(false)
          return
        }
        await criarUsuario({
          nome: data.nome,
          email: data.email,
          usuario: data.usuario,
          senha: data.senha,
          ativo: data.ativo,
          roles: data.roles,
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-hsfa-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-hsfa-muted">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-hsfa-muted px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-hsfa-primary">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-hsfa-text-soft hover:text-hsfa-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-hsfa-secondary mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nome')}
                type="text"
                id="nome"
                className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                placeholder="Digite o nome completo"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.nome.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-hsfa-secondary mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                placeholder="usuario@exemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Usuário */}
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-hsfa-secondary mb-2">
                Usuário (Login) <span className="text-red-500">*</span>
              </label>
              <input
                {...register('usuario')}
                type="text"
                id="usuario"
                className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
                placeholder="nomeusuario"
              />
              {errors.usuario && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.usuario.message}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-hsfa-secondary mb-2">
                Senha {isEdit ? '(deixe em branco para manter a atual)' : ''} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  {...register('senha')}
                  type={showPassword ? 'text' : 'password'}
                  id="senha"
                  className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors pr-10"
                  placeholder={isEdit ? 'Nova senha (opcional)' : 'Digite a senha'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-hsfa-text-soft hover:text-hsfa-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.senha && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.senha.message}</p>
              )}
            </div>

            {/* Perfis/Roles */}
            <div>
              <label className="block text-sm font-medium text-hsfa-secondary mb-2">
                Perfis <span className="text-red-500">*</span>
              </label>
              {loadingRoles ? (
                <div className="text-hsfa-text-soft">Carregando perfis...</div>
              ) : roles.length === 0 ? (
                <div className="text-hsfa-text-soft">Nenhum perfil disponível</div>
              ) : (
                <div className="space-y-2 border-2 border-hsfa-muted rounded-lg p-4 max-h-48 overflow-y-auto">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-3 cursor-pointer hover:bg-hsfa-bg-soft p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={rolesSelecionados.includes(role.id)}
                        onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                        className="mt-1 w-4 h-4 text-hsfa-primary border-hsfa-muted rounded focus:ring-hsfa-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-hsfa-text">{role.nome}</div>
                        {role.descricao && (
                          <div className="text-sm text-hsfa-text-soft">{role.descricao}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.roles && (
                <p className="mt-1 text-sm text-red-600 font-medium">{errors.roles.message}</p>
              )}
            </div>

            {/* Status Ativo */}
            <div className="flex items-center gap-3">
              <input
                {...register('ativo')}
                type="checkbox"
                id="ativo"
                className="w-4 h-4 text-hsfa-primary border-hsfa-muted rounded focus:ring-hsfa-primary"
              />
              <label htmlFor="ativo" className="text-sm font-medium text-hsfa-secondary cursor-pointer">
                Usuário ativo
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-hsfa-muted">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border-2 border-hsfa-muted text-hsfa-text rounded-lg hover:bg-hsfa-bg-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-hsfa-primary text-white rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

