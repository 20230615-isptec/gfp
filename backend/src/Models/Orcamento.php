<?php
declare(strict_types=1);

namespace Src\Models;

class Orcamento
{
    private ?int $id;
    private int $utilizadorId;
    private int $categoriaId;
    private float $valorLimite;
    private int $mes;
    private int $ano;
    private ?string $criadoEm;

    public function __construct(
        int $utilizadorId,
        int $categoriaId,
        float $valorLimite,
        int $mes,
        int $ano,
        ?int $id = null,
        ?string $criadoEm = null
    ) {
        $this->utilizadorId = $utilizadorId;
        $this->categoriaId = $categoriaId;
        $this->valorLimite = $valorLimite;
        $this->mes = $mes;
        $this->ano = $ano;
        $this->id = $id;
        $this->criadoEm = $criadoEm;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUtilizadorId(): int
    {
        return $this->utilizadorId;
    }

    public function getCategoriaId(): int
    {
        return $this->categoriaId;
    }

    public function getValorLimite(): float
    {
        return $this->valorLimite;
    }

    public function getMes(): int
    {
        return $this->mes;
    }

    public function getAno(): int
    {
        return $this->ano;
    }

    public function getCriadoEm(): ?string
    {
        return $this->criadoEm;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }
}
?>
