<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\UsuarioRepository;

class PasswordRecoveryService
{
    private UsuarioRepository $usuarioRepository;
    private const TOKEN_EXPIRATION = 3600;

    public function __construct(UsuarioRepository $usuarioRepository)
    {
        $this->usuarioRepository = $usuarioRepository;
    }

    public function solicitarRecuperacao(string $email): array
    {
        $email = trim($email);
        if ($email === '') {
            throw new \Exception('Email e obrigatorio');
        }

        $usuario = $this->usuarioRepository->findByEmail($email);
        if ($usuario === null) {
            // Resposta generica para nao expor se o email existe.
            return [
                'success' => true,
                'message' => 'Se o email existir, enviaremos instrucoes para redefinicao de senha.'
            ];
        }

        $resetToken = $this->gerarTokenSeguro();
        $this->usuarioRepository->saveResetToken($usuario->getId(), $resetToken, self::TOKEN_EXPIRATION);
        $this->enviarEmailRecuperacaoMock($email, $resetToken);

        return [
            'success' => true,
            'message' => 'Se o email existir, enviaremos instrucoes para redefinicao de senha.',
            'expires_in' => self::TOKEN_EXPIRATION,
            'dev_token' => $resetToken
        ];
    }

    public function redefinirSenha(string $token, string $novaSenha): array
    {
        $token = trim($token);
        $novaSenha = trim($novaSenha);

        if ($token === '') {
            throw new \Exception('Token nao fornecido');
        }

        if ($novaSenha === '') {
            throw new \Exception('Nova senha e obrigatoria');
        }

        if (strlen($novaSenha) < 8) {
            throw new \Exception('Senha deve ter no minimo 8 caracteres');
        }

        $usuario = $this->usuarioRepository->findByResetToken($token);
        if ($usuario === null) {
            throw new \Exception('Token invalido ou expirado');
        }

        $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);
        $this->usuarioRepository->updateSenha($usuario->getId(), $novoHash);
        $this->usuarioRepository->clearResetToken($usuario->getId());

        return [
            'success' => true,
            'message' => 'Senha redefinida com sucesso'
        ];
    }

    private function gerarTokenSeguro(): string
    {
        return bin2hex(random_bytes(32));
    }

    private function enviarEmailRecuperacaoMock(string $email, string $token): void
    {
        $link = 'http://localhost:4200/reset-password?token=' . urlencode($token);
        error_log('[PasswordRecovery] Email mock para ' . $email . ' | Link: ' . $link);
    }
}
