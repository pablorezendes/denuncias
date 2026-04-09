# Canal de Denúncias - React + Supabase

Sistema de gerenciamento de denúncias recriado em React com TypeScript e Supabase.

## Tecnologias

- **React 18** com TypeScript
- **Vite** como bundler
- **Supabase** como backend (PostgreSQL)
- **React Router** para navegação
- **React Hook Form** + **Zod** para validação de formulários
- **Tailwind CSS** para estilização
- **date-fns** para manipulação de datas
- **Lucide React** para ícones

## Estrutura do Projeto

```
react-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts          # Cliente Supabase
│   │   └── api/
│   │       ├── auth.ts          # Funções de autenticação
│   │       └── denuncias.ts     # Funções de denúncias
│   ├── pages/
│   │   ├── Home.tsx             # Página inicial
│   │   ├── NovaDenuncia.tsx     # Formulário de nova denúncia
│   │   ├── ConsultarDenuncia.tsx # Consulta por protocolo
│   │   └── admin/
│   │       ├── Login.tsx        # Login administrativo
│   │       ├── Dashboard.tsx     # Dashboard admin
│   │       ├── ListarDenuncias.tsx # Lista de denúncias
│   │       └── VisualizarDenuncia.tsx # Visualizar/editar denúncia
│   ├── types/
│   │   └── database.ts          # Tipos TypeScript
│   ├── App.tsx                  # Componente principal
│   └── main.tsx                 # Entry point
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## Funcionalidades

### Públicas
- ✅ Página inicial com informações sobre o sistema
- ✅ Formulário para registro de nova denúncia
- ✅ Consulta de denúncia por protocolo
- ✅ Visualização do histórico de atualizações

### Administrativas
- ✅ Login de administradores
- ✅ Dashboard com visão geral
- ✅ Listagem de denúncias com filtros
- ✅ Visualização detalhada de denúncias
- ✅ Atualização de status de denúncias
- ✅ Histórico de alterações

## Banco de Dados

O banco de dados já está configurado no Supabase com as seguintes tabelas:

- `denuncias` - Denúncias registradas
- `categorias` - Categorias de denúncias
- `denuncia_categoria` - Relação muitos-para-muitos
- `historico_status` - Histórico de mudanças de status
- `users` - Usuários administrativos
- `roles` - Papéis de usuários
- `permissions` - Permissões do sistema
- `user_role` - Relação usuário-papel
- `role_permission` - Relação papel-permissão
- `respostas` - Respostas às denúncias
- `anexos` - Anexos das denúncias

## Próximos Passos

- [ ] Implementar upload de arquivos para anexos
- [ ] Adicionar sistema de notificações
- [ ] Criar relatórios e estatísticas
- [ ] Implementar sistema completo de permissões
- [ ] Adicionar testes unitários e de integração
- [ ] Implementar RLS (Row Level Security) no Supabase

## Notas Importantes

⚠️ **Autenticação**: A autenticação atual é uma implementação básica. Em produção, recomenda-se:
- Usar Supabase Auth para autenticação segura
- Implementar verificação de senha no backend (Edge Functions)
- Adicionar proteção contra ataques de força bruta

⚠️ **Segurança**: Configure RLS (Row Level Security) no Supabase para proteger os dados.

