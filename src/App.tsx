import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import NovaDenuncia from './pages/NovaDenuncia'
import ConsultarDenuncia from './pages/ConsultarDenuncia'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ListarDenuncias from './pages/admin/ListarDenuncias'
import VisualizarDenuncia from './pages/admin/VisualizarDenuncia'
import GerenciarUsuarios from './pages/admin/GerenciarUsuarios'
import Relatorios from './pages/admin/Relatorios'
import type { User } from './types/database'
import { getCurrentUser, logout as apiLogout } from './lib/api/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaura a sessão a partir do JWT guardado em sessionStorage
    let cancelled = false
    getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
  }

  const handleLogout = () => {
    apiLogout().finally(() => setUser(null))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/nova-denuncia" element={<NovaDenuncia />} />
        <Route path="/consultar" element={<ConsultarDenuncia />} />

        {/* Rotas administrativas */}
        <Route
          path="/admin/login"
          element={
            user ? <Navigate to="/admin/dashboard" replace /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />
        <Route
          path="/admin/denuncias"
          element={
            user ? <ListarDenuncias user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />
        <Route
          path="/admin/denuncias/:protocolo"
          element={
            user ? <VisualizarDenuncia user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            user ? <GerenciarUsuarios user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            user ? <Relatorios user={user} onLogout={handleLogout} /> : <Navigate to="/admin/login" replace />
          }
        />

        {/* Catch-all: qualquer rota desconhecida volta para a Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
