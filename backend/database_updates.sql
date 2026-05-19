-- ========================================================================
-- Alterações ao Banco de Dados - Suporte a Recuperação de Senha
-- ========================================================================

-- Adicionar colunas para tokens de recuperação de senha
ALTER TABLE utilizadores ADD COLUMN reset_token VARCHAR(255) NULL UNIQUE AFTER ativo;
ALTER TABLE utilizadores ADD COLUMN reset_expires DATETIME NULL AFTER reset_token;

-- Criar índice para melhorar performance nas buscas por token
CREATE INDEX idx_reset_token ON utilizadores(reset_token);
CREATE INDEX idx_reset_expires ON utilizadores(reset_expires);

-- ========================================================================
-- FIM DAS ALTERAÇÕES
-- ========================================================================
