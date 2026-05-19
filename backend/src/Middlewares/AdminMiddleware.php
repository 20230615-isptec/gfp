<?php
declare(strict_types=1);

namespace Src\Middlewares;

use Src\Services\JwtService;

/**
 * Middleware de Autorização Admin
 * 
 * Valida se o utilizador autenticado possui permissões de Administrador.
 * Complementa o AuthMiddleware com verificação de role/permissão.
 * 
 * @package Src\Middlewares
 */
class AdminMiddleware
{
    /**
     * Serviço de JWT (Injeção de Dependência)
     * @var JwtService
     */
    private JwtService $jwtService;

    /**
     * ID do tipo de utilizador administrador
     */
    private const ADMIN_TYPE_ID = 1;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param JwtService $jwtService
     */
    public function __construct(JwtService $jwtService)
    {
        $this->jwtService = $jwtService;
    }

    /**
     * Processa a autenticação e autorização de administrador
     * 
     * Verifica:
     * 1. Se o header Authorization existe
     * 2. Se o token JWT é válido
     * 3. Se o utilizador tem role de Administrador
     * 
     * Se autorizado, retorna o payload.
     * Se não autorizado, retorna HTTP 403 (Forbidden).
     * 
     * @return array Payload do token (com dados do utilizador admin)
     * @throws \Exception Se não autorizado
     */
    public function handle(): array
    {
        try {
            $authHeader = $this->getAuthorizationHeader();

            if ($authHeader === null) {
                throw new \Exception('Header Authorization ausente');
            }

            $token = $this->extractTokenFromHeader($authHeader);

            if ($token === null) {
                throw new \Exception('Formato de Authorization inválido');
            }

            $payload = $this->jwtService->validateToken($token);

            if ($payload === null) {
                throw new \Exception('Token inválido ou expirado');
            }

            $role = (int)($payload['role'] ?? 0);

            if ($role !== self::ADMIN_TYPE_ID) {
                throw new \Exception('Acesso negado. Permissões de administrador requeridas');
            }

            return $payload;
        } catch (\Exception $e) {
            error_log('Erro de autorização admin: ' . $e->getMessage());

            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Acesso negado. Permissões de administrador requeridas',
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            exit(1);
        }
    }

    /**
     * Obtém o header Authorization
     * 
     * @return string|null
     */
    private function getAuthorizationHeader(): ?string
    {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                return $headers['Authorization'];
            }
        }

        return null;
    }

    /**
     * Extrai o token do header Authorization
     * 
     * @param string $authHeader
     * @return string|null
     */
    private function extractTokenFromHeader(string $authHeader): ?string
    {
        $parts = explode(' ', trim($authHeader));

        if (count($parts) !== 2) {
            return null;
        }

        if (strtolower($parts[0]) !== 'bearer') {
            return null;
        }

        return $parts[1];
    }
}
?>
