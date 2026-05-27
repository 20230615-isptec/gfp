<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Transacao;
use Src\Models\TransacaoRecorrente;
use Src\Repositories\CategoriaRepository;
use Src\Repositories\MetaFinanceiraRepository;
use Src\Repositories\TransacaoRecorrenteRepository;
use Src\Repositories\TransacaoRepository;

class TransacaoRecorrenteService
{
    private TransacaoRecorrenteRepository $recorrenteRepository;
    private TransacaoRepository $transacaoRepository;
    private CategoriaRepository $categoriaRepository;
    private MetaFinanceiraRepository $metaFinanceiraRepository;
    private NotificacaoService $notificacaoService;

    public function __construct(
        TransacaoRecorrenteRepository $recorrenteRepository,
        TransacaoRepository $transacaoRepository,
        CategoriaRepository $categoriaRepository,
        MetaFinanceiraRepository $metaFinanceiraRepository,
        NotificacaoService $notificacaoService
    ) {
        $this->recorrenteRepository = $recorrenteRepository;
        $this->transacaoRepository = $transacaoRepository;
        $this->categoriaRepository = $categoriaRepository;
        $this->metaFinanceiraRepository = $metaFinanceiraRepository;
        $this->notificacaoService = $notificacaoService;
    }

    public function processarRecorrenciasGatilho(int $utilizadorId): void
    {
        $hoje = new \DateTimeImmutable('today');
        $diaAtual = (int)$hoje->format('j');
        $diaSemanaAtual = (int)$hoje->format('N');

        $regrasAtivas = $this->recorrenteRepository->listarAtivasPorUtilizador($utilizadorId);

        foreach ($regrasAtivas as $regra) {
            $diaVencimento = (int)$regra['dia_vencimento'];
            $frequencia = (string)$regra['frequencia'];

            if ($frequencia === 'semanal') {
                if ($diaSemanaAtual < $diaVencimento) {
                    continue;
                }
            } else {
                if ($diaAtual < $diaVencimento) {
                    continue;
                }
            }

            if (!$this->deveGerarNoPeriodoAtual($frequencia, $regra['ultima_geracao'] ?? null, $hoje)) {
                continue;
            }

            if ((string)$regra['tipo'] === 'despesa') {
                $saldoDisponivel = $this->calcularSaldoDisponivel($utilizadorId);
                if ((float)$regra['valor'] > $saldoDisponivel) {
                    $this->notificacaoService->criarNotificacao(
                        $utilizadorId,
                        'Recorrencia nao gerada',
                        sprintf(
                            'A recorrencia "%s" nao foi criada por saldo insuficiente. Disponivel: %.2f.',
                            (string)$regra['descricao'],
                            $saldoDisponivel
                        )
                    );
                    continue;
                }
            }

            $transacao = new Transacao(
                utilizadorId: $utilizadorId,
                categoriaId: (int)$regra['categoria_id'],
                valor: (float)$regra['valor'],
                tipo: (string)$regra['tipo'],
                data: $hoje->format('Y-m-d'),
                descricao: (string)$regra['descricao']
            );

            $this->transacaoRepository->create($transacao);
            $this->recorrenteRepository->atualizarUltimaGeracao((int)$regra['id'], $utilizadorId, $hoje->format('Y-m-d'));
        }
    }

    public function criarRegra(int $utilizadorId, array $dados): bool
    {
        $categoriaId = (int)($dados['categoria_id'] ?? 0);
        $valor = (float)($dados['valor'] ?? 0);
        $tipo = (string)($dados['tipo'] ?? '');
        $descricao = trim((string)($dados['descricao'] ?? ''));
        $frequencia = (string)($dados['frequencia'] ?? 'mensal');
        $diaVencimento = (int)($dados['dia_vencimento'] ?? 0);

        if ($tipo !== 'receita' && $tipo !== 'despesa') {
            throw new \InvalidArgumentException('Tipo deve ser receita ou despesa');
        }

        if ($frequencia !== 'mensal' && $frequencia !== 'semanal') {
            throw new \InvalidArgumentException('Frequencia deve ser mensal ou semanal');
        }

        if ($categoriaId <= 0 || $valor <= 0 || $descricao === '') {
            throw new \InvalidArgumentException('Dados invalidos para recorrencia');
        }

        if ($frequencia === 'semanal') {
            if ($diaVencimento < 1 || $diaVencimento > 7) {
                throw new \InvalidArgumentException('Para frequencia semanal, dia_vencimento deve estar entre 1 e 7');
            }
        } elseif ($diaVencimento < 1 || $diaVencimento > 31) {
            throw new \InvalidArgumentException('Para frequencia mensal, dia_vencimento deve estar entre 1 e 31');
        }

        if (!$this->categoriaRepository->belongsToUser($categoriaId, $utilizadorId)) {
            throw new \InvalidArgumentException('Categoria invalida para este utilizador');
        }

        $regra = new TransacaoRecorrente(
            utilizadorId: $utilizadorId,
            categoriaId: $categoriaId,
            valor: $valor,
            tipo: $tipo,
            descricao: $descricao,
            frequencia: $frequencia,
            diaVencimento: $diaVencimento,
            ultimaGeracao: null,
            ativo: true
        );

        return $this->recorrenteRepository->criar($regra);
    }

    public function listarRegras(int $utilizadorId): array
    {
        return $this->recorrenteRepository->listarPorUtilizador($utilizadorId);
    }

    public function desativarRegra(int $id, int $utilizadorId): bool
    {
        return $this->recorrenteRepository->desativar($id, $utilizadorId);
    }

    private function deveGerarNoPeriodoAtual(string $frequencia, ?string $ultimaGeracao, \DateTimeImmutable $hoje): bool
    {
        if ($ultimaGeracao === null || $ultimaGeracao === '') {
            return true;
        }

        $ultima = \DateTimeImmutable::createFromFormat('Y-m-d', $ultimaGeracao);
        if ($ultima === false) {
            return true;
        }

        if ($frequencia === 'semanal') {
            return $ultima->format('o-W') !== $hoje->format('o-W');
        }

        return $ultima->format('Y-m') !== $hoje->format('Y-m');
    }

    private function calcularSaldoDisponivel(int $utilizadorId): float
    {
        $transacoes = $this->transacaoRepository->findByUser($utilizadorId);
        $receitas = 0.0;
        $despesas = 0.0;

        foreach ($transacoes as $transacao) {
            if ($transacao->getTipo() === 'receita') {
                $receitas += $transacao->getValor();
            } elseif ($transacao->getTipo() === 'despesa') {
                $despesas += $transacao->getValor();
            }
        }

        $reservadoMetas = $this->metaFinanceiraRepository->obterTotalReservadoAtivo($utilizadorId);
        return max(0.0, ($receitas - $despesas) - $reservadoMetas);
    }
}
?>
