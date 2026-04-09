export default function Footer() {
  return (
    <footer className="bg-hsfa-secondary text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Hospital São Francisco de Assis</h3>
            <p className="text-sm text-hsfa-soft">
              Sistema de Canal de Denúncias
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm text-hsfa-soft">
              <li><a href="https://hsfasaude.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Site Oficial</a></li>
              <li><a href="/nova-denuncia" className="hover:text-white transition-colors">Nova Denúncia</a></li>
              <li><a href="/consultar" className="hover:text-white transition-colors">Consultar Denúncia</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <p className="text-sm text-hsfa-soft">
              Para mais informações, acesse nosso site oficial.
            </p>
          </div>
        </div>
        <div className="border-t border-hsfa-secondary-light mt-8 pt-6 text-center text-sm text-hsfa-soft">
          <p>© {new Date().getFullYear()} Hospital São Francisco de Assis. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

