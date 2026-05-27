<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\Orcamento;

class OrcamentoRepository
{
    private PDO $pdo;
    private const TABLE = 'orcamentos';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function salvar(Orcamento $orcamento): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (utilizador_id, categoria_id, valor_limite, mes, ano)
                 VALUES (:utilizador_id, :categoria_id, :valor_limite, :mes, :ano)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $result = $stmt->execute([
                ':utilizador_id' => $orcamento->getUtilizadorId(),
                ':categoria_id' => $orcamento->getCategoriaId(),
                ':valor_limite' => $orcamento->getValorLimite(),
                ':mes' => $orcamento->getMes(),
                ':ano' => $orcamento->getAno(),
            ]);

            if ($result === false) {
                return false;
            }

            $orcamento->setId((int)$this->pdo->lastInsertId());
            return true;
        } catch (PDOException $e) {
            error_log('Erro ao salvar orcamento: ' . $e->getMessage());
            throw new PDOException('Erro ao salvar orcamento: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarPorUtilizador(int $utilizadorId, int $mes, int $ano): array
    {
        try {
            $query = sprintf(
                'SELECT o.id, o.utilizador_id, o.categoria_id, c.nome AS categoria, o.valor_limite, o.mes, o.ano, o.criado_em
                 FROM %s o
                 INNER JOIN categorias c ON c.id = o.categoria_id
                 WHERE o.utilizador_id = :utilizador_id AND o.mes = :mes AND o.ano = :ano
                 ORDER BY c.nome ASC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':utilizador_id' => $utilizadorId,
                ':mes' => $mes,
                ':ano' => $ano,
            ]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar orcamentos: ' . $e->getMessage());
            throw new PDOException('Erro ao listar orcamentos: ' . $e->getMessage(), 0, $e);
        }
    }

    public function eliminar(int $id, int $utilizadorId): bool
    {
        try {
            $query = sprintf(
                'DELETE FROM %s WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':id' => $id,
                ':utilizador_id' => $utilizadorId,
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao eliminar orcamento: ' . $e->getMessage());
            throw new PDOException('Erro ao eliminar orcamento: ' . $e->getMessage(), 0, $e);
        }
    }

    public function buscarGastoAtual(int $categoriaId, int $mes, int $ano, int $utilizadorId): float
    {
        try {
            $query = 'SELECT COALESCE(SUM(valor), 0) AS gasto_atual
                      FROM transacoes
                      WHERE utilizador_id = :utilizador_id
                        AND categoria_id = :categoria_id
                        AND tipo = :tipo
                        AND MONTH(data) = :mes
                        AND YEAR(data) = :ano';

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':utilizador_id' => $utilizadorId,
                ':categoria_id' => $categoriaId,
                ':tipo' => 'despesa',
                ':mes' => $mes,
                ':ano' => $ano,
            ]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return (float)($resultado['gasto_atual'] ?? 0);
        } catch (PDOException $e) {
            error_log('Erro ao buscar gasto atual: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar gasto atual: ' . $e->getMessage(), 0, $e);
        }
    }

    public function existeOrcamentoPeriodo(int $utilizadorId, int $categoriaId, int $mes, int $ano): bool
    {
        try {
            $query = sprintf(
                'SELECT COUNT(*) AS total FROM %s
                 WHERE utilizador_id = :utilizador_id
                   AND categoria_id = :categoria_id
                   AND mes = :mes
                   AND ano = :ano',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':utilizador_id' => $utilizadorId,
                ':categoria_id' => $categoriaId,
                ':mes' => $mes,
                ':ano' => $ano,
            ]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
            return ((int)($resultado['total'] ?? 0)) > 0;
        } catch (PDOException $e) {
            error_log('Erro ao verificar orcamento duplicado: ' . $e->getMessage());
            throw new PDOException('Erro ao verificar orcamento: ' . $e->getMessage(), 0, $e);
        }
    }

    public function buscarPorId(int $id, int $utilizadorId): ?array
    {
        try {
            $query = sprintf(
                'SELECT o.id, o.utilizador_id, o.categoria_id, c.nome AS categoria, o.valor_limite, o.mes, o.ano, o.criado_em
                 FROM %s o
                 INNER JOIN categorias c ON c.id = o.categoria_id
                 WHERE o.id = :id AND o.utilizador_id = :utilizador_id',
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
            error_log('Erro ao buscar orcamento por ID: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar orcamento: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
