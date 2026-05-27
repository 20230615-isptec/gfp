<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\Notificacao;

class NotificacaoRepository
{
    private PDO $pdo;
    private const TABLE = 'notificacoes';

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function inserir(Notificacao $notificacao): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (utilizador_id, titulo, mensagem, lida)
                 VALUES (:utilizador_id, :titulo, :mensagem, :lida)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $ok = $stmt->execute([
                ':utilizador_id' => $notificacao->getUtilizadorId(),
                ':titulo' => $notificacao->getTitulo(),
                ':mensagem' => $notificacao->getMensagem(),
                ':lida' => $notificacao->isLida() ? 1 : 0,
            ]);

            if ($ok) {
                $notificacao->setId((int)$this->pdo->lastInsertId());
            }

            return $ok;
        } catch (PDOException $e) {
            error_log('Erro ao inserir notificacao: ' . $e->getMessage());
            throw new PDOException('Erro ao inserir notificacao: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarNaoLidas(int $userId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, titulo, mensagem, lida, criado_em
                 FROM %s
                 WHERE utilizador_id = :utilizador_id AND lida = FALSE
                 ORDER BY criado_em DESC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $userId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar notificacoes nao lidas: ' . $e->getMessage());
            throw new PDOException('Erro ao listar notificacoes: ' . $e->getMessage(), 0, $e);
        }
    }

    public function listarPorUtilizador(int $userId): array
    {
        try {
            $query = sprintf(
                'SELECT id, utilizador_id, titulo, mensagem, lida, criado_em
                 FROM %s
                 WHERE utilizador_id = :utilizador_id
                 ORDER BY criado_em DESC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $userId]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Erro ao listar notificacoes: ' . $e->getMessage());
            throw new PDOException('Erro ao listar notificacoes: ' . $e->getMessage(), 0, $e);
        }
    }

    public function marcarComoLida(int $id, int $userId): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s SET lida = TRUE WHERE id = :id AND utilizador_id = :utilizador_id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([
                ':id' => $id,
                ':utilizador_id' => $userId,
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('Erro ao marcar notificacao como lida: ' . $e->getMessage());
            throw new PDOException('Erro ao marcar notificacao como lida: ' . $e->getMessage(), 0, $e);
        }
    }

    public function marcarTodasComoLidas(int $userId): int
    {
        try {
            $query = sprintf(
                'UPDATE %s SET lida = TRUE WHERE utilizador_id = :utilizador_id AND lida = FALSE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':utilizador_id' => $userId]);

            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log('Erro ao marcar todas notificacoes como lidas: ' . $e->getMessage());
            throw new PDOException('Erro ao marcar todas notificacoes: ' . $e->getMessage(), 0, $e);
        }
    }
}
?>
