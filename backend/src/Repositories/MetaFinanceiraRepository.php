<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\MetaFinanceira;

class MetaFinanceiraRepository
{
    private PDO $pdo;
    private const TABLE = 'metas_financeiras';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function listarAtivasPorUtilizador(int $utilizadorId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, titulo, valor_objetivo, valor_atual, data_limite, ativa, ultimo_alerta_em
                 FROM %s
                 WHERE utilizador_id = :utilizador_id AND ativa = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar metas ativas: ' . $e->getMessage());
            throw new PDOException('Erro ao listar metas ativas: ' . $e->getMessage(), 0, $e);
        }
    }

    public function obterTotalReservadoAtivo(int $utilizadorId): float
    {
        try {
            $query = sprintf(
                'SELECT COALESCE(SUM(valor_atual), 0) AS total_reservado
                 FROM %s
                 WHERE utilizador_id = :utilizador_id AND ativa = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);
            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            return (float)($resultado['total_reservado'] ?? 0);
        } catch (PDOException $e) {
            error_log('Erro ao calcular total reservado em metas: ' . $e->getMessage());
            throw new PDOException('Erro ao calcular total reservado em metas: ' . $e->getMessage(), 0, $e);
        }
    }

    public function criar(MetaFinanceira $meta): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (utilizador_id, titulo, valor_objetivo, valor_atual, data_limite, ativa)
                 VALUES (:utilizador_id, :titulo, :valor_objetivo, :valor_atual, :data_limite, :ativa)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $ok = $stmt->execute([
                ':utilizador_id' => $meta->getUtilizadorId(),
                ':titulo' => $meta->getTitulo(),
                ':valor_objetivo' => $meta->getValorObjetivo(),
                ':valor_atual' => $meta->getValorAtual(),
                ':data_limite' => $meta->getDataLimite(),
                ':ativa' => $meta->isAtiva() ? 1 : 0,
            ]);

            if ($ok) {
                $meta->setId((int)$this->pdo->lastInsertId());
            }

            return $ok;
        } catch (PDOException $e) {
            error_log('Erro ao criar meta: ' . $e->getMessage());
            throw new PDOException('Erro ao criar meta: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarPorUtilizador(int $utilizadorId, bool $apenasAtivas = false): array
    {
        try {
            $whereAtivas = $apenasAtivas ? ' AND ativa = TRUE' : '';
            $query = sprintf(
                'SELECT id, utilizador_id, titulo, valor_objetivo, valor_atual, data_limite, ativa, ultimo_alerta_em, criado_em
                 FROM %s
                 WHERE utilizador_id = :utilizador_id%s
                 ORDER BY criado_em DESC',
                self::TABLE,
                $whereAtivas
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar metas: ' . $e->getMessage());
            throw new PDOException('Erro ao listar metas: ' . $e->getMessage(), 0, $e);
        }
    }

    public function atualizar(int $id, int $utilizadorId, array $dados): bool
    {
        try {
            $campos = [];
            $params = [':id' => $id, ':utilizador_id' => $utilizadorId];

            foreach (['titulo', 'valor_objetivo', 'valor_atual', 'data_limite', 'ativa'] as $campo) {
                if (array_key_exists($campo, $dados)) {
                    $campos[] = $campo . ' = :' . $campo;
                    $params[':' . $campo] = $dados[$campo];
                }
            }

            if ($campos === []) {
                return false;
            }

            $query = sprintf(
                'UPDATE %s SET %s WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE,
                implode(', ', $campos)
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute($params);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar meta: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar meta: ' . $e->getMessage(), 0, $e);
        }
    }

    public function buscarPorId(int $id, int $utilizadorId): ?array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, titulo, valor_objetivo, valor_atual, data_limite, ativa, ultimo_alerta_em, criado_em
                 FROM %s
                 WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':id' => $id,
                ':utilizador_id' => $utilizadorId,
            ]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return $resultado === false ? null : $resultado;
        } catch (PDOException $e) {
            error_log('Erro ao buscar meta: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar meta: ' . $e->getMessage(), 0, $e);
        }
    }

    public function registrarMovimento(int $metaId, int $utilizadorId, float $valor, string $tipo, string $descricao): bool
    {
        try {
            $query = 'INSERT INTO meta_movimentos (meta_id, utilizador_id, valor, tipo, descricao)
                      VALUES (:meta_id, :utilizador_id, :valor, :tipo, :descricao)';

            $stmt = $this->pdo->prepare($query);
            return $stmt->execute([
                ':meta_id' => $metaId,
                ':utilizador_id' => $utilizadorId,
                ':valor' => $valor,
                ':tipo' => $tipo,
                ':descricao' => $descricao,
            ]);
        } catch (PDOException $e) {
            error_log('Erro ao registrar movimento de meta: ' . $e->getMessage());
            throw new PDOException('Erro ao registrar movimento de meta: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarMovimentosPorUtilizador(int $utilizadorId): array
    {
        try {
            $query = 'SELECT mm.id, mm.meta_id, mm.utilizador_id, mm.valor, mm.tipo, mm.descricao, mm.criado_em,
                             mf.titulo AS meta_titulo
                      FROM meta_movimentos mm
                      INNER JOIN metas_financeiras mf ON mf.id = mm.meta_id
                      WHERE mm.utilizador_id = :utilizador_id
                      ORDER BY mm.criado_em DESC';

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $utilizadorId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            if ($e->getCode() === '42S02') {
                return [];
            }

            error_log('Erro ao listar movimentos de metas: ' . $e->getMessage());
            throw new PDOException('Erro ao listar movimentos de metas: ' . $e->getMessage(), 0, $e);
        }
    }

    public function desativar(int $id, int $utilizadorId): bool
    {
        return $this->atualizar($id, $utilizadorId, ['ativa' => 0]);
    }

    public function atualizarUltimoAlerta(int $metaId, int $utilizadorId, string $data): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s SET ultimo_alerta_em = :data
                 WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            return $stmt->execute([
                ':data' => $data,
                ':id' => $metaId,
                ':utilizador_id' => $utilizadorId,
            ]);
        } catch (PDOException $e) {
            error_log('Erro ao atualizar ultimo alerta da meta: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar ultimo alerta da meta: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
