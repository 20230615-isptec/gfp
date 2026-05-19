<?php
declare(strict_types=1);

namespace Src\Models;

/**
 * Classe Model - Categoria
 * 
 * Entidade representando uma categoria de transação (receita ou despesa).
 * Pode ser global (utilizador_id = null) ou específica do utilizador.
 * 
 * @package Src\Models
 */
class Categoria
{
    /**
     * Identificador único da categoria
     * @var int|null
     */
    private ?int $id;

    /**
     * Nome da categoria
     * @var string
     */
    private string $nome;

    /**
     * Tipo de categoria (receita ou despesa)
     * @var string
     */
    private string $tipo;

    /**
     * ID do utilizador (null para categorias globais)
     * @var int|null
     */
    private ?int $utilizadorId;

    /**
     * Construtor do Model Categoria
     * 
     * @param string $nome
     * @param string $tipo ('receita' ou 'despesa')
     * @param int|null $utilizadorId
     * @param int|null $id
     */
    public function __construct(
        string $nome,
        string $tipo,
        ?int $utilizadorId = null,
        ?int $id = null
    ) {
        $this->nome = $nome;
        $this->tipo = $tipo;
        $this->utilizadorId = $utilizadorId;
        $this->id = $id;
    }

    /**
     * Obtém o identificador único da categoria
     * 
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Obtém o nome da categoria
     * 
     * @return string
     */
    public function getNome(): string
    {
        return $this->nome;
    }

    /**
     * Obtém o tipo da categoria
     * 
     * @return string
     */
    public function getTipo(): string
    {
        return $this->tipo;
    }

    /**
     * Obtém o ID do utilizador
     * 
     * @return int|null
     */
    public function getUtilizadorId(): ?int
    {
        return $this->utilizadorId;
    }

    /**
     * Define o ID da categoria (após inserção no BD)
     * 
     * @param int $id
     * @return void
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }
}
?>
