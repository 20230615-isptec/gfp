<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\TransacaoRecorrente;

class TransacaoRecorrenteRepository
{
    private PDO $pdo;
    private const TABLE = 'transacoes_recorrentes';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function criar(TransacaoRecorrente $recorrente): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (utilizador_id, categoria_id, valor, tipo, descricao, frequencia, dia_vencimento, ultima_geracao, ativo)
                 VALUES (:utilizador_id, :categoria_id, :valor, :tipo, :descricao, :frequencia, :dia_vencimento, :ultima_geracao, :ativo)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $ok = $stmt->execute([
                ':utilizador_id' => $recorrente->getUtilizadorId(),
                ':categoria_id' => $recorrente->getCategoriaId(),
                ':valor' => $recorrente->getValor(),
                ':tipo' => $recorrente->getTipo(),
                ':descricao' => $recorrente->getDescricao(),
                ':frequencia' => $recorrente->getFrequencia(),
                ':dia_vencimento' => $recorrente->getDiaVencimento(),
                ':ultima_geracao' => $recorrente->getUltimaGeracao(),
                ':ativo' => $recorrente->isAtivo() ? 1 : 0,
            ]);

            if ($ok) {
                $recorrente->setId((int)$this->pdo->lastInsertId());
            }

            return $ok;
        } catch (PDOException $e) {
            error_log('Erro ao criar transacao recorrente: ' . $e->getMessage());
            throw new PDOException('Erro ao criar transacao recorrente: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarPorUtilizador(int $utilizadorId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, categoria_id, valor, tipo, descricao, frequencia, dia_vencimento, ultima_geracao, ativo
                 FROM %s
                 WHERE utilizador_id = :utilizador_id
                 ORDER BY ativo DESC, id DESC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar recorrencias: ' . $e->getMessage());
            throw new PDOException('Erro ao listar recorrencias: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarAtivasPorUtilizador(int $utilizadorId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, categoria_id, valor, tipo, descricao, frequencia, dia_vencimento, ultima_geracao
                 FROM %s
                 WHERE utilizador_id = :utilizador_id AND ativo = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar recorrencias ativas: ' . $e->getMessage());
            throw new PDOException('Erro ao listar recorrencias ativas: ' . $e->getMessage(), 0, $e);
        }
    }

    public function atualizarUltimaGeracao(int $id, int $utilizadorId, string $data): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s SET ultima_geracao = :data WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            return $stmt->execute([
                ':data' => $data,
                ':id' => $id,
                ':utilizador_id' => $utilizadorId,
            ]);
        } catch (PDOException $e) {
            error_log('Erro ao atualizar ultima_geracao: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar ultima_geracao: ' . $e->getMessage(), 0, $e);
        }
    }

    public function desativar(int $id, int $utilizadorId): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s SET ativo = FALSE WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':id' => $id,
                ':utilizador_id' => $utilizadorId,
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao desativar recorrencia: ' . $e->getMessage());
            throw new PDOException('Erro ao desativar recorrencia: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
