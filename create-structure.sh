#!/bin/bash
# Script para criar a estrutura completa do projeto
# Sistema de Gestão Financeira Pessoal - Backend (PHP) + Frontend (Angular)

echo "Criando estrutura de diretórios..."

# Backend
mkdir -p backend/config
mkdir -p backend/src/Controllers
mkdir -p backend/src/Services
mkdir -p backend/src/Repositories
mkdir -p backend/src/Models

# Frontend
mkdir -p frontend/src/app/core
mkdir -p frontend/src/app/shared/components
mkdir -p frontend/src/app/shared/pipes
mkdir -p frontend/src/app/shared/directives
mkdir -p frontend/src/app/features/auth
mkdir -p frontend/src/app/features/dashboard
mkdir -p frontend/src/app/features/transacoes
mkdir -p frontend/src/app/services

echo "✓ Estrutura de diretórios criada com sucesso!"
