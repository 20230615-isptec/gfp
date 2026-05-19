# 🏗️ Sistema de Gestão Financeira Pessoal

## Estrutura do Projeto

Este projeto está estruturado em **duas camadas principais**:

### 📁 Backend (API REST em PHP Puro)
```
backend/
├── config/           # Configurações (BD, CORS, JWT)
├── src/
│   ├── Controllers/  # Validação de requests e respostas JSON
│   ├── Services/     # Regras e lógica de negócio
│   ├── Repositories/ # Consultas SQL e persistência de dados
│   └── Models/       # Entidades de dados
├── index.php         # Front Controller (Roteador Principal)
└── .htaccess        # Reescrita de URLs para RESTful API
```

### 📁 Frontend (Angular - Standalone Components)
```
frontend/
└── src/
    └── app/
        ├── core/           # Guards de rotas, Interceptors HTTP (JWT)
        ├── shared/         # Componentes, pipes e diretivas globais
        │   ├── components/
        │   ├── pipes/
        │   └── directives/
        ├── features/       # Módulos funcionais
        │   ├── auth/       # Autenticação
        │   ├── dashboard/  # Dashboard principal
        │   └── transacoes/ # Gestão de transações
        ├── services/       # Serviços para consumo da API
        └── app.config.ts   # Configuração da aplicação
```

## 🚀 Criando a Estrutura

### Opção 1: Windows (Recomendado)
Duplo clique no ficheiro `create-structure.bat` para executar automaticamente.

### Opção 2: Terminal/PowerShell
```powershell
.\create-structure.bat
```

### Opção 3: Linux/MacOS
```bash
chmod +x create-structure.sh
./create-structure.sh
```

### Opção 4: Comandos Manuais (Windows CMD)
```cmd
mkdir backend\config
mkdir backend\src\Controllers
mkdir backend\src\Services
mkdir backend\src\Repositories
mkdir backend\src\Models
mkdir frontend\src\app\core
mkdir frontend\src\app\shared\components
mkdir frontend\src\app\shared\pipes
mkdir frontend\src\app\shared\directives
mkdir frontend\src\app\features\auth
mkdir frontend\src\app\features\dashboard
mkdir frontend\src\app\features\transacoes
mkdir frontend\src\app\services
```

## 📋 Próximos Passos

1. ✅ Criar estrutura de diretórios
2. ⏳ Configurar `backend/config/` com variáveis de ambiente
3. ⏳ Criar `backend/.htaccess` para reescrever URLs
4. ⏳ Implementar roteamento principal em `backend/index.php`
5. ⏳ Inicializar projeto Angular no `frontend/`
6. ⏳ Configurar serviços de autenticação
7. ⏳ Implementar componentes compartilhados

---

**Desenvolvido com ❤️ para Gestão Financeira Pessoal**
