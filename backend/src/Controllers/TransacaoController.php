<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\TransacaoService;

/**
 * Controlador de Transações
 * 
 * Responsável por processar requisições HTTP relacionadas a transações:
 * - Listagem de transações
 * - Criação de transações
 * - Remoção de transações
 * 
 * Retorna sempre respostas JSON com HTTP Status Codes apropriados.
 * 
 * @package Src\Controllers
 */
class TransacaoController
{
    /**
     * Serviço de transações (Injeção de Dependência)
     * @var TransacaoService
     */
    private TransacaoService $transacaoService;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param TransacaoService $transacaoService
     */
    public function __construct(TransacaoService $transacaoService)
    {
        $this->transacaoService = $transacaoService;
    }

    /**
     * Endpoint: GET /api/transacoes
     * 
     * Listar todas as transações do utilizador autenticado
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "data": [...],
     *   "total": 10
     * }
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function listar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $transacoes = $this->transacaoService->getTransacoesDoUtilizador($utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $transacoes,
                'total' => count($transacoes)
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao listar transações: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao listar transações'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: POST /api/transacoes
     * 
     * Criar uma nova transação para o utilizador autenticado
     * 
     * Request JSON esperado:
     * {
     *   "categoria_id": 1,
     *   "valor": 100.50,
     *   "tipo": "receita",
     *   "data": "2024-05-17",
     *   "descricao": "Descrição da transação"
     * }
     * 
     * Response (201):
     * {
     *   "success": true,
     *   "message": "Transação criada com sucesso"
     * }
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function criar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $input = json_decode(file_get_contents('php://input'), true);

            if ($input === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Request JSON inválido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $categoriaId = $input['categoria_id'] ?? null;
            $valor = $input['valor'] ?? null;
            $tipo = $input['tipo'] ?? null;
            $data = $input['data'] ?? null;
            $descricao = $input['descricao'] ?? '';

            if ($categoriaId === null || $valor === null || $tipo === null || $data === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campos obrigatórios: categoria_id, valor, tipo, data'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->transacaoService->adicionarTransacao(
                utilizadorId: $utilizadorId,
                categoriaId: (int)$categoriaId,
                valor: (float)$valor,
                tipo: (string)$tipo,
                data: (string)$data,
                descricao: (string)$descricao
            );

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Transação criada com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao criar transação: ' . $e->getMessage());

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: DELETE /api/transacoes?id=123
     * 
     * Remover uma transação do utilizador autenticado
     * 
     * Query Parameters:
     * - id (obrigatório): ID da transação a remover
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Transação removida com sucesso"
     * }
     * 
     * Response (400):
     * {
     *   "success": false,
     *   "message": "Parâmetro 'id' não fornecido"
     * }
     * 
     * Response (403):
     * {
     *   "success": false,
     *   "message": "Transação não encontrada ou você não tem permissão"
     * }
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function deletar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $id = $_GET['id'] ?? null;

            if ($id === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => "Parâmetro 'id' não fornecido"
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $id = (int)$id;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID deve ser um número válido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->transacaoService->removerTransacao($id, $utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Transação removida com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao deletar transação: ' . $e->getMessage());

            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: PUT /api/transacoes?id=123
     * 
     * Atualizar uma transação existente do utilizador autenticado
     * 
     * Query Parameters:
     * - id (obrigatório): ID da transação a atualizar
     * 
     * Request JSON esperado:
     * {
     *   "categoria_id": 1,
     *   "valor": 150.75,
     *   "tipo": "receita",
     *   "data": "2024-05-17",
     *   "descricao": "Descrição atualizada"
     * }
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Transação atualizada com sucesso"
     * }
     * 
     * Response (400):
     * {
     *   "success": false,
     *   "message": "Campos obrigatórios: ..."
     * }
     * 
     * Response (403):
     * {
     *   "success": false,
     *   "message": "Transação não encontrada ou você não tem permissão"
     * }
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function atualizar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $id = $_GET['id'] ?? null;

            if ($id === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => "Parâmetro 'id' não fornecido"
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $id = (int)$id;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID deve ser um número válido'
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

            $categoriaId = $input['categoria_id'] ?? null;
            $valor = $input['valor'] ?? null;
            $tipo = $input['tipo'] ?? null;
            $data = $input['data'] ?? null;
            $descricao = $input['descricao'] ?? '';

            if ($categoriaId === null || $valor === null || $tipo === null || $data === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campos obrigatórios: categoria_id, valor, tipo, data'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->transacaoService->editarTransacao(
                id: $id,
                utilizadorId: $utilizadorId,
                categoriaId: (int)$categoriaId,
                valor: (float)$valor,
                tipo: (string)$tipo,
                data: (string)$data,
                descricao: (string)$descricao
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Transação atualizada com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao atualizar transação: ' . $e->getMessage());

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
