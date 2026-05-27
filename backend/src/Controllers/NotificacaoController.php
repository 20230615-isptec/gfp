<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\NotificacaoService;

class NotificacaoController
{
    private NotificacaoService $notificacaoService;

    public function __construct(NotificacaoService $notificacaoService)
    {
        $this->notificacaoService = $notificacaoService;
    }

    public function listar(array $utilizadorLogado): void
    {
        try {
            $userId = (int)$utilizadorLogado['id'];
            $todas = isset($_GET['tipo']) && $_GET['tipo'] === 'all';
            $notificacoes = $todas
                ? $this->notificacaoService->listarTodas($userId)
                : $this->notificacaoService->listarNaoLidas($userId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $notificacoes,
                'total' => count($notificacoes)
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao listar notificacoes: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao listar notificacoes'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function marcarLida(array $utilizadorLogado): void
    {
        try {
            $userId = (int)$utilizadorLogado['id'];
            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campo obrigatorio: id'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $id = (int)$input['id'];
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID invalido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $ok = $this->notificacaoService->marcarComoLida($id, $userId);
            if (!$ok) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Notificacao nao encontrada'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Notificacao marcada como lida'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao marcar notificacao como lida: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao marcar notificacao'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function marcarTodasLidas(array $utilizadorLogado): void
    {
        try {
            $userId = (int)$utilizadorLogado['id'];
            $total = $this->notificacaoService->marcarTodasComoLidas($userId);
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Notificacoes marcadas como lidas',
                'total' => $total
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao marcar todas notificacoes: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao marcar notificacoes'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
