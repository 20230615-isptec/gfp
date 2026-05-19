<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Repositories\UsuarioRepository;
use Src\Services\TransacaoService;

/**
 * Controlador de Exportação
 * 
 * Responsável por processar requisições HTTP de exportação de dados:
 * - Exportação de transações em formato CSV
 * - Exportação de utilizadores em formato CSV (admin)
 * 
 * Retorna ficheiros em formatos específicos (CSV) ao invés de JSON.
 * 
 * @package Src\Controllers
 */
class ExportacaoController
{
    /**
     * Serviço de transações (Injeção de Dependência)
     * @var TransacaoService
     */
    private TransacaoService $transacaoService;

    /**
     * Repositório de utilizadores (Injeção de Dependência)
     * @var UsuarioRepository
     */
    private UsuarioRepository $usuarioRepository;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param TransacaoService $transacaoService
     * @param UsuarioRepository $usuarioRepository
     */
    public function __construct(TransacaoService $transacaoService, UsuarioRepository $usuarioRepository)
    {
        $this->transacaoService = $transacaoService;
        $this->usuarioRepository = $usuarioRepository;
    }

    /**
     * Endpoint: GET /api/exportar/csv
     * 
     * Exporta todas as transações do utilizador autenticado em formato CSV
     * 
     * O ficheiro é automaticamente baixado pelo navegador com o nome
     * "extrato_financeiro.csv" contendo os seguintes campos:
     * - ID
     * - Categoria ID
     * - Valor
     * - Tipo (Receita/Despesa)
     * - Data
     * - Descrição
     * - Criado em
     * 
     * Nota: Esta é a ÚNICA rota que retorna um ficheiro, não JSON.
     * Os headers HTTP forçam o download.
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void (Encerra a execução com exit)
     */
    public function exportarCSV(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];

            $transacoes = $this->transacaoService->getTransacoesDoUtilizador($utilizadorId);

            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="extrato_financeiro_' . date('Y-m-d_H-i-s') . '.csv"');
            header('Pragma: no-cache');
            header('Expires: 0');

            $output = fopen('php://output', 'w');

            if ($output === false) {
                throw new \Exception('Erro ao abrir stream de saída');
            }

            $cabecalho = [
                'ID',
                'Categoria ID',
                'Valor',
                'Tipo',
                'Data',
                'Descrição',
                'Criado em'
            ];

            fputcsv($output, $cabecalho, ';', '"', '\\');

            foreach ($transacoes as $transacao) {
                $linha = [
                    $transacao['id'] ?? '',
                    $transacao['categoria_id'] ?? '',
                    number_format($transacao['valor'] ?? 0, 2, ',', ''),
                    ucfirst($transacao['tipo'] ?? ''),
                    $transacao['data'] ?? '',
                    $transacao['descricao'] ?? '',
                    $transacao['criado_em'] ?? ''
                ];

                fputcsv($output, $linha, ';', '"', '\\');
            }

            fclose($output);

            exit;
        } catch (\Exception $e) {
            error_log('Erro ao exportar CSV: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao exportar transações'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            exit;
        }
    }

    /**
     * Endpoint: GET /api/admin/exportar/usuarios
     *
     * Exporta a lista de utilizadores do sistema em formato CSV
     * Apenas administradores têm acesso.
     *
     * O ficheiro é baixado como "usuarios_sistema_YYYY-MM-DD_HH-MM-SS.csv".
     *
     * @param array $adminLogado Dados do administrador vindo do token JWT
     * @return void
     */
    public function exportarUsuariosCSV(array $adminLogado): void
    {
        try {
            $utilizadores = $this->usuarioRepository->listarTodos();

            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="usuarios_sistema_' . date('Y-m-d_H-i-s') . '.csv"');
            header('Pragma: no-cache');
            header('Expires: 0');

            $output = fopen('php://output', 'w');

            if ($output === false) {
                throw new \Exception('Erro ao abrir stream de saída');
            }

            $cabecalho = [
                'ID',
                'Nome',
                'Email',
                'Tipo',
                'Criado em'
            ];

            fputcsv($output, $cabecalho, ';', '"', '\\');

            foreach ($utilizadores as $utilizador) {
                $linha = [
                    $utilizador['id'] ?? '',
                    $utilizador['nome'] ?? '',
                    $utilizador['email'] ?? '',
                    ($utilizador['tipo_usuario_id'] === 1 ? 'Administrador' : 'Utilizador'),
                    $utilizador['criado_em'] ?? ''
                ];

                fputcsv($output, $linha, ';', '"', '\\');
            }

            fclose($output);
            exit;
        } catch (\Exception $e) {
            error_log('Erro ao exportar usuários CSV: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao exportar utilizadores'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

            exit;
        }
    }
}
?>
