<?php
declare(strict_types=1);

namespace Src\Middlewares;

use Src\Services\JwtService;

/**
 * Middleware de Autenticação JWT
 * 
 * Valida o token JWT enviado no header Authorization e protege rotas.
 * Se o token for inválido ou ausente, interrompe a execução com HTTP 401.
 * Se for válido, retorna o payload (com dados do utilizador).
 * 
 * @package Src\Middlewares
 */
class AuthMiddleware
{
    /**
     * Serviço de JWT (Injeção de Dependência)
     * @var JwtService
     */
    private JwtService $jwtService;

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
     * Processa a autenticação JWT
     * 
     * Verifica o header Authorization, extrai o token e valida.
     * Se inválido, retorna HTTP 401 e termina a execução.
     * Se válido, retorna o payload decodificado.
     * 
     * @return array Payload do token (contendo id, email, nome, role, exp, iat)
     * @throws \Exception Se token for inválido/expirado/ausente
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
                throw new \Exception('Formato de Authorization inválido. Esperado: Bearer <token>');
            }

            $payload = $this->jwtService->validateToken($token);

            if ($payload === null) {
                throw new \Exception('Token inválido ou expirado');
            }

            return $payload;
        } catch (\Exception $e) {
            error_log('Erro de autenticação: ' . $e->getMessage());

            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Acesso não autorizado ou token inválido',
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            exit(1);
        }
    }

    /**
     * Obtém o header Authorization
     * 
     * Tenta obter de $_SERVER['HTTP_AUTHORIZATION'] ou apache_request_headers()
     * 
     * @return string|null
     */
    private function getAuthorizationHeader(): ?string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return (string) $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strtolower((string) $key) === 'authorization' && !empty($value)) {
                    return (string) $value;
                }
            }
        }

        return null;
    }

    /**
     * Extrai o token do header Authorization
     * 
     * Esperado formato: "Bearer <token>"
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
