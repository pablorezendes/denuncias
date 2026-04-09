import { Link } from 'react-router-dom'
import { FileText, Search, Shield } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-hsfa-soft to-hsfa-bg">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-hsfa-primary rounded-full mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-hsfa-primary mb-4">
              Canal de Denúncias
            </h1>
            <p className="text-xl text-hsfa-text-soft mb-2">
              Hospital São Francisco de Assis
            </p>
            <p className="text-lg text-hsfa-text-soft mb-12">
              Sistema seguro e confidencial para registro e acompanhamento de denúncias
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <Link
              to="/nova-denuncia"
              className="bg-white rounded-xl shadow-hsfa p-8 hover:shadow-hsfa-lg transition-all group border border-hsfa-muted hover:border-hsfa-primary"
            >
              <div className="bg-hsfa-soft w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-hsfa-primary transition-colors">
                <FileText className="w-8 h-8 text-hsfa-primary group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-hsfa-primary mb-2">
                Nova Denúncia
              </h2>
              <p className="text-hsfa-text-soft">
                Registre uma nova denúncia de forma anônima e segura
              </p>
            </Link>

            <Link
              to="/consultar"
              className="bg-white rounded-xl shadow-hsfa p-8 hover:shadow-hsfa-lg transition-all group border border-hsfa-muted hover:border-hsfa-primary"
            >
              <div className="bg-hsfa-soft w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-hsfa-primary transition-colors">
                <Search className="w-8 h-8 text-hsfa-primary group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-hsfa-primary mb-2">
                Consultar Denúncia
              </h2>
              <p className="text-hsfa-text-soft">
                Acompanhe o status da sua denúncia usando o protocolo
              </p>
            </Link>
          </div>

          <div className="mt-16 bg-white rounded-xl shadow-hsfa p-8 text-left border border-hsfa-muted">
            <h3 className="text-2xl font-semibold text-hsfa-primary mb-6">
              Como funciona?
            </h3>
            <ol className="space-y-4 text-hsfa-text-soft">
              <li className="flex items-start">
                <span className="bg-hsfa-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4 font-semibold">
                  1
                </span>
                <div>
                  <strong className="text-hsfa-primary">Registre sua denúncia:</strong> Preencha o formulário com os detalhes da ocorrência
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-hsfa-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4 font-semibold">
                  2
                </span>
                <div>
                  <strong className="text-hsfa-primary">Receba um protocolo:</strong> Um código único será gerado para acompanhamento
                </div>
              </li>
              <li className="flex items-start">
                <span className="bg-hsfa-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4 font-semibold">
                  3
                </span>
                <div>
                  <strong className="text-hsfa-primary">Acompanhe o status:</strong> Use o protocolo para verificar o andamento da análise
                </div>
              </li>
            </ol>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

