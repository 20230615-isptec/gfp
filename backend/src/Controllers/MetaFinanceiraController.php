<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\MetaFinanceiraService;

class MetaFinanceiraController
{
    private MetaFinanceiraService $service;

    public function __construct(MetaFinanceiraService $service)
    {
        $this->service = $service;
    }

    public function criar(array $utilizadorLogado): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'JSON invalido']);
                return;
            }

            $ok = $this->service->criarMeta((int)$utilizadorLogado['id'], $input);
            http_response_code($ok ? 201 : 500);
            echo json_encode(['success' => $ok]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('Erro ao criar meta: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao criar meta']);
        }
    }

    public function listar(array $utilizadorLogado): void
    {
        try {
            $ativas = isset($_GET['ativas']) && (int)$_GET['ativas'] === 1;
            $metas = $this->service->listarMetas((int)$utilizadorLogado['id'], $ativas);
            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $metas, 'total' => count($metas)]);
        } catch (\Throwable $e) {
            error_log('Erro ao listar metas: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao listar metas']);
        }
    }

    public function atualizar(array $utilizadorLogado): void
    {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'JSON invalido']);
                return;
            }

            $ok = $this->service->atualizarMeta($id, (int)$utilizadorLogado['id'], $input);
            if (!$ok) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Meta nao encontrada']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('Erro ao atualizar meta: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao atualizar meta']);
        }
    }

    public function desativar(array $utilizadorLogado): void
    {
        try {
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            $ok = $this->service->desativarMeta($id, (int)$utilizadorLogado['id']);
            if (!$ok) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Meta nao encontrada']);
                return;
            }
            http_response_code(200);
            echo json_encode(['success' => true]);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('Erro ao desativar meta: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao desativar meta']);
        }
    }

    public function aportar(array $utilizadorLogado): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!is_array($input)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'JSON invalido']);
                return;
            }

            $metaId = (int)($input['meta_id'] ?? 0);
            $valor = (float)($input['valor'] ?? 0);

            $ok = $this->service->adicionarAporte($metaId, (int)$utilizadorLogado['id'], $valor);
            http_response_code($ok ? 200 : 500);
            echo json_encode([
                'success' => $ok,
                'message' => 'Aporte registado com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao registrar aporte: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao registrar aporte'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
