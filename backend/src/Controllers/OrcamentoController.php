<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\OrcamentoService;

class OrcamentoController
{
    private OrcamentoService $orcamentoService;

    public function __construct(OrcamentoService $orcamentoService)
    {
        $this->orcamentoService = $orcamentoService;
    }

    public function criar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Request JSON invalido'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $categoriaId = (int)($input['categoria_id'] ?? 0);
            $valorLimite = (float)($input['valor_limite'] ?? 0);
            $mes = (int)($input['mes'] ?? 0);
            $ano = (int)($input['ano'] ?? 0);

            if ($categoriaId <= 0 || $valorLimite <= 0 || $mes <= 0 || $ano <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Campos obrigatorios: categoria_id, valor_limite, mes, ano'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->orcamentoService->criarOrcamento($utilizadorId, $categoriaId, $valorLimite, $mes, $ano);

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Orcamento criado com sucesso'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao criar orcamento: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao criar orcamento'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function listar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $mes = isset($_GET['mes']) ? (int)$_GET['mes'] : (int)date('n');
            $ano = isset($_GET['ano']) ? (int)$_GET['ano'] : (int)date('Y');

            $orcamentos = $this->orcamentoService->listarOrcamentos($utilizadorId, $mes, $ano);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $orcamentos,
                'total' => count($orcamentos),
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao listar orcamentos: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao listar orcamentos'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function obterStatus(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $orcamentoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($orcamentoId <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Parametro 'id' e obrigatorio"], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $status = $this->orcamentoService->obterStatusOrcamento($orcamentoId, $utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $status,
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao obter status do orcamento: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao obter status'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
