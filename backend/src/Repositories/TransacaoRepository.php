<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\Transacao;

/**
 * Repositório de Transações
 * 
 * Responsável por toda a persistência de dados da entidade Transacao.
 * Utiliza Prepared Statements para evitar SQL Injection.
 * 
 * @package Src\Repositories
 */
class TransacaoRepository
{
    /**
     * Conexão PDO com o banco de dados
     * @var PDO
     */
    private PDO $pdo;

    /**
     * Nome da tabela de transações
     */
    private const TABLE = 'transacoes';

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
     * Busca todas as transações de um utilizador
     * 
     * Retorna ordenadas por data decrescente (mais recentes primeiro)
     * 
     * @param int $utilizadorId ID do utilizador
     * @return array Array de objetos Transacao
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findByUser(int $utilizadorId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, categoria_id, valor, tipo, data, descricao, criado_em 
                 FROM %s 
                 WHERE utilizador_id = :utilizador_id 
                 ORDER BY data DESC, criado_em DESC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $transacoes = [];

            foreach ($resultados as $resultado) {
                $transacao = new Transacao(
                    utilizadorId: (int)$resultado['utilizador_id'],
                    categoriaId: (int)$resultado['categoria_id'],
                    valor: (float)$resultado['valor'],
                    tipo: $resultado['tipo'],
                    data: $resultado['data'],
                    descricao: $resultado['descricao'],
                    id: (int)$resultado['id'],
                    criadoEm: $resultado['criado_em']
                );

                $transacoes[] = $transacao;
            }

            return $transacoes;
        } catch (PDOException $e) {
            error_log('Erro ao buscar transações do utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar transações: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Busca uma transação específica pelo ID
     * 
     * @param int $id ID da transação
     * @return Transacao|null
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findById(int $id): ?Transacao
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, categoria_id, valor, tipo, data, descricao, criado_em 
                 FROM %s 
                 WHERE id = :id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $id]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado === false) {
                return null;
            }

            $transacao = new Transacao(
                utilizadorId: (int)$resultado['utilizador_id'],
                categoriaId: (int)$resultado['categoria_id'],
                valor: (float)$resultado['valor'],
                tipo: $resultado['tipo'],
                data: $resultado['data'],
                descricao: $resultado['descricao'],
                id: (int)$resultado['id'],
                criadoEm: $resultado['criado_em']
            );

            return $transacao;
        } catch (PDOException $e) {
            error_log('Erro ao buscar transação por ID: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar transação: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Cria uma nova transação na base de dados
     * 
     * @param Transacao $transacao Objeto Transacao com dados a inserir
     * @return bool true em caso de sucesso, false caso contrário
     * @throws PDOException Em caso de erro na base de dados
     */
    public function create(Transacao $transacao): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (utilizador_id, categoria_id, valor, tipo, data, descricao) 
                 VALUES (:utilizador_id, :categoria_id, :valor, :tipo, :data, :descricao)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':utilizador_id' => $transacao->getUtilizadorId(),
                ':categoria_id' => $transacao->getCategoriaId(),
                ':valor' => $transacao->getValor(),
                ':tipo' => $transacao->getTipo(),
                ':data' => $transacao->getData(),
                ':descricao' => $transacao->getDescricao()
            ]);

            if ($resultado === false) {
                return false;
            }

            $novoId = (int)$this->pdo->lastInsertId();
            $transacao->setId($novoId);

            return true;
        } catch (PDOException $e) {
            error_log('Erro ao criar transação: ' . $e->getMessage());
            throw new PDOException('Erro ao criar transação: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Exclui uma transação
     * 
     * Por segurança, verifica se a transação pertence ao utilizador especificado.
     * Um utilizador só pode apagar suas próprias transações.
     * 
     * @param int $id ID da transação a apagar
     * @param int $utilizadorId ID do utilizador (para validação)
     * @return bool true em caso de sucesso, false se transação não existe ou não pertence ao utilizador
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
            error_log('Erro ao apagar transação: ' . $e->getMessage());
            throw new PDOException('Erro ao apagar transação: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Busca transações filtrando por data e tipo
     * 
     * Útil para relatórios e análises financeiras
     * 
     * @param int $utilizadorId ID do utilizador
     * @param string $dataInicio Data inicial (formato Y-m-d)
     * @param string $dataFim Data final (formato Y-m-d)
     * @param string|null $tipo Tipo de transação ('receita', 'despesa' ou null para ambas)
     * @return array Array de objetos Transacao
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findByDateRange(
        int $utilizadorId,
        string $dataInicio,
        string $dataFim,
        ?string $tipo = null
    ): array {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, categoria_id, valor, tipo, data, descricao, criado_em 
                 FROM %s 
                 WHERE utilizador_id = :utilizador_id 
                 AND data BETWEEN :data_inicio AND :data_fim',
                self::TABLE
            );

            $params = [
                ':utilizador_id' => $utilizadorId,
                ':data_inicio' => $dataInicio,
                ':data_fim' => $dataFim
            ];

            if ($tipo !== null) {
                $query .= ' AND tipo = :tipo';
                $params[':tipo'] = $tipo;
            }

            $query .= ' ORDER BY data DESC, criado_em DESC';

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $transacoes = [];

            foreach ($resultados as $resultado) {
                $transacao = new Transacao(
                    utilizadorId: (int)$resultado['utilizador_id'],
                    categoriaId: (int)$resultado['categoria_id'],
                    valor: (float)$resultado['valor'],
                    tipo: $resultado['tipo'],
                    data: $resultado['data'],
                    descricao: $resultado['descricao'],
                    id: (int)$resultado['id'],
                    criadoEm: $resultado['criado_em']
                );

                $transacoes[] = $transacao;
            }

            return $transacoes;
        } catch (PDOException $e) {
            error_log('Erro ao buscar transações por intervalo de datas: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar transações: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Atualiza uma transação existente
     * 
     * Por segurança, verifica se a transação pertence ao utilizador especificado.
     * 
     * @param int $id ID da transação a atualizar
     * @param int $utilizadorId ID do utilizador (para validação)
     * @param int $categoriaId Novo ID da categoria
     * @param float $valor Novo valor
     * @param string $tipo Novo tipo ('receita' ou 'despesa')
     * @param string $data Nova data (Y-m-d)
     * @param string $descricao Nova descrição
     * @return bool true em caso de sucesso, false se transação não existe ou não pertence ao utilizador
     * @throws PDOException Em caso de erro na base de dados
     */
    public function update(
        int $id,
        int $utilizadorId,
        int $categoriaId,
        float $valor,
        string $tipo,
        string $data,
        string $descricao
    ): bool {
        try {
            $query = sprintf(
                'UPDATE %s 
                 SET categoria_id = :categoria_id, valor = :valor, tipo = :tipo, data = :data, descricao = :descricao 
                 WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':categoria_id' => $categoriaId,
                ':valor' => $valor,
                ':tipo' => $tipo,
                ':data' => $data,
                ':descricao' => $descricao,
                ':id' => $id,
                ':utilizador_id' => $utilizadorId
            ]);

            if ($resultado === false) {
                return false;
            }

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar transação: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar transação: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
