<?php
declare(strict_types=1);

namespace Src\Controllers;

use Src\Services\DashboardService;

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

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param DashboardService $dashboardService
     */
    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
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
}
?>
