<?php
declare(strict_types=1);

namespace Src\Models;

class Notificacao
{
    private ?int $id;
    private int $utilizadorId;
    private string $titulo;
    private string $mensagem;
    private bool $lida;
    private ?string $criadoEm;

    public function __construct(
        int $utilizadorId,
        string $titulo,
        string $mensagem,
        bool $lida = false,
        ?int $id = null,
        ?string $criadoEm = null
    ) {
        $this->utilizadorId = $utilizadorId;
        $this->titulo = $titulo;
        $this->mensagem = $mensagem;
        $this->lida = $lida;
        $this->id = $id;
        $this->criadoEm = $criadoEm;
    }

    public function getId(): ?int { return $this->id; }
    public function getUtilizadorId(): int { return $this->utilizadorId; }
    public function getTitulo(): string { return $this->titulo; }
    public function getMensagem(): string { return $this->mensagem; }
    public function isLida(): bool { return $this->lida; }
    public function getCriadoEm(): ?string { return $this->criadoEm; }

    public function setId(int $id): void { $this->id = $id; }
}
?>
