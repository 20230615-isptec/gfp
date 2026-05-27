<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Orcamento;
use Src\Repositories\CategoriaRepository;
use Src\Repositories\OrcamentoRepository;

class OrcamentoService
{
    private OrcamentoRepository $orcamentoRepository;
    private CategoriaRepository $categoriaRepository;

    public function __construct(OrcamentoRepository $orcamentoRepository, CategoriaRepository $categoriaRepository)
    {
        $this->orcamentoRepository = $orcamentoRepository;
        $this->categoriaRepository = $categoriaRepository;
    }

    public function criarOrcamento(int $utilizadorId, int $categoriaId, float $valorLimite, int $mes, int $ano): bool
    {
        if ($valorLimite <= 0) {
            throw new \InvalidArgumentException('valor_limite deve ser maior que zero');
        }

        if ($mes < 1 || $mes > 12) {
            throw new \InvalidArgumentException('mes deve estar entre 1 e 12');
        }

        if ($ano < 2000 || $ano > 2100) {
            throw new \InvalidArgumentException('ano invalido');
        }

        if (!$this->categoriaRepository->belongsToUser($categoriaId, $utilizadorId)) {
            throw new \InvalidArgumentException('Categoria invalida para este utilizador');
        }

        if ($this->orcamentoRepository->existeOrcamentoPeriodo($utilizadorId, $categoriaId, $mes, $ano)) {
            throw new \InvalidArgumentException('Ja existe um orcamento para esta categoria neste mes/ano');
        }

        $orcamento = new Orcamento($utilizadorId, $categoriaId, $valorLimite, $mes, $ano);

        $criado = $this->orcamentoRepository->salvar($orcamento);
        if (!$criado) {
            throw new \RuntimeException('Falha ao criar orcamento');
        }

        return true;
    }

    public function listarOrcamentos(int $utilizadorId, int $mes, int $ano): array
    {
        if ($mes < 1 || $mes > 12) {
            throw new \InvalidArgumentException('mes deve estar entre 1 e 12');
        }

        if ($ano < 2000 || $ano > 2100) {
            throw new \InvalidArgumentException('ano invalido');
        }

        $orcamentos = $this->orcamentoRepository->listarPorUtilizador($utilizadorId, $mes, $ano);
        $resultado = [];

        foreach ($orcamentos as $orcamento) {
            $gastoAtual = $this->orcamentoRepository->buscarGastoAtual(
                (int)$orcamento['categoria_id'],
                $mes,
                $ano,
                $utilizadorId
            );
            $limite = (float)$orcamento['valor_limite'];
            $percentual = $limite > 0 ? ($gastoAtual / $limite) * 100 : 0.0;
            $status = $percentual > 100 ? 'excedido' : ($percentual > 80 ? 'aviso' : 'ok');

            $orcamento['gasto_atual'] = round($gastoAtual, 2);
            $orcamento['percentual_consumido'] = round($percentual, 2);
            $orcamento['status'] = $status;
            $resultado[] = $orcamento;
        }

        return $resultado;
    }

    public function obterStatusOrcamento(int $orcamentoId, int $utilizadorId): array
    {
        $orcamento = $this->orcamentoRepository->buscarPorId($orcamentoId, $utilizadorId);
        if ($orcamento === null) {
            throw new \InvalidArgumentException('Orcamento nao encontrado');
        }

        $gastoAtual = $this->orcamentoRepository->buscarGastoAtual(
            (int)$orcamento['categoria_id'],
            (int)$orcamento['mes'],
            (int)$orcamento['ano'],
            $utilizadorId
        );

        $limite = (float)$orcamento['valor_limite'];
        $percentualConsumido = $limite > 0 ? ($gastoAtual / $limite) * 100 : 0.0;
        $restante = $limite - $gastoAtual;

        $status = 'ok';
        if ($percentualConsumido > 100) {
            $status = 'excedido';
        } elseif ($percentualConsumido > 80) {
            $status = 'aviso';
        }

        return [
            'categoria' => (string)$orcamento['categoria'],
            'limite' => round($limite, 2),
            'gasto_atual' => round($gastoAtual, 2),
            'percentual_consumido' => round($percentualConsumido, 2),
            'restante' => round($restante, 2),
            'status' => $status,
        ];
    }

    /**
     * Obtém o percentual consumido do orçamento por categoria no mês/ano.
     *
     * @return array<string, mixed>|null
     */
    public function obterStatusPorCategoriaPeriodo(int $utilizadorId, int $categoriaId, int $mes, int $ano): ?array
    {
        $orcamentos = $this->orcamentoRepository->listarPorUtilizador($utilizadorId, $mes, $ano);
        $orcamentoCategoria = null;

        foreach ($orcamentos as $orcamento) {
            if ((int)$orcamento['categoria_id'] === $categoriaId) {
                $orcamentoCategoria = $orcamento;
                break;
            }
        }

        if ($orcamentoCategoria === null) {
            return null;
        }

        $gastoAtual = $this->orcamentoRepository->buscarGastoAtual($categoriaId, $mes, $ano, $utilizadorId);
        $limite = (float)$orcamentoCategoria['valor_limite'];
        $percentualConsumido = $limite > 0 ? ($gastoAtual / $limite) * 100 : 0.0;

        return [
            'categoria' => (string)$orcamentoCategoria['categoria'],
            'categoria_id' => (int)$orcamentoCategoria['categoria_id'],
            'limite' => round($limite, 2),
            'gasto_atual' => round($gastoAtual, 2),
            'percentual_consumido' => round($percentualConsumido, 2),
            'mes' => $mes,
            'ano' => $ano
        ];
    }
}
?>
