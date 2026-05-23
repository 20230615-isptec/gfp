<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\UsuarioRepository;
use Src\Services\SmtpMailer;

class PasswordRecoveryService
{
    private UsuarioRepository $usuarioRepository;
    private SmtpMailer $mailer;
    private const TOKEN_EXPIRATION = 3600;

    public function __construct(UsuarioRepository $usuarioRepository, SmtpMailer $mailer)
    {
        $this->usuarioRepository = $usuarioRepository;
        $this->mailer = $mailer;
    }

    public function solicitarRecuperacao(string $email): array
    {
        $email = trim($email);
        if ($email === '') {
            throw new \Exception('Email e obrigatorio');
        }

        $usuario = $this->usuarioRepository->findByEmail($email);
        if ($usuario === null) {
            error_log('[PasswordRecovery] Email nao encontrado para recuperacao: ' . $email);
            // Resposta generica para nao expor se o email existe.
            return [
                'success' => true,
                'message' => 'Se o email existir, enviaremos instrucoes para redefinicao de senha.'
            ];
        }

        $resetToken = $this->gerarTokenSeguro();
        $this->usuarioRepository->saveResetToken($usuario->getId(), $resetToken, self::TOKEN_EXPIRATION);
        error_log('[PasswordRecovery] Token gerado para usuario ID ' . $usuario->getId() . ' email ' . $email);
        $this->enviarEmailRecuperacao($email, $resetToken);

        return [
            'success' => true,
            'message' => 'Se o email existir, enviaremos instrucoes para redefinicao de senha.',
            'expires_in' => self::TOKEN_EXPIRATION
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

    private function enviarEmailRecuperacao(string $email, string $token): void
    {
        $frontendBase = defined('FRONTEND_URL') ? rtrim((string) FRONTEND_URL, '/') : 'http://localhost:4200';
        $link = $frontendBase . '/reset-password?token=' . urlencode($token);
        $subject = 'Recuperacao de senha - FinanSmart';
        $message = "Ola,\n\nRecebemos uma solicitacao de recuperacao de senha.\n";
        $message .= "Use este link para redefinir sua senha (expira em 1 hora):\n$link\n\n";
        $message .= "Se nao foi voce, ignore este email.\n";

        try {
            $this->mailer->send($email, $subject, $message);
            error_log('[PasswordRecovery] SMTP enviado com sucesso para ' . $email);
        } catch (\Throwable $e) {
            error_log('[PasswordRecovery] Falha SMTP para ' . $email . ': ' . $e->getMessage() . ' | Link fallback: ' . $link);
            throw new \Exception('Falha ao enviar email de recuperacao. Verifique a configuracao SMTP.');
        }
    }
}
