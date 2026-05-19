<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Usuario;
use Src\Repositories\UsuarioRepository;

/**
 * Serviço de Autenticação
 * 
 * Camada de lógica de negócio para operações de autenticação:
 * - Registo de novos utilizadores
 * - Login com validação de credenciais
 * - Geração de tokens JWT
 * 
 * @package Src\Services
 */
class AuthService
{
    /**
     * Repositório de utilizadores (Injeção de Dependência)
     * @var UsuarioRepository
     */
    private UsuarioRepository $usuarioRepository;

    /**
     * Serviço de JWT (Injeção de Dependência)
     * @var JwtService
     */
    private JwtService $jwtService;

    /**
     * ID do tipo de utilizador comum (padrão para novos registos)
     */
    private const DEFAULT_USER_TYPE_ID = 2;

    /**
     * Construtor - Injeção de Dependências
     * 
     * @param UsuarioRepository $usuarioRepository
     * @param JwtService $jwtService
     */
    public function __construct(
        UsuarioRepository $usuarioRepository,
        JwtService $jwtService
    ) {
        $this->usuarioRepository = $usuarioRepository;
        $this->jwtService = $jwtService;
    }

    /**
     * Registar um novo utilizador
     * 
     * Operações:
     * 1. Verificar se o e-mail já existe
     * 2. Hash a senha com BCRYPT
     * 3. Criar entidade Usuario
     * 4. Persistir no banco de dados
     * 
     * @param string $nome Nome completo do utilizador
     * @param string $email Email (único)
     * @param string $senha Senha em texto limpo
     * @return array Array com sucesso e mensagem
     * @throws Exception Se houver erro no registo
     */
    public function register(string $nome, string $email, string $senha): array
    {
        try {
            $nome = trim($nome);
            $email = trim($email);
            $senha = trim($senha);

            if (empty($nome) || empty($email) || empty($senha)) {
                throw new \Exception('Nome, email e senha são obrigatórios');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception('Email inválido');
            }

            if ($this->usuarioRepository->emailExists($email)) {
                throw new \Exception('Email já cadastrado');
            }

            if (strlen($senha) < 8) {
                throw new \Exception('Senha deve ter no mínimo 8 caracteres');
            }

            $senhaHash = password_hash($senha, PASSWORD_BCRYPT, ['cost' => 12]);

            $usuario = new Usuario(
                nome: $nome,
                email: $email,
                senhaHash: $senhaHash,
                tipoUsuarioId: self::DEFAULT_USER_TYPE_ID
            );

            $sucesso = $this->usuarioRepository->create($usuario);

            if (!$sucesso) {
                throw new \Exception('Erro ao registar utilizador na base de dados');
            }

            return [
                'success' => true,
                'message' => 'Utilizador registado com sucesso',
                'usuario_id' => $usuario->getId()
            ];
        } catch (\Exception $e) {
            error_log('Erro no registo: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Realizar login de um utilizador
     * 
     * Operações:
     * 1. Buscar utilizador pelo email
     * 2. Validar senha
     * 3. Gerar token JWT
     * 
     * @param string $email Email do utilizador
     * @param string $senha Senha em texto limpo
     * @return string|null Token JWT se sucesso, null se falhar
     */
    public function login(string $email, string $senha): ?string
    {
        try {
            $email = trim($email);
            $senha = trim($senha);

            if (empty($email) || empty($senha)) {
                return null;
            }

            $usuario = $this->usuarioRepository->findByEmail($email);

            if ($usuario === null) {
                return null;
            }

            $senhaValida = password_verify($senha, $usuario->getSenhaHash());

            if (!$senhaValida) {
                return null;
            }

            $payload = [
                'id' => $usuario->getId(),
                'email' => $usuario->getEmail(),
                'nome' => $usuario->getNome(),
                'role' => $usuario->getTipoUsuarioId()
            ];

            $token = $this->jwtService->generateToken($payload);

            return $token;
        } catch (\Exception $e) {
            error_log('Erro no login: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Validar um token JWT
     * 
     * @param string $token Token a validar
     * @return array|null Payload do token se válido, null caso contrário
     */
    public function validateTokenPayload(string $token): ?array
    {
        return $this->jwtService->validateToken($token);
    }
}
?>
