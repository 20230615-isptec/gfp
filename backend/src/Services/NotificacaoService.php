<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Notificacao;
use Src\Repositories\NotificacaoRepository;

class NotificacaoService
{
    private NotificacaoRepository $notificacaoRepository;

    public function __construct(NotificacaoRepository $notificacaoRepository)
    {
        $this->notificacaoRepository = $notificacaoRepository;
    }

    public function criarNotificacao(int $userId, string $titulo, string $mensagem): void
    {
        $notificacao = new Notificacao(
            utilizadorId: $userId,
            titulo: trim($titulo),
            mensagem: trim($mensagem)
        );

        $ok = $this->notificacaoRepository->inserir($notificacao);
        if (!$ok) {
            throw new \RuntimeException('Falha ao criar notificacao');
        }
    }

    public function listarNaoLidas(int $userId): array
    {
        return $this->notificacaoRepository->listarNaoLidas($userId);
    }

    public function listarTodas(int $userId): array
    {
        return $this->notificacaoRepository->listarPorUtilizador($userId);
    }

    public function marcarComoLida(int $id, int $userId): bool
    {
        return $this->notificacaoRepository->marcarComoLida($id, $userId);
    }

    public function marcarTodasComoLidas(int $userId): int
    {
        return $this->notificacaoRepository->marcarTodasComoLidas($userId);
    }
}
?>
