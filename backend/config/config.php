<?php
/**
 * Configuracoes Globais da Aplicacao
 */

define('APP_NAME', 'Sistema de Gestao Financeira Pessoal');
define('APP_VERSION', '1.0.0');
define('ENVIRONMENT', 'development');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'financas_pessoais');
define('DB_PORT', 3306);

define('JWT_SECRET', 'sua_chave_secreta_muito_segura_aqui');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 3600);

define('ALLOWED_ORIGINS', [
    'http://localhost:4200',
    'http://localhost:53031',
    'http://localhost:3000'
]);

// URL publica do frontend para links de recuperacao de senha
define('FRONTEND_URL', 'http://localhost:4200');

define('DEBUG_MODE', true);

// SMTP (envio real de e-mail)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'luisdalton353@gmail.com');
define('SMTP_PASSWORD', 'jqamsqnkborjyiex');
define('SMTP_FROM_EMAIL', 'luisdalton353@gmail.com');
define('SMTP_FROM_NAME', 'FinanSmart');
define('SMTP_SECURE', 'tls'); // tls | ssl | none
?>
