<?php
declare(strict_types=1);

namespace Src\Models;

/**
 * Classe Model - Transação
 * 
 * Entidade representando uma transação financeira (receita ou despesa).
 * Cada transação pertence a um utilizador e está associada a uma categoria.
 * 
 * @package Src\Models
 */
class Transacao
{
    /**
     * Identificador único da transação
     * @var int|null
     */
    private ?int $id;

    /**
     * ID do utilizador que efetuou a transação
     * @var int
     */
    private int $utilizadorId;

    /**
     * ID da categoria associada à transação
     * @var int
     */
    private int $categoriaId;

    /**
     * Valor da transação
     * @var float
     */
    private float $valor;

    /**
     * Tipo de transação (receita ou despesa)
     * @var string
     */
    private string $tipo;

    /**
     * Data da transação (formato Y-m-d)
     * @var string
     */
    private string $data;

    /**
     * Descrição ou nota da transação
     * @var string
     */
    private string $descricao;

    /**
     * Data e hora de criação do registo
     * @var string|null
     */
    private ?string $criadoEm;

    /**
     * Construtor do Model Transação
     * 
     * @param int $utilizadorId
     * @param int $categoriaId
     * @param float $valor
     * @param string $tipo ('receita' ou 'despesa')
     * @param string $data (formato Y-m-d)
     * @param string $descricao
     * @param int|null $id
     * @param string|null $criadoEm
     */
    public function __construct(
        int $utilizadorId,
        int $categoriaId,
        float $valor,
        string $tipo,
        string $data,
        string $descricao,
        ?int $id = null,
        ?string $criadoEm = null
    ) {
        $this->utilizadorId = $utilizadorId;
        $this->categoriaId = $categoriaId;
        $this->valor = $valor;
        $this->tipo = $tipo;
        $this->data = $data;
        $this->descricao = $descricao;
        $this->id = $id;
        $this->criadoEm = $criadoEm;
    }

    /**
     * Obtém o identificador único da transação
     * 
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Obtém o ID do utilizador
     * 
     * @return int
     */
    public function getUtilizadorId(): int
    {
        return $this->utilizadorId;
    }

    /**
     * Obtém o ID da categoria
     * 
     * @return int
     */
    public function getCategoriaId(): int
    {
        return $this->categoriaId;
    }

    /**
     * Obtém o valor da transação
     * 
     * @return float
     */
    public function getValor(): float
    {
        return $this->valor;
    }

    /**
     * Obtém o tipo da transação
     * 
     * @return string
     */
    public function getTipo(): string
    {
        return $this->tipo;
    }

    /**
     * Obtém a data da transação
     * 
     * @return string
     */
    public function getData(): string
    {
        return $this->data;
    }

    /**
     * Obtém a descrição da transação
     * 
     * @return string
     */
    public function getDescricao(): string
    {
        return $this->descricao;
    }

    /**
     * Obtém a data de criação
     * 
     * @return string|null
     */
    public function getCriadoEm(): ?string
    {
        return $this->criadoEm;
    }

    /**
     * Define o ID da transação (após inserção no BD)
     * 
     * @param int $id
     * @return void
     */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /**
     * Define a data de criação (após inserção no BD)
     * 
     * @param string $criadoEm
     * @return void
     */
    public function setCriadoEm(string $criadoEm): void
    {
        $this->criadoEm = $criadoEm;
    }
}
?>
