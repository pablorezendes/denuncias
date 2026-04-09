import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import type { User } from '@/types/database'
import { Plus, Edit, Trash2, User as UserIcon } from 'lucide-react'
import { listarUsuarios, removerUsuario } from '@/lib/api/users'
import ModalUsuario from '@/components/ModalUsuario'

interface ListarUsuariosProps {
  user: User
  onLogout: () => void
}

interface UsuarioCompleto {
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
  roles: Array<{ id: number; nome: string; descricao: string | null }>
}

export default function GerenciarUsuarios({ user, onLogout }: ListarUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)

  useEffect(() => {
    loadUsuarios()
  }, [])

  async function loadUsuarios() {
    setLoading(true)
    setError(null)
    try {
      const data = await listarUsuarios()
      setUsuarios(data as UsuarioCompleto[])
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  async function handleExcluir(userId: number, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setDeletingId(userId)
    setError(null)

    try {
      await removerUsuario(userId)
      await loadUsuarios()
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir usuário')
    } finally {
      setDeletingId(null)
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
                  Gerenciar Usuários
                </h1>
                <p className="text-sm text-hsfa-text-soft mt-1">
                  Crie, edite e gerencie usuários e suas permissões
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null)
                  setShowModal(true)
                }}
                className="flex items-center gap-2 bg-hsfa-primary text-white px-4 py-2 rounded-lg hover:bg-hsfa-primary-dark transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Novo Usuário
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

          {loading ? (
          <div className="text-center py-12">
            <div className="text-hsfa-text-soft">Carregando usuários...</div>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="bg-white rounded-xl shadow-hsfa-lg p-12 text-center border border-hsfa-muted">
            <p className="text-hsfa-text-soft">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-hsfa-lg overflow-hidden border border-hsfa-muted">
            <table className="min-w-full divide-y divide-hsfa-muted">
              <thead className="bg-hsfa-bg-soft">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Perfis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Último Acesso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-hsfa-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-hsfa-muted">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-hsfa-bg-soft">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-hsfa-soft w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="w-5 h-5 text-hsfa-primary" />
                        </div>
                        <div className="text-sm font-medium text-hsfa-text">
                          {usuario.nome}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-hsfa-text">
                        {usuario.usuario}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-hsfa-text">
                        {usuario.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles && usuario.roles.length > 0 ? (
                          usuario.roles.map((role) => (
                            <span
                              key={role.id}
                              className="bg-hsfa-soft text-hsfa-primary px-2 py-1 rounded text-xs font-medium border border-hsfa-primary"
                            >
                              {role.nome}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-hsfa-text-soft">Sem perfil</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.ativo
                            ? 'bg-hsfa-success-claro text-hsfa-success'
                            : 'bg-hsfa-error-claro text-hsfa-error'
                        }`}
                      >
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-hsfa-text">
                        {usuario.ultimo_acesso
                          ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingUserId(usuario.id)
                            setShowModal(true)
                          }}
                          className="text-hsfa-primary hover:text-hsfa-primary-dark"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluir(usuario.id, usuario.nome)}
                          disabled={deletingId === usuario.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Modal de Criar/Editar Usuário */}
          <ModalUsuario
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setEditingUserId(null)
            }}
            onSuccess={() => {
              loadUsuarios()
              setShowModal(false)
              setEditingUserId(null)
            }}
            usuarioId={editingUserId}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

