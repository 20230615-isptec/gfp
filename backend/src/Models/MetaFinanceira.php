<?php
declare(strict_types=1);

namespace Src\Models;

class MetaFinanceira
{
    private ?int $id;
    private int $utilizadorId;
    private string $titulo;
    private float $valorObjetivo;
    private float $valorAtual;
    private string $dataLimite;
    private bool $ativa;
    private ?string $ultimoAlertaEm;
    private ?string $criadoEm;

    public function __construct(
        int $utilizadorId,
        string $titulo,
        float $valorObjetivo,
        float $valorAtual,
        string $dataLimite,
        bool $ativa = true,
        ?int $id = null,
        ?string $ultimoAlertaEm = null,
        ?string $criadoEm = null
    ) {
        $this->utilizadorId = $utilizadorId;
        $this->titulo = $titulo;
        $this->valorObjetivo = $valorObjetivo;
        $this->valorAtual = $valorAtual;
        $this->dataLimite = $dataLimite;
        $this->ativa = $ativa;
        $this->id = $id;
        $this->ultimoAlertaEm = $ultimoAlertaEm;
        $this->criadoEm = $criadoEm;
    }

    public function getId(): ?int { return $this->id; }
    public function getUtilizadorId(): int { return $this->utilizadorId; }
    public function getTitulo(): string { return $this->titulo; }
    public function getValorObjetivo(): float { return $this->valorObjetivo; }
    public function getValorAtual(): float { return $this->valorAtual; }
    public function getDataLimite(): string { return $this->dataLimite; }
    public function isAtiva(): bool { return $this->ativa; }
    public function getUltimoAlertaEm(): ?string { return $this->ultimoAlertaEm; }
    public function getCriadoEm(): ?string { return $this->criadoEm; }
    public function setId(int $id): void { $this->id = $id; }
}
?>

