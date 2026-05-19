<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\Categoria;

/**
 * Repositório de Categorias
 * 
 * Responsável por toda a persistência de dados da entidade Categoria.
 * Utiliza Prepared Statements para evitar SQL Injection.
 * 
 * @package Src\Repositories
 */
class CategoriaRepository
{
    /**
     * Conexão PDO com o banco de dados
     * @var PDO
     */
    private PDO $pdo;

    /**
     * Nome da tabela de categorias
     */
    private const TABLE = 'categorias';

    /**
     * Construtor - Injeção de Dependência do PDO
     * 
     * @param PDO $pdo
     */
    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Busca categorias disponíveis para um utilizador
     * 
     * Retorna categorias que pertencem ao utilizador OU categorias globais (utilizador_id = NULL)
     * 
     * @param int $utilizadorId ID do utilizador
     * @return array Array de objetos Categoria
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findByUser(int $utilizadorId): array
    {
        try {
            $query = sprintf(
                'SELECT id, nome, tipo, utilizador_id 
                 FROM %s 
                 WHERE (utilizador_id = :utilizador_id OR utilizador_id IS NULL) 
                 AND ativa = TRUE 
                 ORDER BY nome ASC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $categorias = [];

            foreach ($resultados as $resultado) {
                $categoria = new Categoria(
                    nome: $resultado['nome'],
                    tipo: $resultado['tipo'],
                    utilizadorId: $resultado['utilizador_id'] !== null ? (int)$resultado['utilizador_id'] : null,
                    id: (int)$resultado['id']
                );

                $categorias[] = $categoria;
            }

            return $categorias;
        } catch (PDOException $e) {
            error_log('Erro ao buscar categorias do utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar categorias: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Busca uma categoria específica pelo ID
     * 
     * @param int $id ID da categoria
     * @return Categoria|null
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findById(int $id): ?Categoria
    {
        try {
            $query = sprintf(
                'SELECT id, nome, tipo, utilizador_id 
                 FROM %s 
                 WHERE id = :id AND ativa = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $id]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado === false) {
                return null;
            }

            $categoria = new Categoria(
                nome: $resultado['nome'],
                tipo: $resultado['tipo'],
                utilizadorId: $resultado['utilizador_id'] !== null ? (int)$resultado['utilizador_id'] : null,
                id: (int)$resultado['id']
            );

            return $categoria;
        } catch (PDOException $e) {
            error_log('Erro ao buscar categoria por ID: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar categoria: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Cria uma nova categoria na base de dados
     * 
     * @param Categoria $categoria Objeto Categoria com dados a inserir
     * @return bool true em caso de sucesso, false caso contrário
     * @throws PDOException Em caso de erro na base de dados
     */
    public function create(Categoria $categoria): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (nome, tipo, utilizador_id, ativa) 
                 VALUES (:nome, :tipo, :utilizador_id, TRUE)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':nome' => $categoria->getNome(),
                ':tipo' => $categoria->getTipo(),
                ':utilizador_id' => $categoria->getUtilizadorId()
            ]);

            if ($resultado === false) {
                return false;
            }

            $novoId = (int)$this->pdo->lastInsertId();
            $categoria->setId($novoId);

            return true;
        } catch (PDOException $e) {
            error_log('Erro ao criar categoria: ' . $e->getMessage());
            throw new PDOException('Erro ao criar categoria: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Verifica se uma categoria pertence a um utilizador específico
     * 
     * Usado para validação de propriedade antes de operações de escrita
     * 
     * @param int $categoriaId ID da categoria
     * @param int $utilizadorId ID do utilizador
     * @return bool
     * @throws PDOException Em caso de erro na base de dados
     */
    public function belongsToUser(int $categoriaId, int $utilizadorId): bool
    {
        try {
            $query = sprintf(
                'SELECT COUNT(*) as total FROM %s 
                 WHERE id = :id AND (utilizador_id = :utilizador_id OR utilizador_id IS NULL)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':id' => $categoriaId,
                ':utilizador_id' => $utilizadorId
            ]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            return (int)$resultado['total'] > 0;
        } catch (PDOException $e) {
            error_log('Erro ao verificar propriedade de categoria: ' . $e->getMessage());
            throw new PDOException('Erro ao verificar categoria: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Atualiza uma categoria existente
     * 
     * Por segurança, verifica se a categoria pertence ao utilizador especificado.
     * Categorias globais (utilizador_id = NULL) não podem ser editadas por utilizadores normais.
     * 
     * @param int $id ID da categoria a atualizar
     * @param int $utilizadorId ID do utilizador (para validação)
     * @param string $nome Novo nome da categoria
     * @param string $tipo Novo tipo ('receita' ou 'despesa')
     * @return bool true em caso de sucesso, false se categoria não existe ou não pertence ao utilizador
     * @throws PDOException Em caso de erro na base de dados
     */
    public function update(int $id, int $utilizadorId, string $nome, string $tipo): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s 
                 SET nome = :nome, tipo = :tipo 
                 WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':nome' => $nome,
                ':tipo' => $tipo,
                ':id' => $id,
                ':utilizador_id' => $utilizadorId
            ]);

            if ($resultado === false) {
                return false;
            }

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar categoria: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar categoria: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Deleta uma categoria personalizada
     * 
     * Por segurança, verifica se a categoria pertence ao utilizador especificado.
     * Apenas categorias do utilizador podem ser deletadas (não globais).
     * 
     * @param int $id ID da categoria a deletar
     * @param int $utilizadorId ID do utilizador (para validação)
     * @return bool true em caso de sucesso, false se categoria não existe ou não pertence ao utilizador
     * @throws PDOException Em caso de erro na base de dados
     */
    public function delete(int $id, int $utilizadorId): bool
    {
        try {
            $query = sprintf(
                'DELETE FROM %s 
                 WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':id' => $id,
                ':utilizador_id' => $utilizadorId
            ]);

            if ($resultado === false) {
                return false;
            }

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao deletar categoria: ' . $e->getMessage());
            throw new PDOException('Erro ao deletar categoria: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
