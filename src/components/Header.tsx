import { Link } from 'react-router-dom'
import logoPNG from '@/assets/logos/logo.png'

interface HeaderProps {
  showNav?: boolean
}

export default function Header({ showNav = true }: HeaderProps) {
  return (
    <header className="bg-hsfa-secondary text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <img 
              src={logoPNG} 
              alt="HSFA - Hospital São Francisco de Assis" 
              className="h-12 w-auto object-contain"
            />
          </Link>
          
          {showNav && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="hover:text-hsfa-soft transition-colors">
                Início
              </Link>
              <Link to="/nova-denuncia" className="hover:text-hsfa-soft transition-colors">
                Nova Denúncia
              </Link>
              <Link to="/consultar" className="hover:text-hsfa-soft transition-colors">
                Consultar
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

