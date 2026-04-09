import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { login } from '@/lib/api/auth'
import type { User } from '@/types/database'
import { AlertCircle } from 'lucide-react'
import logoPNG from '@/assets/logos/logo.png'

const schema = z.object({
  usuario: z.string().min(1, 'Usuário é obrigatório'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface LoginProps {
  onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError(null)

    try {
      const user = await login(data.usuario, data.senha)
      onLogin(user)
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hsfa-soft to-hsfa-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-hsfa-lg p-8 max-w-md w-full border border-hsfa-muted">
        <div className="text-center mb-8">
          <img 
            src={logoPNG} 
            alt="HSFA - Hospital São Francisco de Assis" 
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-hsfa-primary mb-2">
            Acesso Administrativo
          </h1>
          <p className="text-hsfa-text-soft">
            Hospital São Francisco de Assis
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-hsfa-text-soft mb-2">
              Usuário
            </label>
            <input
              type="text"
              {...register('usuario')}
              className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
              placeholder="Digite seu usuário"
            />
            {errors.usuario && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.usuario.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-hsfa-text-soft mb-2">
              Senha
            </label>
            <input
              type="password"
              {...register('senha')}
              className="w-full px-4 py-2 border-2 border-hsfa-muted rounded-lg focus:ring-2 focus:ring-hsfa-primary focus:border-hsfa-primary transition-colors"
              placeholder="Digite sua senha"
            />
            {errors.senha && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.senha.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-hsfa-primary text-white py-3 px-4 rounded-lg hover:bg-hsfa-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

