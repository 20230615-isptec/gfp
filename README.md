# Sistema de Gestão Financeira Pessoal

Aplicação web para controlo de finanças pessoais com backend em PHP puro e frontend em Angular.

## O que o projeto cobre

- autenticação
- dashboard financeiro
- transações e categorias
- orçamentos e metas
- recorrências
- relatórios
- notificações
- perfil com idioma e tema

## Estrutura

```text
backend/
  config/
  src/
    Controllers/
    Services/
    Repositories/
    Models/
  index.php

frontend/
  src/
    app/
      core/
      layout/
      shared/
      features/
    environments/
```

## Requisitos

- XAMPP ou equivalente com Apache e MySQL
- PHP compatível com o backend
- Node.js e npm

## Como executar

### Backend

1. Copia o projeto para `C:\xampp\htdocs\gfp`.
2. Cria a base de dados no MySQL.
3. Importa `backend/database.sql`.
4. Se necessário, importa também `backend/database_updates.sql`.
5. Ajusta `backend/config/database.php` com as credenciais locais.

### Frontend

```powershell
cd C:\xampp\htdocs\gfp\frontend
npm install
npm start
```

Para gerar a build de produção:

```powershell
npm run build
```

## Notas

- O idioma da interface é persistido nas preferências do utilizador.
- O tema também é guardado entre sessões.
- As mensagens de sucesso, erro e aviso aparecem em notificações e também podem ser revistas na aba de notificações.
