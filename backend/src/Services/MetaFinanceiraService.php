<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\MetaFinanceira;
use Src\Repositories\MetaFinanceiraRepository;
use Src\Repositories\TransacaoRepository;

class MetaFinanceiraService
{
    private MetaFinanceiraRepository $metaRepository;
    private NotificacaoService $notificacaoService;
    private TransacaoRepository $transacaoRepository;

    public function __construct(
        MetaFinanceiraRepository $metaRepository,
        NotificacaoService $notificacaoService,
        TransacaoRepository $transacaoRepository
    )
    {
        $this->metaRepository = $metaRepository;
        $this->notificacaoService = $notificacaoService;
        $this->transacaoRepository = $transacaoRepository;
    }

    public function processarAlertasPrazo(int $utilizadorId): void
    {
        $hoje = new \DateTimeImmutable('today');
        $metas = $this->metaRepository->listarAtivasPorUtilizador($utilizadorId);

        foreach ($metas as $meta) {
            $dataLimite = \DateTimeImmutable::createFromFormat('Y-m-d', (string)$meta['data_limite']);
            if ($dataLimite === false) {
                continue;
            }

            $diasRestantes = (int)$hoje->diff($dataLimite)->format('%r%a');
            if ($diasRestantes < 0 || $diasRestantes > 7) {
                continue;
            }

            $valorObjetivo = (float)$meta['valor_objetivo'];
            $valorAtual = (float)$meta['valor_atual'];
            if ($valorAtual >= $valorObjetivo) {
                continue;
            }

            $ultimoAlerta = $meta['ultimo_alerta_em'] ?? null;
            if (is_string($ultimoAlerta) && str_starts_with($ultimoAlerta, $hoje->format('Y-m-d'))) {
                continue;
            }

            $titulo = 'Meta próxima do prazo';
            $mensagem = sprintf(
                'A meta "%s" termina em %d dia(s). Progresso atual: %.2f de %.2f.',
                (string)$meta['titulo'],
                $diasRestantes,
                $valorAtual,
                $valorObjetivo
            );

            $this->notificacaoService->criarNotificacao($utilizadorId, $titulo, $mensagem);
            $this->metaRepository->atualizarUltimoAlerta((int)$meta['id'], $utilizadorId, $hoje->format('Y-m-d H:i:s'));
        }
    }

    public function criarMeta(int $utilizadorId, array $dados): bool
    {
        $titulo = trim((string)($dados['titulo'] ?? ''));
        $valorObjetivo = (float)($dados['valor_objetivo'] ?? 0);
        $valorAtual = (float)($dados['valor_atual'] ?? 0);
        $dataLimite = (string)($dados['data_limite'] ?? '');

        if ($titulo === '' || $valorObjetivo <= 0 || $valorAtual < 0 || $dataLimite === '') {
            throw new \InvalidArgumentException('Campos obrigatorios: titulo, valor_objetivo, data_limite');
        }

        if ($valorAtual > $valorObjetivo) {
            throw new \InvalidArgumentException('valor_atual nao pode ser maior que valor_objetivo');
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataLimite)) {
            throw new \InvalidArgumentException('data_limite invalida');
        }

        $dataObj = \DateTimeImmutable::createFromFormat('Y-m-d', $dataLimite);
        if ($dataObj === false || $dataObj->format('Y-m-d') !== $dataLimite) {
            throw new \InvalidArgumentException('data_limite invalida');
        }

        if ($dataObj < new \DateTimeImmutable('today')) {
            throw new \InvalidArgumentException('data_limite nao pode estar no passado');
        }

        $meta = new MetaFinanceira(
            utilizadorId: $utilizadorId,
            titulo: $titulo,
            valorObjetivo: $valorObjetivo,
            valorAtual: $valorAtual,
            dataLimite: $dataLimite,
            ativa: true
        );

        return $this->metaRepository->criar($meta);
    }

    public function listarMetas(int $utilizadorId, bool $apenasAtivas = false): array
    {
        return $this->metaRepository->listarPorUtilizador($utilizadorId, $apenasAtivas);
    }

    public function obterTotalReservadoAtivo(int $utilizadorId): float
    {
        return $this->metaRepository->obterTotalReservadoAtivo($utilizadorId);
    }

    public function atualizarMeta(int $id, int $utilizadorId, array $dados): bool
    {
        if ($id <= 0) {
            throw new \InvalidArgumentException('ID invalido');
        }

        $permitidos = ['titulo', 'valor_objetivo', 'valor_atual', 'data_limite', 'ativa'];
        $dados = array_intersect_key($dados, array_flip($permitidos));
        if ($dados === []) {
            throw new \InvalidArgumentException('Nenhum campo valido para atualizar');
        }

        if (array_key_exists('titulo', $dados)) {
            $dados['titulo'] = trim((string)$dados['titulo']);
            if ($dados['titulo'] === '') {
                throw new \InvalidArgumentException('titulo e obrigatorio');
            }
        }

        if (array_key_exists('valor_objetivo', $dados)) {
            $dados['valor_objetivo'] = (float)$dados['valor_objetivo'];
            if ($dados['valor_objetivo'] <= 0) {
                throw new \InvalidArgumentException('valor_objetivo deve ser maior que zero');
            }
        }

        if (array_key_exists('valor_atual', $dados)) {
            $dados['valor_atual'] = (float)$dados['valor_atual'];
            if ($dados['valor_atual'] < 0) {
                throw new \InvalidArgumentException('valor_atual nao pode ser negativo');
            }
        }

        if (array_key_exists('data_limite', $dados)) {
            $dados['data_limite'] = (string)$dados['data_limite'];
            $dataObj = \DateTimeImmutable::createFromFormat('Y-m-d', $dados['data_limite']);
            if ($dataObj === false || $dataObj->format('Y-m-d') !== $dados['data_limite']) {
                throw new \InvalidArgumentException('data_limite invalida');
            }
        }

        if (array_key_exists('ativa', $dados)) {
            $dados['ativa'] = (int)((bool)$dados['ativa']);
        }

        return $this->metaRepository->atualizar($id, $utilizadorId, $dados);
    }

    public function desativarMeta(int $id, int $utilizadorId): bool
    {
        if ($id <= 0) {
            throw new \InvalidArgumentException('ID invalido');
        }

        return $this->metaRepository->desativar($id, $utilizadorId);
    }

    public function adicionarAporte(int $metaId, int $utilizadorId, float $valor): bool
    {
        if ($metaId <= 0 || $valor <= 0) {
            throw new \InvalidArgumentException('Meta e valor do aporte sao obrigatorios');
        }

        $meta = $this->metaRepository->buscarPorId($metaId, $utilizadorId);
        if ($meta === null || !(bool)$meta['ativa']) {
            throw new \InvalidArgumentException('Meta nao encontrada ou inativa');
        }

        $saldoDisponivel = $this->calcularSaldoDisponivel($utilizadorId);
        if ($valor > $saldoDisponivel) {
            throw new \InvalidArgumentException(sprintf(
                'Saldo insuficiente para poupar. Disponivel para gastar: %.2f',
                $saldoDisponivel
            ));
        }

        $novoValorAtual = (float)$meta['valor_atual'] + $valor;
        $this->metaRepository->atualizar($metaId, $utilizadorId, ['valor_atual' => $novoValorAtual]);

        return $this->metaRepository->registrarMovimento(
            $metaId,
            $utilizadorId,
            $valor,
            'aporte',
            'Aporte para meta: ' . (string)$meta['titulo']
        );
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

        $reservadoMetas = $this->metaRepository->obterTotalReservadoAtivo($utilizadorId);
        return max(0.0, ($receitas - $despesas) - $reservadoMetas);
    }
}
?>
