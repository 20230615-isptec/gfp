<?php
declare(strict_types=1);

namespace Config;

use PDO;
use PDOException;

/**
 * Classe de Conexão com Banco de Dados
 * 
 * Implementa o padrão Singleton para garantir uma única instância de conexão PDO
 * durante todo o ciclo de vida da aplicação.
 * 
 * @package Config
 */
class Database
{
    /**
     * Instância singleton da classe
     * @var self|null
     */
    private static ?self $instance = null;

    /**
     * Conexão PDO
     * @var PDO|null
     */
    private ?PDO $connection = null;

    /**
     * Credenciais e configurações de conexão
     */
    private const DB_HOST = 'localhost';
    private const DB_PORT = 3306;
    private const DB_NAME = 'financas_pessoais';
    private const DB_USER = 'root';
    private const DB_PASS = '';
    private const DB_CHARSET = 'utf8mb4';

    /**
     * Construtor privado para evitar instanciação direta
     */
    private function __construct()
    {
        $this->connect();
    }

    /**
     * Obtém a instância singleton da classe
     * 
     * @return self
     */
    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Estabelece a conexão com o banco de dados usando PDO
     * 
     * @return void
     * @throws PDOException Se ocorrer erro na conexão
     */
    private function connect(): void
    {
        try {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                self::DB_HOST,
                self::DB_PORT,
                self::DB_NAME,
                self::DB_CHARSET
            );

            $this->connection = new PDO(
                $dsn,
                self::DB_USER,
                self::DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_PERSISTENT => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES ' . self::DB_CHARSET
                ]
            );
        } catch (PDOException $e) {
            $this->logError('Erro na conexão com o banco de dados: ' . $e->getMessage());
            throw new PDOException('Falha ao conectar ao banco de dados', 0, $e);
        }
    }

    /**
     * Obtém a conexão PDO ativa
     * 
     * @return PDO
     */
    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            $this->connect();
        }

        return $this->connection;
    }

    /**
     * Executa uma query preparada (SELECT)
     * 
     * @param string $query Query SQL
     * @param array $params Parâmetros para a query
     * @return array Resultados da query
     */
    public function query(string $query, array $params = []): array
    {
        try {
            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError('Erro ao executar query: ' . $e->getMessage());
            throw new PDOException('Erro ao executar query: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Executa uma query preparada (INSERT, UPDATE, DELETE)
     * 
     * @param string $query Query SQL
     * @param array $params Parâmetros para a query
     * @return int Número de linhas afetadas
     */
    public function execute(string $query, array $params = []): int
    {
        try {
            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError('Erro ao executar comando: ' . $e->getMessage());
            throw new PDOException('Erro ao executar comando: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Obtém o ID da última linha inserida
     * 
     * @return string
     */
    public function lastInsertId(): string
    {
        return $this->getConnection()->lastInsertId();
    }

    /**
     * Inicia uma transação
     * 
     * @return bool
     */
    public function beginTransaction(): bool
    {
        return $this->getConnection()->beginTransaction();
    }

    /**
     * Confirma uma transação
     * 
     * @return bool
     */
    public function commit(): bool
    {
        return $this->getConnection()->commit();
    }

    /**
     * Desfaz uma transação
     * 
     * @return bool
     */
    public function rollBack(): bool
    {
        return $this->getConnection()->rollBack();
    }

    /**
     * Verifica se existe uma transação ativa
     * 
     * @return bool
     */
    public function inTransaction(): bool
    {
        return $this->getConnection()->inTransaction();
    }

    /**
     * Registra erros em arquivo de log
     * 
     * @param string $message Mensagem de erro
     * @return void
     */
    private function logError(string $message): void
    {
        $logDir = BASE_PATH . '/logs';
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $logFile = $logDir . '/database.log';
        $timestamp = date('Y-m-d H:i:s');
        
        error_log("[$timestamp] $message\n", 3, $logFile);
    }

    /**
     * Evita clonagem da instância singleton
     * 
     * @return void
     */
    private function __clone(): void
    {
    }

    /**
     * Evita desserialização da instância singleton
     * 
     * @return void
     */
    public function __wakeup(): void
    {
    }
}
?>
