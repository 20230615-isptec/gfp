<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\PerfilService;

class PerfilController
{
    private PerfilService $perfilService;

    public function __construct(PerfilService $perfilService)
    {
        $this->perfilService = $perfilService;
    }

    /**
     * @param array<string, mixed> $utilizadorAutenticado
     */
    public function atualizar(array $utilizadorAutenticado): void
    {
        try {
            $utilizadorId = (int)($utilizadorAutenticado['id'] ?? 0);
            if ($utilizadorId <= 0) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Utilizador nao autenticado'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $perfil = $this->perfilService->atualizarPerfil(
                $utilizadorId,
                $_POST,
                $_FILES['avatar'] ?? null
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Perfil atualizado com sucesso',
                'data' => $perfil
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao atualizar perfil: ' . $e->getMessage() . ' ' . $e->getFile() . ':' . $e->getLine());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro interno ao atualizar perfil',
                'debug' => $e->getMessage() . ' - ' . $e->getFile() . ':' . $e->getLine()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    public function obter(array $utilizadorAutenticado): void
    {
        try {
            $utilizadorId = (int)($utilizadorAutenticado['id'] ?? 0);
            if ($utilizadorId <= 0) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'message' => 'Utilizador nao autenticado'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $perfil = $this->perfilService->obterPerfil($utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $perfil
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Throwable $e) {
            error_log('Erro ao obter perfil: ' . $e->getMessage() . ' no ficheiro ' . $e->getFile() . ':' . $e->getLine());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro interno ao obter perfil',
                'debug' => $e->getMessage() . ' - ' . $e->getFile() . ':' . $e->getLine()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
