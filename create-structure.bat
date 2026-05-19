@echo off
REM Script para criar a estrutura completa do projeto no Windows
REM Sistema de Gestão Financeira Pessoal - Backend (PHP) + Frontend (Angular)

echo Criando estrutura de diretórios...

REM Backend
mkdir backend\config 2>nul
mkdir backend\src\Controllers 2>nul
mkdir backend\src\Services 2>nul
mkdir backend\src\Repositories 2>nul
mkdir backend\src\Models 2>nul

REM Frontend
mkdir frontend\src\app\core 2>nul
mkdir frontend\src\app\shared\components 2>nul
mkdir frontend\src\app\shared\pipes 2>nul
mkdir frontend\src\app\shared\directives 2>nul
mkdir frontend\src\app\features\auth 2>nul
mkdir frontend\src\app\features\dashboard 2>nul
mkdir frontend\src\app\features\transacoes 2>nul
mkdir frontend\src\app\services 2>nul

echo.
echo [OK] Estrutura de diretórios criada com sucesso!
echo.
pause
