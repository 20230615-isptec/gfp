# Guia de Migração para Outra Máquina

Este guia ajuda a copiar e executar o projeto noutra máquina sem levar ficheiros desnecessários.

## 1. Antes de copiar

1. Exporta a base de dados, se quiseres manter os dados atuais.
2. Não copies `node_modules`, `vendor` nem ficheiros de build.
3. Copia a pasta do projeto para a nova máquina.

## 2. Requisitos

- XAMPP ou equivalente com Apache e MySQL
- Node.js e npm

## 3. Backend

1. Copia a pasta `gfp` para `C:\xampp\htdocs\`.
2. Liga o Apache e o MySQL no XAMPP.
3. Cria a base de dados no phpMyAdmin.
4. Importa `backend/database.sql`.
5. Se houver atualizações acumuladas, importa também `backend/database_updates.sql`.
6. Confirma `backend/config/database.php` com as credenciais corretas.

## 4. Frontend

```powershell
cd C:\xampp\htdocs\gfp\frontend
npm install
npm start
```

Se precisares de validar a build:

```powershell
npm run build
```

## 5. O que não deve ser copiado

- `frontend/node_modules`
- `backend/vendor`, se existir
- `frontend/dist`
- ficheiros `.zip`
- caches e artefactos temporários

## 6. Verificação final

Confirma no navegador:

- login funcional
- dashboard a carregar dados
- idioma a alternar corretamente
- notificações visíveis na interface e na aba de notificações
