<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\TransacaoRecorrenteService;

class TransacaoRecorrenteController
{
    private TransacaoRecorrenteService $service;

    public function __construct(TransacaoRecorrenteService $service)
    {
        $this->service = $service;
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

            $this->service->criarRegra($utilizadorId, $input);

            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Regra recorrente criada com sucesso'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao criar regra recorrente: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao criar regra recorrente'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function listar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $dados = $this->service->listarRegras($utilizadorId);

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $dados, 'total' => count($dados)], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao listar regras recorrentes: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao listar regras recorrentes'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function desativar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Parametro 'id' e obrigatorio"], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $ok = $this->service->desativarRegra($id, $utilizadorId);
            if (!$ok) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Regra nao encontrada'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Regra recorrente desativada com sucesso'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao desativar regra recorrente: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erro interno ao desativar regra recorrente'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
