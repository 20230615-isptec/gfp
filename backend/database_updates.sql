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

-- ========================================================================
-- V2 - Nome de coluna padronizado para expiracao do token
-- ========================================================================
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS reset_token_expires_at DATETIME NULL;

UPDATE utilizadores
SET reset_token_expires_at = reset_expires
WHERE reset_expires IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reset_token_expires_at ON utilizadores(reset_token_expires_at);

-- ========================================================================
-- V3 - Perfil Expandido (avatar e moeda preferida)
-- ========================================================================
ALTER TABLE utilizadores
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS moeda_preferida VARCHAR(3) NOT NULL DEFAULT 'AOA',
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS idioma_preferido VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS tema_preferido ENUM('dark', 'light', 'system') NOT NULL DEFAULT 'dark';

-- ========================================================================
-- V4 - Orcamentos por Categoria
-- ========================================================================
CREATE TABLE IF NOT EXISTS orcamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    valor_limite DECIMAL(15, 2) NOT NULL,
    mes INT NOT NULL,
    ano INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY uq_orcamento_periodo (utilizador_id, categoria_id, mes, ano)
);

-- ========================================================================
-- V5 - Transações Recorrentes (Trigger on Access)
-- ========================================================================
CREATE TABLE IF NOT EXISTS transacoes_recorrentes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    tipo ENUM('receita', 'despesa') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    frequencia ENUM('mensal', 'semanal') DEFAULT 'mensal',
    dia_vencimento INT NOT NULL,
    ultima_geracao DATE NULL,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ========================================================================
-- V6 - Notificações Internas
-- ========================================================================
CREATE TABLE IF NOT EXISTS notificacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ========================================================================
-- V7 - Metas Financeiras (alerta de prazo)
-- ========================================================================
CREATE TABLE IF NOT EXISTS metas_financeiras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    valor_objetivo DECIMAL(15, 2) NOT NULL,
    valor_atual DECIMAL(15, 2) NOT NULL DEFAULT 0,
    data_limite DATE NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    ultimo_alerta_em DATETIME NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);

-- ========================================================================
-- V8 - Movimentos de Metas (Cofre Virtual)
-- ========================================================================
CREATE TABLE IF NOT EXISTS meta_movimentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meta_id INT NOT NULL,
    utilizador_id INT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    tipo ENUM('aporte', 'resgate') NOT NULL DEFAULT 'aporte',
    descricao VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meta_id) REFERENCES metas_financeiras(id) ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
);
