<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\AuthService;

/**
 * Controlador de Autenticação
 * 
 * Responsável por processar requisições HTTP relacionadas a autenticação:
 * - Registo de novos utilizadores
 * - Login (autenticação)
 * - Recuperação de senha
 * 
 * Retorna sempre respostas JSON com HTTP Status Codes apropriados.
 * 
 * @package Src\Controllers
 */
class AuthController
{
    /**
     * Serviço de autenticação (Injeção de Dependência)
     * @var AuthService
     */
    private AuthService $authService;

    /**
     * Serviço de recuperação de senha (Injeção de Dependência)
     * @var \Src\Services\PasswordRecoveryService|null
     */
    private ?\Src\Services\PasswordRecoveryService $passwordRecoveryService;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param AuthService $authService
     * @param \Src\Services\PasswordRecoveryService|null $passwordRecoveryService
     */
    public function __construct(
        AuthService $authService,
        ?\Src\Services\PasswordRecoveryService $passwordRecoveryService = null
    ) {
        $this->authService = $authService;
        $this->passwordRecoveryService = $passwordRecoveryService;
    }

    /**
     * Endpoint: POST /api/auth/register
     * 
     * Registar um novo utilizador
     * 
     * Request JSON esperado:
     * {
     *   "nome": "João Silva",
     *   "email": "joao@example.com",
     *   "senha": "senha_segura_123"
     * }
     * 
     * @return void
     */
    public function register(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Request JSON inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $nome = $input['nome'] ?? '';
            $email = $input['email'] ?? '';
            $senha = $input['senha'] ?? '';

            $nome = trim((string)$nome);
            $email = trim((string)$email);
            $senha = trim((string)$senha);

            if (empty($nome) || empty($email) || empty($senha)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Dados inválidos: nome, email e senha são obrigatórios'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->authService->register($nome, $email, $senha);

            http_response_code(201);
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            $mensagem = $e->getMessage();

            if (strpos($mensagem, 'Email já cadastrado') !== false) {
                http_response_code(409);
            } else {
                http_response_code(400);
            }

            echo json_encode([
                'success' => false,
                'message' => $mensagem
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: POST /api/auth/login
     * 
     * Autenticar um utilizador e retornar token JWT
     * 
     * Request JSON esperado:
     * {
     *   "email": "joao@example.com",
     *   "senha": "senha_segura_123"
     * }
     * 
     * Response em caso de sucesso (200):
     * {
     *   "success": true,
     *   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     *   "message": "Login realizado com sucesso"
     * }
     * 
     * Response em caso de falha (401):
     * {
     *   "success": false,
     *   "message": "Credenciais inválidas"
     * }
     * 
     * @return void
     */
    public function login(): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Request JSON inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $email = $input['email'] ?? '';
            $senha = $input['senha'] ?? '';

            $email = trim((string)$email);
            $senha = trim((string)$senha);

            if (empty($email) || empty($senha)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Dados inválidos: email e senha são obrigatórios'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $token = $this->authService->login($email, $senha);

            if ($token === null) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Credenciais inválidas'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $payload = $this->authService->validateTokenPayload($token);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'token' => $token,
                'user' => [
                    'id' => $payload['id'] ?? null,
                    'nome' => $payload['nome'] ?? null,
                    'email' => $payload['email'] ?? null,
                    'role' => $payload['role'] ?? null
                ],
                'expires_in' => \Src\Services\JwtService::getExpirationTime()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro no login: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro interno do servidor'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: POST /api/auth/forgot-password
     * 
     * Solicitar recuperação de senha
     * 
     * Request JSON esperado:
     * {
     *   "email": "usuario@example.com"
     * }
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Token de recuperação gerado com sucesso",
     *   "token": "token_seguro_aqui",
     *   "expires_in": 3600
     * }
     * 
     * Response (404):
     * {
     *   "success": false,
     *   "message": "Email não encontrado"
     * }
     * 
     * @return void
     */
    public function forgotPassword(): void
    {
        try {
            if ($this->passwordRecoveryService === null) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Serviço de recuperação não disponível'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Request JSON inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $email = $input['email'] ?? '';
            $email = trim((string)$email);

            if (empty($email)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email é obrigatório'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->passwordRecoveryService->solicitarRecuperacao($email);

            http_response_code(200);
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao solicitar recuperação de senha: ' . $e->getMessage());

            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: POST /api/auth/reset-password
     * 
     * Redefinir senha com token de recuperação
     * 
     * Request JSON esperado:
     * {
     *   "token": "token_seguro_aqui",
     *   "nova_senha": "nova_senha_segura_123"
     * }
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Senha redefinida com sucesso"
     * }
     * 
     * Response (400):
     * {
     *   "success": false,
     *   "message": "Token inválido ou expirado"
     * }
     * 
     * @return void
     */
    public function resetPassword(): void
    {
        try {
            if ($this->passwordRecoveryService === null) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Serviço de recuperação não disponível'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Request JSON inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $token = $input['token'] ?? '';
            $novaSenha = $input['nova_senha'] ?? '';

            $token = trim((string)$token);
            $novaSenha = trim((string)$novaSenha);

            if (empty($token) || empty($novaSenha)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campos obrigatórios: token e nova_senha'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->passwordRecoveryService->redefinirSenha($token, $novaSenha);

            http_response_code(200);
            echo json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao redefinir senha: ' . $e->getMessage());

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
