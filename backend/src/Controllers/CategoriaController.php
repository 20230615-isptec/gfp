<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\CategoriaService;

/**
 * Controlador de Categorias
 * 
 * Responsável por processar requisições HTTP relacionadas a categorias:
 * - Listagem de categorias
 * - Criação de categorias personalizadas
 * 
 * Retorna sempre respostas JSON com HTTP Status Codes apropriados.
 * 
 * @package Src\Controllers
 */
class CategoriaController
{
    /**
     * Serviço de categorias (Injeção de Dependência)
     * @var CategoriaService
     */
    private CategoriaService $categoriaService;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param CategoriaService $categoriaService
     */
    public function __construct(CategoriaService $categoriaService)
    {
        $this->categoriaService = $categoriaService;
    }

    /**
     * Endpoint: GET /api/categorias
     * 
     * Listar todas as categorias disponíveis para o utilizador autenticado
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function listar(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $categorias = $this->categoriaService->getCategoriasDoUtilizador($utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $categorias,
                'total' => count($categorias)
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao listar categorias: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao listar categorias'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: POST /api/categorias
     * 
     * Criar uma nova categoria personalizada para o utilizador autenticado
     * 
     * Request JSON esperado:
     * {
     *   "nome": "Categoria Pessoal",
     *   "tipo": "receita"
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

            $nome = $input['nome'] ?? '';
            $tipo = $input['tipo'] ?? '';

            $nome = trim((string)$nome);
            $tipo = trim((string)$tipo);

            if (empty($nome) || empty($tipo)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campos obrigatórios: nome e tipo'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->categoriaService->criarCategoria($nome, $tipo, $utilizadorId);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Categoria criada com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao criar categoria: ' . $e->getMessage());

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: PUT /api/categorias?id=123
     * 
     * Atualizar uma categoria personalizada do utilizador autenticado
     * 
     * Query Parameters:
     * - id (obrigatório): ID da categoria a atualizar
     * 
     * Request JSON esperado:
     * {
     *   "nome": "Novo Nome",
     *   "tipo": "receita"
     * }
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Categoria atualizada com sucesso"
     * }
     * 
     * Response (400):
     * {
     *   "success": false,
     *   "message": "Campos obrigatórios: nome, tipo"
     * }
     * 
     * Response (403):
     * {
     *   "success": false,
     *   "message": "Categoria não encontrada ou você não tem permissão"
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

            $nome = $input['nome'] ?? null;
            $tipo = $input['tipo'] ?? null;

            if ($nome === null || $tipo === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Campos obrigatórios: nome, tipo'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $this->categoriaService->editarCategoria(
                id: $id,
                nome: (string)$nome,
                tipo: (string)$tipo,
                utilizadorId: $utilizadorId
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Categoria atualizada com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao atualizar categoria: ' . $e->getMessage());

            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: DELETE /api/categorias?id=123
     * 
     * Remover uma categoria personalizada do utilizador autenticado
     * 
     * Query Parameters:
     * - id (obrigatório): ID da categoria a remover
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "message": "Categoria removida com sucesso"
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
     *   "message": "Categoria não encontrada ou você não tem permissão"
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

            $this->categoriaService->removerCategoria($id, $utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Categoria removida com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao deletar categoria: ' . $e->getMessage());

            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
