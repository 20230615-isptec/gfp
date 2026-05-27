<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\UsuarioRepository;
use Src\Repositories\TransacaoRepository;
use Src\Repositories\MetaFinanceiraRepository;

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
    private UsuarioRepository $usuarioRepository;
    private MetaFinanceiraRepository $metaFinanceiraRepository;

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
    public function __construct(
        TransacaoRepository $transacaoRepository,
        UsuarioRepository $usuarioRepository,
        MetaFinanceiraRepository $metaFinanceiraRepository
    )
    {
        $this->transacaoRepository = $transacaoRepository;
        $this->usuarioRepository = $usuarioRepository;
        $this->metaFinanceiraRepository = $metaFinanceiraRepository;
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

            $cotacoesAtuais = $this->obterCotacoes();
            $moedaPreferida = 'AOA';
            $usuario = $this->usuarioRepository->findById($utilizadorId);
            if ($usuario !== null && $usuario->getMoedaPreferida() !== '') {
                $moedaPreferida = strtoupper($usuario->getMoedaPreferida());
            }

            $totalReceitasConvertido = $this->converterDeAoa($totalReceitas, $moedaPreferida, $cotacoesAtuais);
            $totalDespesasConvertido = $this->converterDeAoa($totalDespesas, $moedaPreferida, $cotacoesAtuais);
            $patrimonioTotal = $totalReceitasConvertido - $totalDespesasConvertido;
            $totalMetasAoa = $this->metaFinanceiraRepository->obterTotalReservadoAtivo($utilizadorId);
            $totalMetas = $this->converterDeAoa($totalMetasAoa, $moedaPreferida, $cotacoesAtuais);
            $divida = max(0.0, abs(min(0.0, $patrimonioTotal)));
            $saldoDisponivel = $divida > 0.0 ? 0.0 : max(0.0, $patrimonioTotal - $totalMetas);

            return [
                'success' => true,
                'resumo' => [
                    'receitas' => round($totalReceitasConvertido, 2),
                    'despesas' => round($totalDespesasConvertido, 2),
                    'saldo_atual' => round($patrimonioTotal, 2),
                    'saldo_disponivel' => round($saldoDisponivel, 2),
                    'divida' => round($divida, 2),
                    'em_divida' => $divida > 0.0,
                    'total_em_metas' => round($totalMetas, 2),
                    'patrimonio_total' => round($patrimonioTotal, 2),
                    'total_transacoes' => count($transacoes),
                    'moeda' => $moedaPreferida
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

    /**
     * Gera relatório mensal com saldo, top despesa e comparação com mês anterior.
     *
     * @param int $utilizadorId
     * @param int $mes
     * @param int $ano
     * @return array<string, mixed>
     */
    public function gerarRelatorioMensal(int $utilizadorId, int $mes, int $ano): array
    {
        if ($mes < 1 || $mes > 12) {
            throw new \InvalidArgumentException('mes deve estar entre 1 e 12');
        }

        if ($ano < 2000 || $ano > 2100) {
            throw new \InvalidArgumentException('ano invalido');
        }

        $gastosPorCategoria = $this->transacaoRepository->getGastosPorCategoria($utilizadorId, $mes, $ano);

        $totalDespesas = 0.0;
        foreach ($gastosPorCategoria as $gasto) {
            $totalDespesas += (float)($gasto['total_gasto'] ?? 0);
        }

        $dataInicio = sprintf('%04d-%02d-01', $ano, $mes);
        $dataFim = date('Y-m-t', strtotime($dataInicio));
        $receitasMes = $this->transacaoRepository->findByDateRange($utilizadorId, $dataInicio, $dataFim, 'receita');

        $totalReceitas = 0.0;
        foreach ($receitasMes as $transacao) {
            if ($transacao instanceof \Src\Models\Transacao) {
                $totalReceitas += $transacao->getValor();
            }
        }

        $saldoFinal = $totalReceitas - $totalDespesas;

        $topDespesa = null;
        if (!empty($gastosPorCategoria)) {
            $topDespesa = [
                'categoria_id' => (int)$gastosPorCategoria[0]['categoria_id'],
                'categoria' => (string)$gastosPorCategoria[0]['categoria_nome'],
                'valor' => round((float)$gastosPorCategoria[0]['total_gasto'], 2)
            ];
        }

        $mesAnterior = $mes - 1;
        $anoAnterior = $ano;
        if ($mesAnterior === 0) {
            $mesAnterior = 12;
            $anoAnterior--;
        }

        $gastosMesAnterior = $this->transacaoRepository->getGastosPorCategoria($utilizadorId, $mesAnterior, $anoAnterior);
        $totalDespesasMesAnterior = 0.0;
        foreach ($gastosMesAnterior as $gastoAnterior) {
            $totalDespesasMesAnterior += (float)($gastoAnterior['total_gasto'] ?? 0);
        }

        $comparacaoTexto = 'Sem dados suficientes para comparação com o mês passado';
        $variacaoPercentual = null;
        if ($totalDespesasMesAnterior > 0) {
            $variacaoPercentual = (($totalDespesas - $totalDespesasMesAnterior) / $totalDespesasMesAnterior) * 100;
            $direcao = $variacaoPercentual >= 0 ? 'mais' : 'menos';
            $comparacaoTexto = sprintf(
                'Gastou %s %.2f%% do que no mês passado',
                $direcao,
                abs($variacaoPercentual)
            );
        }

        return [
            'periodo' => [
                'mes' => $mes,
                'ano' => $ano
            ],
            'saldo_final' => round($saldoFinal, 2),
            'total_receitas' => round($totalReceitas, 2),
            'total_despesas' => round($totalDespesas, 2),
            'top_despesa' => $topDespesa,
            'comparacao_mes_anterior' => [
                'mes' => $mesAnterior,
                'ano' => $anoAnterior,
                'variacao_percentual' => $variacaoPercentual !== null ? round($variacaoPercentual, 2) : null,
                'mensagem' => $comparacaoTexto
            ],
            'gastos_por_categoria' => array_map(
                static fn(array $item): array => [
                    'categoria_id' => (int)$item['categoria_id'],
                    'categoria' => (string)$item['categoria_nome'],
                    'total_gasto' => round((float)$item['total_gasto'], 2)
                ],
                $gastosPorCategoria
            )
        ];
    }

    /**
     * Obtém a tendência financeira dos últimos 6 meses.
     *
     * @param int $utilizadorId
     * @return array<int, array<string, mixed>>
     */
    public function getTendenciasSeisMeses(int $utilizadorId): array
    {
        $historico = $this->transacaoRepository->getHistoricoSeisMeses($utilizadorId);

        return array_map(
            static fn(array $linha): array => [
                'ano' => (int)$linha['ano'],
                'mes' => (int)$linha['mes'],
                'receitas' => round((float)$linha['total_receitas'], 2),
                'despesas' => round((float)$linha['total_despesas'], 2),
                'saldo' => round((float)$linha['total_receitas'] - (float)$linha['total_despesas'], 2)
            ],
            $historico
        );
    }

    private function converterDeAoa(float $valor, string $moedaPreferida, ?array $cotacoes): float
    {
        if ($moedaPreferida === 'AOA') {
            return $valor;
        }

        if ($cotacoes === null) {
            return $valor;
        }

        $key = 'AOA_' . $moedaPreferida;
        $taxa = $cotacoes[$key]['cotacao'] ?? null;
        if (!is_numeric($taxa) || (float)$taxa <= 0.0) {
            return $valor;
        }

        return $valor * (float)$taxa;
    }
}
?>
