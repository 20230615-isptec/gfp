<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Repositories\UsuarioRepository;

/**
 * Controlador de Administração
 * 
 * Responsável por processar requisições HTTP de operações administrativas:
 * - Listagem de todos os utilizadores
 * 
 * Protegido pelo AdminMiddleware - apenas Administradores têm acesso.
 * Retorna respostas JSON com HTTP Status Codes apropriados.
 * 
 * @package Src\Controllers
 */
class AdminController
{
    /**
     * Repositório de utilizadores (Injeção de Dependência)
     * @var UsuarioRepository
     */
    private UsuarioRepository $usuarioRepository;

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
     * Endpoint: GET /api/admin/utilizadores
     * 
     * Lista todos os utilizadores do sistema (apenas para Administradores)
     * 
     * Informações retornadas por utilizador:
     * - ID
     * - Nome
     * - Email
     * - Tipo de Utilizador ID
     * - Data de Criação
     * 
     * NOTA: Senhas NÃO são retornadas por segurança
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "nome": "Administrador",
     *       "email": "admin@financas.com",
     *       "tipo_usuario_id": 1,
     *       "criado_em": "2024-05-17 10:00:00"
     *     },
     *     ...
     *   ],
     *   "total": 5
     * }
     * 
     * @param array $adminLogado Dados do utilizador administrador vindo do token JWT
     * @return void
     */
    public function listarTodosUtilizadores(array $adminLogado): void
    {
        try {
            $utilizadores = $this->usuarioRepository->listarTodos();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $utilizadores,
                'total' => count($utilizadores),
                'admin_id' => (int)$adminLogado['id']
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao listar utilizadores: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao listar utilizadores'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: PUT /api/admin/utilizadores?id=X
     * 
     * Atualiza o tipo de um utilizador (Admin ↔ Utilizador)
     * 
     * Request body:
     * {
     *   "tipo_usuario_id": 1 ou 2
     * }
     * 
     * @param array $adminLogado Dados do utilizador administrador
     * @return void
     */
    public function atualizarTipoUsuario(array $adminLogado): void
    {
        try {
            $utilizadorId = (int)($_GET['id'] ?? 0);

            if ($utilizadorId === 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID do utilizador não fornecido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['tipo_usuario_id']) || !in_array($data['tipo_usuario_id'], [1, 2])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Tipo de utilizador inválido (1=Admin, 2=Utilizador)'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            // Impedir que o admin se remova a si próprio
            if ($utilizadorId === $adminLogado['id'] && $data['tipo_usuario_id'] !== 1) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Não pode remover as suas permissões de administrador'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->usuarioRepository->updateTipoUsuario($utilizadorId, $data['tipo_usuario_id']);

            if (!$resultado) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao atualizar tipo de utilizador'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Tipo de utilizador atualizado com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao atualizar tipo de utilizador: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao atualizar tipo de utilizador'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: DELETE /api/admin/utilizadores?id=X
     * 
     * Elimina (soft-delete) um utilizador do sistema
     * 
     * @param array $adminLogado Dados do utilizador administrador
     * @return void
     */
    public function eliminarUtilizador(array $adminLogado): void
    {
        try {
            $utilizadorId = (int)($_GET['id'] ?? 0);

            if ($utilizadorId === 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID do utilizador não fornecido'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            // Impedir que o admin se elimine a si próprio
            if ($utilizadorId === $adminLogado['id']) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Não pode eliminar a sua própria conta'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->usuarioRepository->delete($utilizadorId);

            if (!$resultado) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao eliminar utilizador'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Utilizador eliminado com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao eliminar utilizador: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao eliminar utilizador'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: PATCH /api/admin/utilizadores?id=X&ativo=0|1
     * 
     * Bloqueia ou desbloqueia um utilizador
     * 
     * @param array $adminLogado Dados do utilizador administrador
     * @return void
     */
    public function bloquearUtilizador(array $adminLogado): void
    {
        try {
            $utilizadorId = (int)($_GET['id'] ?? 0);
            $ativo = isset($_GET['ativo']) ? (bool)(int)$_GET['ativo'] : null;

            if ($utilizadorId === 0 || $ativo === null) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'ID e status (ativo=0|1) são obrigatórios'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            // Impedir que o admin se bloqueie a si próprio
            if ($utilizadorId === $adminLogado['id'] && !$ativo) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Não pode bloquear a sua própria conta'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $resultado = $this->usuarioRepository->updateAtivo($utilizadorId, $ativo);

            if (!$resultado) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Erro ao atualizar status do utilizador'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $statusMsg = $ativo ? 'Utilizador desbloqueado' : 'Utilizador bloqueado';
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => $statusMsg . ' com sucesso'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao bloquear/desbloquear utilizador: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao atualizar status do utilizador'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
