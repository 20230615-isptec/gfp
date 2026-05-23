# FinanSmart - Documento de Especificacao de Frontend para Stitch

## 1. Objetivo
Criar um novo frontend de alta qualidade para o sistema FinanSmart (gestao financeira pessoal), mantendo todas as funcionalidades atuais e melhorando significativamente a experiencia visual e de uso.

Este documento deve ser usado como base de implementacao na Stitch.

## 2. Contexto do Produto
- Nome do produto: FinanSmart
- Tipo: Aplicacao web de gestao financeira pessoal
- Perfis de utilizador:
  - Utilizador comum
  - Administrador
- Idiomas:
  - Portugues (padrao)
  - Ingles (alternancia no frontend)
- Tema:
  - Claro/Escuro com alternancia manual

## 3. Stack Atual (Referencia)
- Frontend atual: Angular 17 (SPA)
- Backend: PHP REST API
- Autenticacao: JWT (Bearer token)
- Estado de sessao:
  - `token` salvo no localStorage
  - `user` salvo no localStorage

## 4. Requisitos Globais de UX/UI
- Layout responsivo desktop/tablet/mobile
- Navegacao clara por papel (utilizador vs admin)
- Estados visuais obrigatorios em todas as telas:
  - carregamento
  - sucesso
  - erro
  - vazio (sem dados)
- Formularios com validacao em tempo real
- Feedback de acoes (loading em botoes, mensagens de erro/sucesso)
- Design system consistente:
  - tipografia
  - escala de espacamento
  - componentes reutilizaveis (cards, tabela, modal, inputs, badges, botoes)

## 5. Mapa de Rotas/Paginas
- Publicas:
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password?token=...`
- Privadas (requer login):
  - `/dashboard`
  - `/transacoes`
  - `/categorias`
  - `/admin` (somente admin)
- Redirecionamentos:
  - `/` -> `/dashboard`
  - rota invalida -> `/dashboard`
  - sem token valido -> `/login`

## 6. Layout Base da Aplicacao
### 6.1 Estrutura
- Sidebar fixa no desktop (quando logado)
- Topbar com titulo da pagina e acoes globais
- Menu mobile (drawer) + navegacao inferior no mobile
- Area principal com conteudo da rota

### 6.2 Navegacao por Perfil
- Utilizador comum:
  - Dashboard
  - Transacoes
  - Categorias
- Admin:
  - Administracao

### 6.3 Acoes Globais
- Alternar idioma (PT/EN)
- Alternar tema (claro/escuro)
- Exportar CSV
  - Utilizador: extrato financeiro
  - Admin: lista de utilizadores
- Logout

## 7. Paginas e Funcionalidades Detalhadas

## 7.1 Login (`/login`)
### Objetivo
Permitir autenticacao de utilizadores existentes.

### Componentes
- Formulario com:
  - Email
  - Senha
- Botao entrar
- Link "Esqueceu a senha?"
- Link para registo
- Seletor de idioma

### Regras de validacao
- Email obrigatorio e valido
- Senha obrigatoria, minimo 6 caracteres

### Comportamento
- Em sucesso:
  - guardar token e dados do utilizador
  - redirecionar:
    - admin -> `/admin`
    - utilizador -> `/dashboard`
- Em erro:
  - mostrar mensagem retornada pela API ou mensagem padrao

## 7.2 Registo (`/register`)
### Objetivo
Criar nova conta de utilizador.

### Componentes
- Formulario com:
  - Nome completo
  - Email
  - Senha
  - Confirmar senha
- Botao de criar conta
- Link para login
- Seletor de idioma

### Regras de validacao
- Nome obrigatorio (minimo 3 caracteres)
- Email obrigatorio e valido
- Senha obrigatoria (minimo 6 caracteres)
- Confirmacao obrigatoria
- Senha e confirmacao devem coincidir

### Comportamento
- Em sucesso:
  - login automatico (token salvo)
  - redirecionar para `/dashboard`
- Em erro:
  - mostrar mensagem da API/padrao

## 7.3 Recuperar Senha (`/forgot-password`)
### Objetivo
Solicitar envio de link/token para redefinicao.

### Componentes
- Formulario com email
- Botao enviar
- Link voltar para login

### Validacao
- Email obrigatorio e valido

### Comportamento
- Em sucesso: mostrar mensagem de confirmacao
- Em erro: mostrar mensagem de erro

## 7.4 Redefinir Senha (`/reset-password?token=...`)
### Objetivo
Definir nova senha usando token da URL.

### Componentes
- Formulario com:
  - Nova senha
  - Confirmar senha
- Botao atualizar senha
- Link voltar para login

### Validacao
- Token obrigatorio na query string
- Nova senha obrigatoria (minimo 8 caracteres)
- Confirmacao obrigatoria
- Senhas devem coincidir

### Comportamento
- Em sucesso: mostrar mensagem de sucesso
- Em erro: mostrar mensagem da API/padrao

## 7.5 Dashboard (`/dashboard`)
### Objetivo
Exibir resumo financeiro, cotacoes, ultimas transacoes e acoes rapidas.

### Blocos da pagina
- Cabecalho de boas-vindas com nome do utilizador
- Cards de resumo:
  - Saldo atual
  - Total receitas
  - Total despesas
- Widget de cambio/conversao de saldo:
  - saldo convertido para USD/EUR quando cotacoes disponiveis
- Widget de acoes rapidas:
  - Exportar CSV
  - Recarregar dados
  - Ir para transacoes
- Lista de transacoes recentes (ultimas 5)
- Estado vazio para quando nao houver movimentacoes

### Comportamento de dados
- Carrega em paralelo:
  - resumo do dashboard
  - lista de transacoes
  - lista de categorias
- Mapeia `categoria_id` -> nome da categoria
- Formata moeda e datas

## 7.6 Transacoes (`/transacoes`)
### Objetivo
Gerir transacoes financeiras (CRUD completo) e exportacao de relatorio.

### Blocos da pagina
- Header com titulo/subtitulo
- Acoes:
  - Exportar relatorio
  - Nova transacao
- Lista de transacoes com:
  - Descricao
  - Data
  - Categoria
  - Tipo (receita/despesa)
  - Valor
  - Acoes editar/excluir
- Modal de formulario (criar/editar)

### Formulario de transacao
Campos:
- Categoria (select)
- Tipo (receita ou despesa)
- Valor
- Data
- Descricao

Validacoes:
- Categoria obrigatoria
- Tipo obrigatorio
- Valor obrigatorio e >= 0.01
- Data obrigatoria
- Descricao obrigatoria (minimo 3)

### Acoes
- Criar transacao
- Editar transacao
- Excluir com confirmacao
- Exportar CSV de transacoes

## 7.7 Categorias (`/categorias`)
### Objetivo
Gerir categorias financeiras (CRUD completo).

### Blocos da pagina
- Header com titulo/subtitulo
- Acao "Nova categoria"
- Lista de categorias com:
  - Nome
  - Tipo (receita/despesa)
  - Acoes editar/excluir
- Modal de formulario (criar/editar)

### Formulario de categoria
Campos:
- Nome
- Tipo (receita/despesa)

Validacoes:
- Nome obrigatorio (minimo 3, maximo 50)
- Tipo obrigatorio

### Acoes
- Criar categoria
- Editar categoria
- Excluir com confirmacao

## 7.8 Administracao (`/admin`)
### Objetivo
Painel de administracao de utilizadores.

### Regras de acesso
- Apenas utilizadores admin
- Se nao for admin, redirecionar para `/dashboard`

### Blocos da pagina
- Header com titulo/subtitulo e botao atualizar
- Card de metrica (total de utilizadores)
- Tabela de utilizadores com colunas:
  - ID
  - Nome
  - Email
  - Tipo de utilizador
  - Data de criacao
  - Acoes

### Acoes por utilizador
- Alternar tipo:
  - Utilizador -> Admin
  - Admin -> Utilizador
- Excluir utilizador
- Restricao:
  - admin logado nao pode remover a si mesmo
  - admin logado nao pode alterar o proprio tipo

## 8. Contratos de API (para integracao do frontend)
Base URL: `http://localhost/gfp/backend/api`

## 8.1 Auth
- `POST /auth/register`
  - body: `{ nome, email, senha }`
- `POST /auth/login`
  - body: `{ email, senha }`
- `POST /auth/forgot-password`
  - body: `{ email }`
- `POST /auth/reset-password`
  - body: `{ token, new_password }`

## 8.2 Dashboard
- `GET /dashboard`
  - retorno esperado inclui:
    - `resumo` (receitas, despesas, saldo_atual, total_transacoes)
    - `cotacoes_atuais`
    - `data_atualizacao`

## 8.3 Transacoes
- `GET /transacoes`
- `POST /transacoes`
- `PUT /transacoes?id={id}`
- `DELETE /transacoes?id={id}`

Modelo transacao:
- `id?`
- `categoria_id`
- `valor`
- `tipo` (`receita` | `despesa`)
- `data`
- `descricao`

## 8.4 Categorias
- `GET /categorias`
- `POST /categorias`
- `PUT /categorias?id={id}`
- `DELETE /categorias?id={id}`

Modelo categoria:
- `id?`
- `nome`
- `tipo` (`receita` | `despesa`)

## 8.5 Exportacao
- `GET /exportar/csv` (utilizador)
- `GET /admin/exportar/usuarios` (admin)

## 8.6 Admin
- `GET /admin/utilizadores`
- `PUT /admin/utilizadores?id={id}` body `{ tipo_usuario_id }`
- `DELETE /admin/utilizadores?id={id}`
- `PUT /admin/utilizadores/bloquear?id={id}&ativo={0|1}`

## 9. Regras Tecnicas de Autenticacao
- Enviar token JWT no header:
  - `Authorization: Bearer <token>`
- Em erro 401:
  - limpar sessao local
  - redirecionar para login
- Rotas privadas exigem token valido

## 10. Estados por Pagina (Checklist obrigatoria)
Para cada tela, implementar:
- Loading skeleton/spinner
- Estado de erro com CTA de tentativa novamente (quando aplicavel)
- Estado vazio com CTA principal
- Estado de sucesso com feedback claro

## 11. Requisitos de Qualidade Visual (pedido do cliente)
- Visual "fantastico", moderno e premium
- Hierarquia visual forte
- Alto contraste e legibilidade
- Microinteracoes suaves (hover, focus, transicoes)
- Componentes com acabamento refinado:
  - cards
  - tabelas
  - modais
  - formularios
- Responsividade impecavel no mobile

## 12. Entregaveis esperados da Stitch
- Proposta de novo design completo
- Componentizacao por pagina
- Fluxos de navegacao consistentes
- UI kit minimo (cores, tipografia, botoes, inputs, cards, badges)
- Implementacao de todas as telas listadas neste documento
- Preparado para integrar com as APIs informadas

## 13. Prioridade de Implementacao
1. Base de layout global (sidebar/topbar/mobile nav + tema + idioma)
2. Auth (login, registo, recuperar/redefinir senha)
3. Dashboard
4. Transacoes (CRUD + exportacao)
5. Categorias (CRUD)
6. Admin

## 14. Observacoes Finais
- O backend ja existe e esta funcional.
- O foco principal e reconstruir o frontend com qualidade superior sem perder funcionalidades.
- Onde houver duvida de UX, priorizar clareza, velocidade de uso e consistencia entre telas.
