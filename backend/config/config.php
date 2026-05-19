<?php
/**
 * Configurações Globais da Aplicação
 * 
 * Define variáveis de ambiente, conexão com banco de dados,
 * JWT keys e outras configurações críticas.
 */

// Informações da API
define('APP_NAME', 'Sistema de Gestão Financeira Pessoal');
define('APP_VERSION', '1.0.0');
define('ENVIRONMENT', 'development'); // development, staging, production

// Configurações de Banco de Dados
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'financas_pessoais');
define('DB_PORT', 3306);

// Configurações JWT
define('JWT_SECRET', 'sua_chave_secreta_muito_segura_aqui');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 3600); // 1 hora em segundos

// CORS - Domínios permitidos
define('ALLOWED_ORIGINS', [
    'http://localhost:4200',
    'http://localhost:3000'
]);

// Modo debug
define('DEBUG_MODE', true);

/**
 * TODO: Implementar carregamento de variáveis de ambiente (.env)
 * TODO: Implementar sistema de conexão com banco de dados
 */
?>
