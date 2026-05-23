<?php
declare(strict_types=1);

/**
 * Front Controller - Ponto de Entrada Principal da API RESTful
 * 
 * Responsabilidades:
 * - Configurar headers CORS para comunicação com Angular frontend
 * - Interceptar preflight requests (OPTIONS)
 * - Implementar roteamento de requisições HTTP
 * - Registrar handlers globais de exceções e erros
 * - Retornar respostas JSON estruturadas
 */

// ========================================================================
// CONFIGURAÇÕES INICIAIS
// ========================================================================

// Define o caminho base da aplicação
define('BASE_PATH', __DIR__);

// Define o diretório raiz do projeto (uma pasta acima)
define('PROJECT_ROOT', dirname(BASE_PATH));

// Ativa display_errors apenas em desenvolvimento
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// ========================================================================
// CONFIGURAÇÃO DE HEADERS CORS E CONTENT-TYPE
// ========================================================================

// Define o content-type como JSON
header('Content-Type: application/json; charset=utf-8');

// Configuração de CORS - Permitir requisições do frontend Angular
// Altere para domínio específico em produção
$allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:53031',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:53031'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Em produção, defina o domínio exato
    header('Access-Control-Allow-Origin: *');
}

// Métodos HTTP permitidos
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');

// Headers permitidos nas requisições
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Permitir envio de credentials (cookies, autenticação)
header('Access-Control-Allow-Credentials: true');

// Tempo máximo de cache para preflight (em segundos)
header('Access-Control-Max-Age: 86400');

// ========================================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES PREFLIGHT (OPTIONS)
// ========================================================================

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// ========================================================================
// HANDLERS GLOBAIS DE EXCEÇÕES E ERROS
// ========================================================================

/**
 * Handler de Exceção Global
 * Captura todas as exceções não capturadas e retorna JSON estruturado
 */
set_exception_handler(function (Throwable $exception): void {
    // Log da exceção (será registado em arquivo)
    error_log('EXCEÇÃO: ' . get_class($exception) . ' - ' . $exception->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'error' => $exception->getMessage()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit(1);
});

/**
 * Handler de Erro Global
 * Converte erros PHP em exceções para serem tratadas uniformemente
 */
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    // Ignora erros suprimidos com @
    if (error_reporting() === 0) {
        return false;
    }

    // Log do erro
    error_log("ERRO [$severity]: $message em $file:$line");

    throw new ErrorException($message, 0, $severity, $file, $line);
});

// ========================================================================
// CARREGAMENTO DE CONFIGURAÇÕES
// ========================================================================

require_once BASE_PATH . '/config/config.php';
require_once BASE_PATH . '/config/database.php';

// ========================================================================
// CARREGAMENTO DE CLASSES (Models, Services, Repositories, Controllers)
// ========================================================================

require_once BASE_PATH . '/src/Models/Usuario.php';
require_once BASE_PATH . '/src/Models/Categoria.php';
require_once BASE_PATH . '/src/Models/Transacao.php';
require_once BASE_PATH . '/src/Repositories/UsuarioRepository.php';
require_once BASE_PATH . '/src/Repositories/CategoriaRepository.php';
require_once BASE_PATH . '/src/Repositories/TransacaoRepository.php';
require_once BASE_PATH . '/src/Services/JwtService.php';
require_once BASE_PATH . '/src/Services/AuthService.php';
require_once BASE_PATH . '/src/Services/SmtpMailer.php';
require_once BASE_PATH . '/src/Services/PasswordRecoveryService.php';
require_once BASE_PATH . '/src/Services/CategoriaService.php';
require_once BASE_PATH . '/src/Services/TransacaoService.php';
require_once BASE_PATH . '/src/Services/DashboardService.php';
require_once BASE_PATH . '/src/Middlewares/AuthMiddleware.php';
require_once BASE_PATH . '/src/Middlewares/AdminMiddleware.php';
require_once BASE_PATH . '/src/Controllers/AuthController.php';
require_once BASE_PATH . '/src/Controllers/AdminController.php';
require_once BASE_PATH . '/src/Controllers/CategoriaController.php';
require_once BASE_PATH . '/src/Controllers/TransacaoController.php';
require_once BASE_PATH . '/src/Controllers/DashboardController.php';
require_once BASE_PATH . '/src/Controllers/ExportacaoController.php';

// ========================================================================
// SISTEMA DE ROTEAMENTO
// ========================================================================

/**
 * Classe simples para gerir o roteamento da API
 */
class Router
{
    /**
     * Array de rotas registadas
     * @var array
     */
    private array $routes = [];

    /**
     * Registra uma rota GET
     * 
     * @param string $path
     * @param callable $callback
     * @return void
     */
    public function get(string $path, callable $callback): void
    {
        $this->routes['GET'][$path] = $callback;
    }

    /**
     * Registra uma rota POST
     * 
     * @param string $path
     * @param callable $callback
     * @return void
     */
    public function post(string $path, callable $callback): void
    {
        $this->routes['POST'][$path] = $callback;
    }

    /**
     * Registra uma rota PUT
     * 
     * @param string $path
     * @param callable $callback
     * @return void
     */
    public function put(string $path, callable $callback): void
    {
        $this->routes['PUT'][$path] = $callback;
    }

    /**
     * Registra uma rota DELETE
     * 
     * @param string $path
     * @param callable $callback
     * @return void
     */
    public function delete(string $path, callable $callback): void
    {
        $this->routes['DELETE'][$path] = $callback;
    }

    /**
     * Processa a requisição e executa a rota correspondente
     * 
     * @return void
     */
    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Normalizar URI (remover trailing slash, exceto para raiz)
        if ($uri !== '/' && str_ends_with($uri, '/')) {
            $uri = rtrim($uri, '/');
        }

        // Remover prefixo de diretório se existir
        $basePath = basename(dirname(__DIR__));  // 'gfp'
        $currentDir = basename(__DIR__);          // 'backend'
        
        // Remover /gfp/backend ou apenas /backend
        if (str_starts_with($uri, '/' . $basePath . '/' . $currentDir)) {
            $uri = substr($uri, strlen('/' . $basePath . '/' . $currentDir));
        } elseif (str_starts_with($uri, '/' . $basePath)) {
            $uri = substr($uri, strlen('/' . $basePath));
        } elseif (str_starts_with($uri, '/' . $currentDir)) {
            $uri = substr($uri, strlen('/' . $currentDir));
        }

        // Suporta chamadas com /index.php no caminho (fallback sem mod_rewrite)
        if (str_starts_with($uri, '/index.php')) {
            $uri = substr($uri, strlen('/index.php'));
        }

        // Se URI está vazia, defina como raiz
        if (empty($uri)) {
            $uri = '/';
        }

        // Procurar rota exacta
        if (isset($this->routes[$method][$uri])) {
            call_user_func($this->routes[$method][$uri]);
            return;
        }

        // Rota não encontrada
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Rota não encontrada',
            'method' => $method,
            'path' => $uri
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}

// ========================================================================
// INSTANCIAÇÃO DE DEPENDÊNCIAS (Injeção de Dependência)
// ========================================================================

$database = \Config\Database::getInstance();
$pdo = $database->getConnection();

$usuarioRepository = new \Src\Repositories\UsuarioRepository($pdo);
$categoriaRepository = new \Src\Repositories\CategoriaRepository($pdo);
$transacaoRepository = new \Src\Repositories\TransacaoRepository($pdo);

$jwtService = new \Src\Services\JwtService();
$authService = new \Src\Services\AuthService($usuarioRepository, $jwtService);
$smtpMailer = new \Src\Services\SmtpMailer(
    SMTP_HOST,
    (int) SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_SECURE
);
$passwordRecoveryService = new \Src\Services\PasswordRecoveryService($usuarioRepository, $smtpMailer);
$categoriaService = new \Src\Services\CategoriaService($categoriaRepository);
$transacaoService = new \Src\Services\TransacaoService($transacaoRepository);
$dashboardService = new \Src\Services\DashboardService($transacaoRepository);

$authController = new \Src\Controllers\AuthController($authService, $passwordRecoveryService);
$adminController = new \Src\Controllers\AdminController($usuarioRepository);
$categoriaController = new \Src\Controllers\CategoriaController($categoriaService);
$transacaoController = new \Src\Controllers\TransacaoController($transacaoService);
$dashboardController = new \Src\Controllers\DashboardController($dashboardService);
$exportacaoController = new \Src\Controllers\ExportacaoController($transacaoService, $usuarioRepository);

$authMiddleware = new \Src\Middlewares\AuthMiddleware($jwtService);
$adminMiddleware = new \Src\Middlewares\AdminMiddleware($jwtService);

// ========================================================================
// INSTANCIAÇÃO DO ROUTER E DEFINIÇÃO DE ROTAS
// ========================================================================

$router = new Router();

// ========================================================================
// ROTA: GET / (Verificação da API)
// ========================================================================
$router->get('/', function (): void {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'API RESTful - Sistema de Gestão Financeira Pessoal',
        'version' => '1.0.0',
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
});

// ========================================================================
// ROTA: POST /api/auth/register (Registo de Utilizador)
// ========================================================================
$router->post('/api/auth/register', function () use ($authController): void {
    $authController->register();
});

// ========================================================================
// ROTA: POST /api/auth/login (Login de Utilizador)
// ========================================================================
$router->post('/api/auth/login', function () use ($authController): void {
    $authController->login();
});

// ========================================================================
// ROTA: POST /api/auth/forgot-password (Solicitar Recuperação de Senha)
// ========================================================================
$router->post('/api/auth/forgot-password', function () use ($authController): void {
    $authController->forgotPassword();
});

// ========================================================================
// ROTA: POST /api/auth/reset-password (Redefinir Senha)
// ========================================================================
$router->post('/api/auth/reset-password', function () use ($authController): void {
    $authController->resetPassword();
});

// ========================================================================
// ROTA: GET /api/categorias (Listar Categorias)
// ========================================================================
$router->get('/api/categorias', function () use ($authMiddleware, $categoriaController): void {
    $payload = $authMiddleware->handle();
    $categoriaController->listar($payload);
});

// ========================================================================
// ROTA: POST /api/categorias (Criar Categoria)
// ========================================================================
$router->post('/api/categorias', function () use ($authMiddleware, $categoriaController): void {
    $payload = $authMiddleware->handle();
    $categoriaController->criar($payload);
});

// ========================================================================
// ROTA: GET /api/transacoes (Listar Transações)
// ========================================================================
$router->get('/api/transacoes', function () use ($authMiddleware, $transacaoController): void {
    $payload = $authMiddleware->handle();
    $transacaoController->listar($payload);
});

// ========================================================================
// ROTA: POST /api/transacoes (Criar Transação)
// ========================================================================
$router->post('/api/transacoes', function () use ($authMiddleware, $transacaoController): void {
    $payload = $authMiddleware->handle();
    $transacaoController->criar($payload);
});

// ========================================================================
// ROTA: DELETE /api/transacoes?id=123 (Deletar Transação)
// ========================================================================
$router->delete('/api/transacoes', function () use ($authMiddleware, $transacaoController): void {
    $payload = $authMiddleware->handle();
    $transacaoController->deletar($payload);
});

// ========================================================================
// ROTA: GET /api/dashboard (Resumo Financeiro)
// ========================================================================
$router->get('/api/dashboard', function () use ($authMiddleware, $dashboardController): void {
    $payload = $authMiddleware->handle();
    $dashboardController->resumo($payload);
});

// ========================================================================
// ROTA: GET /api/exportar/csv (Exportar em CSV)
// ========================================================================
$router->get('/api/exportar/csv', function () use ($authMiddleware, $exportacaoController): void {
    $payload = $authMiddleware->handle();
    $exportacaoController->exportarCSV($payload);
});

// ========================================================================
// ROTA: GET /api/admin/exportar/usuarios (Exportar lista de utilizadores em CSV - ADMIN)
// ========================================================================
$router->get('/api/admin/exportar/usuarios', function () use ($adminMiddleware, $exportacaoController): void {
    $payload = $adminMiddleware->handle();
    $exportacaoController->exportarUsuariosCSV($payload);
});

// ========================================================================
// ROTA: GET /api/admin/utilizadores (Listar Todos os Utilizadores - ADMIN)
// ========================================================================
$router->get('/api/admin/utilizadores', function () use ($adminMiddleware, $adminController): void {
    $payload = $adminMiddleware->handle();
    $adminController->listarTodosUtilizadores($payload);
});

// ========================================================================
// ROTA: PUT /api/admin/utilizadores?id=X (Atualizar Tipo de Utilizador - ADMIN)
// ========================================================================
$router->put('/api/admin/utilizadores', function () use ($adminMiddleware, $adminController): void {
    $payload = $adminMiddleware->handle();
    $adminController->atualizarTipoUsuario($payload);
});

// ========================================================================
// ROTA: DELETE /api/admin/utilizadores?id=X (Eliminar Utilizador - ADMIN)
// ========================================================================
$router->delete('/api/admin/utilizadores', function () use ($adminMiddleware, $adminController): void {
    $payload = $adminMiddleware->handle();
    $adminController->eliminarUtilizador($payload);
});

// ========================================================================
// ROTA: PATCH /api/admin/utilizadores?id=X&ativo=0|1 (Bloquear/Desbloquear - ADMIN)
// ========================================================================
$router->put('/api/admin/utilizadores/bloquear', function () use ($adminMiddleware, $adminController): void {
    // Usando PUT pois não há suporte nativo a PATCH no simples router
    $_SERVER['REQUEST_METHOD'] = 'PATCH';
    $payload = $adminMiddleware->handle();
    $adminController->bloquearUtilizador($payload);
});

// ========================================================================
// ROTA: PUT /api/categorias?id=123 (Atualizar Categoria)
// ========================================================================
$router->put('/api/categorias', function () use ($authMiddleware, $categoriaController): void {
    $payload = $authMiddleware->handle();
    $categoriaController->atualizar($payload);
});

// ========================================================================
// ROTA: DELETE /api/categorias?id=123 (Deletar Categoria)
// ========================================================================
$router->delete('/api/categorias', function () use ($authMiddleware, $categoriaController): void {
    $payload = $authMiddleware->handle();
    $categoriaController->deletar($payload);
});

// ========================================================================
// ROTA: PUT /api/transacoes?id=123 (Atualizar Transação)
// ========================================================================
$router->put('/api/transacoes', function () use ($authMiddleware, $transacaoController): void {
    $payload = $authMiddleware->handle();
    $transacaoController->atualizar($payload);
});

// ========================================================================
// DISPATCH - EXECUTAR A ROTA CORRESPONDENTE
// ========================================================================

$router->dispatch();
?>
