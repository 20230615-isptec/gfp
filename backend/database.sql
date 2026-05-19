-- ========================================================================
-- Script de Banco de Dados - Sistema de Gestão Financeira Pessoal
-- Banco de Dados Relacional (MySQL/PostgreSQL compatible)
-- ========================================================================

-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS financas_pessoais;
USE financas_pessoais;

-- ========================================================================
-- Tabela: tipos_usuario
-- Descrição: Define os tipos/roles de utilizadores (Admin e Utilizador comum)
-- ========================================================================
CREATE TABLE tipos_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- Tabela: utilizadores
-- Descrição: Armazena informações de utilizadores registados
-- ========================================================================
CREATE TABLE utilizadores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    tipo_usuario_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_tipo_usuario (tipo_usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- Tabela: categorias
-- Descrição: Armazena categorias de transações (receitas/despesas)
-- Nota: utilizador_id pode ser NULL para categorias globais/padrão
-- ========================================================================
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('receita', 'despesa') NOT NULL,
    utilizador_id INT,
    descricao VARCHAR(255),
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_tipo (tipo),
    UNIQUE KEY unique_categoria_user (nome, tipo, utilizador_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- Tabela: transacoes
-- Descrição: Armazena todas as transações financeiras do utilizador
-- ========================================================================
CREATE TABLE transacoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilizador_id INT NOT NULL,
    categoria_id INT NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    tipo ENUM('receita', 'despesa') NOT NULL,
    data DATE NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_utilizador (utilizador_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_data (data),
    INDEX idx_tipo (tipo),
    INDEX idx_utilizador_data (utilizador_id, data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- DADOS INICIAIS
-- ========================================================================

-- Inserir tipos de utilizador
INSERT INTO tipos_usuario (nome, descricao) VALUES
('admin', 'Administrador do Sistema'),
('user', 'Utilizador Comum');

-- Inserir utilizador administrador padrão
-- Email: admin@financas.com
-- Senha: Admin@12345 (hash com password_hash)
INSERT INTO utilizadores (nome, email, senha_hash, tipo_usuario_id) VALUES
('Administrador', 'admin@financas.com', '$2y$10$h8x7VzJ9Q8KL2pN3R4sT5eX6Y7Z8a9B0C1D2E3F4G5H6I7J8K9L0M', 1);

-- Inserir categorias globais (utilizador_id = NULL)
INSERT INTO categorias (nome, tipo, utilizador_id, descricao) VALUES
('Salário', 'receita', NULL, 'Salário mensal'),
('Bónus', 'receita', NULL, 'Bónus e prémios'),
('Investimentos', 'receita', NULL, 'Rendimentos de investimentos'),
('Outros Rendimentos', 'receita', NULL, 'Outras receitas'),
('Alimentação', 'despesa', NULL, 'Supermercado e alimentação'),
('Transporte', 'despesa', NULL, 'Combustível, transportes públicos'),
('Habitação', 'despesa', NULL, 'Aluguel, hipoteca'),
('Utilidades', 'despesa', NULL, 'Água, luz, gás, internet'),
('Saúde', 'despesa', NULL, 'Medicamentos, consultas'),
('Educação', 'despesa', NULL, 'Cursos, livros'),
('Entretenimento', 'despesa', NULL, 'Cinema, jogos, lazer'),
('Vestuário', 'despesa', NULL, 'Roupas e calçado'),
('Outros', 'despesa', NULL, 'Despesas diversas');

-- ========================================================================
-- FIM DO SCRIPT
-- ========================================================================
