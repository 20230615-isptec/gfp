<?php
declare(strict_types=1);

namespace Src\Models;

/**
 * Classe Model - Utilizador
 * 
 * Entidade de dados representando um utilizador do sistema.
 * Contém dados imutáveis do utilizador com getters para acesso.
 * 
 * @package Src\Models
 */
class Usuario
{
    /**
     * Identificador único do utilizador
     * @var int|null
     */
    private ?int $id;

    /**
     * Nome completo do utilizador
     * @var string
     */
    private string $nome;

    /**
     * Email único do utilizador
     * @var string
     */
    private string $email;

    /**
     * Hash da senha criptografada
     * @var string
     */
    private string $senhaHash;

    /**
     * ID do tipo de utilizador (FK para tipos_usuario)
     * @var int
     */
    private int $tipoUsuarioId;
    private ?string $avatarUrl;
    private string $moedaPreferida;
    private ?string $telefone;
    private string $idiomaPreferido;
    private string $temaPreferido;

    /**
     * Data e hora de criação do registo
     * @var string|null
     */
    private ?string $criadoEm;

    /**
     * Construtor do Model Usuario
     * 
     * @param string $nome
     * @param string $email
     * @param string $senhaHash
     * @param int $tipoUsuarioId
     * @param int|null $id
     * @param string|null $criadoEm
     */
    public function __construct(
        string $nome,
        string $email,
        string $senhaHash,
        int $tipoUsuarioId,
        ?string $avatarUrl = null,
        string $moedaPreferida = 'AOA',
        ?string $telefone = null,
        string $idiomaPreferido = 'pt-BR',
        string $temaPreferido = 'dark',
        ?int $id = null,
        ?string $criadoEm = null
    ) {
        $this->nome = $nome;
        $this->email = $email;
        $this->senhaHash = $senhaHash;
        $this->tipoUsuarioId = $tipoUsuarioId;
        $this->avatarUrl = $avatarUrl;
        $this->moedaPreferida = $moedaPreferida;
        $this->telefone = $telefone;
        $this->idiomaPreferido = $idiomaPreferido;
        $this->temaPreferido = $temaPreferido;
        $this->id = $id;
        $this->criadoEm = $criadoEm;
    }

    /**
     * Obtém o identificador único do utilizador
     * 
     * @return int|null
     */
    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     * Obtém o nome completo do utilizador
     * 
     * @return string
     */
    public function getNome(): string
    {
        return $this->nome;
    }

    /**
     * Obtém o email do utilizador
     * 
     * @return string
     */
    public function getEmail(): string
    {
        return $this->email;
    }

    /**
     * Obtém o hash da senha do utilizador
     * 
     * @return string
     */
    public function getSenhaHash(): string
    {
        return $this->senhaHash;
    }

    /**
     * Obtém o ID do tipo de utilizador
     * 
     * @return int
     */
    public function getTipoUsuarioId(): int
    {
        return $this->tipoUsuarioId;
    }

    public function getAvatarUrl(): ?string
    {
        return $this->avatarUrl;
    }

    public function getMoedaPreferida(): string
    {
        return $this->moedaPreferida;
    }

    public function getTelefone(): ?string
    {
        return $this->telefone;
    }

    public function getIdiomaPreferido(): string
    {
        return $this->idiomaPreferido;
    }

    public function getTemaPreferido(): string
    {
        return $this->temaPreferido;
    }

    /**
     * Obtém a data e hora de criação do registo
     * 
     * @return string|null
     */
    public function getCriadoEm(): ?string
    {
        return $this->criadoEm;
    }

    /**
     * Define o ID do utilizador (após inserção no BD)
     * Usado apenas internamente pelo Repository após INSERT
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
     * Usado apenas internamente pelo Repository após INSERT
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
