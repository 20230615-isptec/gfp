<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\DashboardService;
use Src\Services\MetaFinanceiraService;
use Src\Services\TransacaoRecorrenteService;

/**
 * Controlador de Dashboard
 * 
 * Responsável por processar requisições HTTP relacionadas ao painel de controlo:
 * - Resumo financeiro com cotações
 * 
 * Retorna respostas JSON com HTTP Status Codes apropriados.
 * 
 * @package Src\Controllers
 */
class DashboardController
{
    /**
     * Serviço de dashboard (Injeção de Dependência)
     * @var DashboardService
     */
    private DashboardService $dashboardService;
    private TransacaoRecorrenteService $transacaoRecorrenteService;
    private MetaFinanceiraService $metaFinanceiraService;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param DashboardService $dashboardService
     */
    public function __construct(
        DashboardService $dashboardService,
        TransacaoRecorrenteService $transacaoRecorrenteService,
        MetaFinanceiraService $metaFinanceiraService
    )
    {
        $this->dashboardService = $dashboardService;
        $this->transacaoRecorrenteService = $transacaoRecorrenteService;
        $this->metaFinanceiraService = $metaFinanceiraService;
    }

    /**
     * Endpoint: GET /api/dashboard
     * 
     * Retorna o resumo financeiro do utilizador autenticado
     * 
     * Incluindo:
     * - Total de receitas
     * - Total de despesas
     * - Saldo atual
     * - Cotações atuais de moedas (USD, EUR)
     * 
     * Response (200):
     * {
     *   "success": true,
     *   "resumo": {
     *     "receitas": 5000.00,
     *     "despesas": 2500.00,
     *     "saldo_atual": 2500.00,
     *     "total_transacoes": 15
     *   },
     *   "cotacoes_atuais": {
     *     "USD_BRL": {
     *       "cotacao": 5.25,
     *       "alta": 5.30,
     *       "baixa": 5.20
     *     },
     *     "EUR_BRL": { ... }
     *   },
     *   "data_atualizacao": "2024-05-17 15:30:45"
     * }
     * 
     * @param array $utilizadorLogado Dados do utilizador vindo do token JWT
     * @return void
     */
    public function resumo(array $utilizadorLogado): void
    {
        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $this->transacaoRecorrenteService->processarRecorrenciasGatilho($utilizadorId);
            $this->metaFinanceiraService->processarAlertasPrazo($utilizadorId);

            $resumo = $this->dashboardService->getResumoFinanceiro($utilizadorId);

            http_response_code(200);
            echo json_encode($resumo, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao obter resumo do dashboard: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao obter resumo financeiro'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: GET /api/relatorios/mensal?mes=X&ano=Y
     *
     * @param array<string, mixed> $utilizadorLogado
     * @return void
     */
    public function relatorioMensal(array $utilizadorLogado): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $mes = isset($_GET['mes']) ? (int)$_GET['mes'] : 0;
            $ano = isset($_GET['ano']) ? (int)$_GET['ano'] : 0;

            if ($mes <= 0 || $ano <= 0) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Parâmetros obrigatórios: mes e ano'
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                return;
            }

            $relatorio = $this->dashboardService->gerarRelatorioMensal($utilizadorId, $mes, $ano);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $relatorio
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao gerar relatório mensal: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao gerar relatório mensal'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }

    /**
     * Endpoint: GET /api/relatorios/tendencias
     *
     * @param array<string, mixed> $utilizadorLogado
     * @return void
     */
    public function tendencias(array $utilizadorLogado): void
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            $utilizadorId = (int)$utilizadorLogado['id'];
            $historico = $this->dashboardService->getTendenciasSeisMeses($utilizadorId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $historico,
                'total' => count($historico)
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            error_log('Erro ao obter tendências: ' . $e->getMessage());

            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Erro ao obter tendências'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        }
    }
}
?>
