<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\UsuarioRepository;

/**
 * Serviço de Recuperação de Senha
 * 
 * Gerencia o fluxo de recuperação de senha:
 * - Geração de tokens de recuperação
 * - Validação de tokens
 * - Redefinição de senha
 * 
 * @package Src\Services
 */
class PasswordRecoveryService
{
    /**
     * Repositório de utilizadores (Injeção de Dependência)
     * @var UsuarioRepository
     */
    private UsuarioRepository $usuarioRepository;

    /**
     * Tempo de expiração do token de recuperação (em segundos)
     */
    private const TOKEN_EXPIRATION = 3600;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param UsuarioRepository $usuarioRepository
     */
    public function __construct(UsuarioRepository $usuarioRepository)
    {
        $this->usuarioRepository = $usuarioRepository;
    }

    /**
     * Solicita a recuperação de senha para um utilizador
     * 
     * Operações:
     * 1. Verifica se o e-mail existe
     * 2. Gera um token aleatório e seguro
     * 3. Salva o token no banco com expiração
     * 4. Retorna o token (em produção, seria enviado por e-mail)
     * 
     * @param string $email Email do utilizador
     * @return array Array contendo o token e mensagem de sucesso
     * @throws Exception Se o email não existir ou houver erro
     */
    public function solicitarRecuperacao(string $email): array
    {
        try {
            $email = trim($email);

            if (empty($email)) {
                throw new \Exception('Email é obrigatório');
            }

            $usuario = $this->usuarioRepository->findByEmail($email);

            if ($usuario === null) {
                throw new \Exception('Email não encontrado');
            }

            $resetToken = $this->gerarTokenSeguro();

            $this->usuarioRepository->saveResetToken(
                $usuario->getId(),
                $resetToken,
                self::TOKEN_EXPIRATION
            );

            return [
                'success' => true,
                'message' => 'Token de recuperação gerado com sucesso',
                'token' => $resetToken,
                'expires_in' => self::TOKEN_EXPIRATION,
                'nota' => 'Em produção, este token seria enviado por e-mail'
            ];
        } catch (\Exception $e) {
            error_log('Erro ao solicitar recuperação de senha: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Redefine a senha usando um token válido
     * 
     * Operações:
     * 1. Busca o utilizador pelo token
     * 2. Valida se o token ainda é válido (não expirado)
     * 3. Hash a nova senha
     * 4. Atualiza a senha no banco
     * 5. Limpa o token de recuperação
     * 
     * @param string $token Token de recuperação
     * @param string $novaSenha Nova senha em texto limpo
     * @return array Array com mensagem de sucesso
     * @throws Exception Se o token for inválido ou a senha for fraca
     */
    public function redefinirSenha(string $token, string $novaSenha): array
    {
        try {
            $token = trim($token);
            $novaSenha = trim($novaSenha);

            if (empty($token)) {
                throw new \Exception('Token não fornecido');
            }

            if (empty($novaSenha)) {
                throw new \Exception('Nova senha é obrigatória');
            }

            if (strlen($novaSenha) < 8) {
                throw new \Exception('Senha deve ter no mínimo 8 caracteres');
            }

            $usuario = $this->usuarioRepository->findByResetToken($token);

            if ($usuario === null) {
                throw new \Exception('Token inválido ou expirado');
            }

            $novoHash = password_hash($novaSenha, PASSWORD_BCRYPT, ['cost' => 12]);

            $this->usuarioRepository->updateSenha($usuario->getId(), $novoHash);

            $this->usuarioRepository->clearResetToken($usuario->getId());

            return [
                'success' => true,
                'message' => 'Senha redefinida com sucesso',
                'usuario_id' => $usuario->getId()
            ];
        } catch (\Exception $e) {
            error_log('Erro ao redefinir senha: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Gera um token seguro e aleatório
     * 
     * Usa `random_bytes()` para gerar bytes criptograficamente seguros
     * e `bin2hex()` para converter em string hexadecimal
     * 
     * @return string Token hexadecimal seguro
     */
    private function gerarTokenSeguro(): string
    {
        try {
            $randomBytes = random_bytes(32);
            return bin2hex($randomBytes);
        } catch (\Exception $e) {
            error_log('Erro ao gerar token seguro: ' . $e->getMessage());
            throw new \Exception('Erro ao gerar token de recuperação: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
