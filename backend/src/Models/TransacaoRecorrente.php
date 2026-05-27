<?php
declare(strict_types=1);

namespace Src\Models;

class TransacaoRecorrente
{
    private ?int $id;
    private int $utilizadorId;
    private int $categoriaId;
    private float $valor;
    private string $tipo;
    private string $descricao;
    private string $frequencia;
    private int $diaVencimento;
    private ?string $ultimaGeracao;
    private bool $ativo;

    public function __construct(
        int $utilizadorId,
        int $categoriaId,
        float $valor,
        string $tipo,
        string $descricao,
        string $frequencia = 'mensal',
        int $diaVencimento = 1,
        ?string $ultimaGeracao = null,
        bool $ativo = true,
        ?int $id = null
    ) {
        $this->utilizadorId = $utilizadorId;
        $this->categoriaId = $categoriaId;
        $this->valor = $valor;
        $this->tipo = $tipo;
        $this->descricao = $descricao;
        $this->frequencia = $frequencia;
        $this->diaVencimento = $diaVencimento;
        $this->ultimaGeracao = $ultimaGeracao;
        $this->ativo = $ativo;
        $this->id = $id;
    }

    public function getId(): ?int { return $this->id; }
    public function getUtilizadorId(): int { return $this->utilizadorId; }
    public function getCategoriaId(): int { return $this->categoriaId; }
    public function getValor(): float { return $this->valor; }
    public function getTipo(): string { return $this->tipo; }
    public function getDescricao(): string { return $this->descricao; }
    public function getFrequencia(): string { return $this->frequencia; }
    public function getDiaVencimento(): int { return $this->diaVencimento; }
    public function getUltimaGeracao(): ?string { return $this->ultimaGeracao; }
    public function isAtivo(): bool { return $this->ativo; }

    public function setId(int $id): void { $this->id = $id; }
}
?>
