<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\TransacaoRepository;

/**
 * Serviço de Dashboard
 * 
 * Camada de lógica de negócio para operações de relatórios e resumos financeiros:
 * - Cálculo de receitas, despesas e saldo
 * - Integração com API externa de cotações
 * - Preparação de dados para visualização
 * 
 * @package Src\Services
 */
class DashboardService
{
    /**
     * Repositório de transações (Injeção de Dependência)
     * @var TransacaoRepository
     */
    private TransacaoRepository $transacaoRepository;

    /**
     * URL da API externa de cotações
     */
    private const COTACOES_API_URL = 'https://open.er-api.com/v6/latest/AOA';

    /**
     * Timeout para requisição HTTP (em segundos)
     */
    private const API_TIMEOUT = 5;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param TransacaoRepository $transacaoRepository
     */
    public function __construct(TransacaoRepository $transacaoRepository)
    {
        $this->transacaoRepository = $transacaoRepository;
    }

    /**
     * Obtém o resumo financeiro do utilizador
     * 
     * Calcula totais de receitas e despesas, saldo atual e integra
     * dados de cotações de moedas de uma API externa.
     * 
     * @param int $utilizadorId ID do utilizador
     * @return array Resumo financeiro estruturado
     */
    public function getResumoFinanceiro(int $utilizadorId): array
    {
        try {
            $transacoes = $this->transacaoRepository->findByUser($utilizadorId);

            $totalReceitas = 0.0;
            $totalDespesas = 0.0;

            foreach ($transacoes as $transacao) {
                $tipo = null;
                $valor = 0.0;

                if ($transacao instanceof \Src\Models\Transacao) {
                    $tipo = $transacao->getTipo();
                    $valor = $transacao->getValor();
                } elseif (is_array($transacao)) {
                    $tipo = $transacao['tipo'] ?? null;
                    $valor = isset($transacao['valor']) ? (float)$transacao['valor'] : 0.0;
                }

                if ($tipo === 'receita') {
                    $totalReceitas += $valor;
                } elseif ($tipo === 'despesa') {
                    $totalDespesas += $valor;
                }
            }

            $saldoAtual = $totalReceitas - $totalDespesas;

            $cotacoesAtuais = $this->obterCotacoes();

            return [
                'success' => true,
                'resumo' => [
                    'receitas' => round($totalReceitas, 2),
                    'despesas' => round($totalDespesas, 2),
                    'saldo_atual' => round($saldoAtual, 2),
                    'total_transacoes' => count($transacoes)
                ],
                'cotacoes_atuais' => $cotacoesAtuais,
                'data_atualizacao' => date('Y-m-d H:i:s')
            ];
        } catch (\Exception $e) {
            error_log('Erro ao obter resumo financeiro: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Obtém as cotações de moedas de uma API externa
     * 
     * Faz uma requisição HTTP GET à API de economia.
     * Se a API não responder ou houver erro, retorna null silenciosamente
     * para não quebrar o resumo financeiro.
     * 
     * @return array|null Cotações descodificadas ou null em caso de falha
     */
    private function obterCotacoes(): ?array
    {
        try {
            $contexto = stream_context_create([
                'http' => [
                    'timeout' => self::API_TIMEOUT,
                    'user_agent' => 'PHP-App/1.0'
                ]
            ]);

            $resposta = @file_get_contents(self::COTACOES_API_URL, false, $contexto);

            if ($resposta === false) {
                error_log('Erro ao conectar à API de cotações');
                return null;
            }

            $dados = json_decode($resposta, true, 512, JSON_THROW_ON_ERROR);

            if ($dados === null) {
                error_log('Erro ao decodificar JSON da API de cotações');
                return null;
            }

            $cotacoes = [];

            if (isset($dados['result']) && $dados['result'] === 'success' && isset($dados['rates']) && is_array($dados['rates'])) {
                $rates = $dados['rates'];

                if (isset($rates['USD'])) {
                    $cotacoes['AOA_USD'] = [
                        'cotacao' => (float)$rates['USD'],
                        'alta' => 0.0,
                        'baixa' => 0.0,
                        'timestamp' => $dados['time_last_update_utc'] ?? null
                    ];
                }

                if (isset($rates['EUR'])) {
                    $cotacoes['AOA_EUR'] = [
                        'cotacao' => (float)$rates['EUR'],
                        'alta' => 0.0,
                        'baixa' => 0.0,
                        'timestamp' => $dados['time_last_update_utc'] ?? null
                    ];
                }

                if (isset($rates['BRL'])) {
                    $cotacoes['AOA_BRL'] = [
                        'cotacao' => (float)$rates['BRL'],
                        'alta' => 0.0,
                        'baixa' => 0.0,
                        'timestamp' => $dados['time_last_update_utc'] ?? null
                    ];
                }
            }

            return !empty($cotacoes) ? $cotacoes : null;
        } catch (\Exception $e) {
            error_log('Erro ao processar cotações: ' . $e->getMessage());
            return null;
        }
    }
}
?>
