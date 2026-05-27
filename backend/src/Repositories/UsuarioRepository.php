<?php
declare(strict_types=1);

namespace Src\Repositories;

use PDO;
use PDOException;
use Src\Models\Usuario;

/**
 * Repositório de Utilizadores
 * 
 * Responsável por toda a persistência de dados da entidade Usuario.
 * Utiliza Prepared Statements para evitar SQL Injection.
 * 
 * @package Src\Repositories
 */
class UsuarioRepository
{
    /**
     * Conexão PDO com o banco de dados
     * @var PDO
     */
    private PDO $pdo;

    /**
     * Nome da tabela de utilizadores
     */
    private const TABLE = 'utilizadores';
    private ?string $resetTokenExpiryColumn = null;

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
     * Busca um utilizador pelo email
     * 
     * Realiza uma query SELECT filtrando pelo email.
     * Se encontrar, instancia e retorna um objeto Usuario.
     * Se não encontrar, retorna null.
     * 
     * @param string $email Email do utilizador a buscar
     * @return Usuario|null
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findByEmail(string $email): ?Usuario
    {
        try {
            $query = sprintf(
                'SELECT id, nome, email, senha_hash, tipo_usuario_id, avatar_url, moeda_preferida, telefone, idioma_preferido, tema_preferido, criado_em 
                 FROM %s 
                 WHERE email = :email AND ativo = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':email' => $email]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado === false) {
                return null;
            }

            $usuario = new Usuario(
                nome: $resultado['nome'],
                email: $resultado['email'],
                senhaHash: $resultado['senha_hash'],
                tipoUsuarioId: (int)$resultado['tipo_usuario_id'],
                avatarUrl: $resultado['avatar_url'] ?? null,
                moedaPreferida: (string)($resultado['moeda_preferida'] ?? 'AOA'),
                telefone: $resultado['telefone'] ?? null,
                idiomaPreferido: (string)($resultado['idioma_preferido'] ?? 'pt-BR'),
                temaPreferido: (string)($resultado['tema_preferido'] ?? 'dark'),
                id: (int)$resultado['id'],
                criadoEm: $resultado['criado_em']
            );

            return $usuario;
        } catch (PDOException $e) {
            error_log('Erro ao buscar utilizador por email: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Busca um utilizador pelo ID
     * 
     * @param int $id ID do utilizador
     * @return Usuario|null
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findById(int $id): ?Usuario
    {
        try {
            $query = sprintf(
                'SELECT id, nome, email, senha_hash, tipo_usuario_id, avatar_url, moeda_preferida, telefone, idioma_preferido, tema_preferido, criado_em 
                 FROM %s 
                 WHERE id = :id AND ativo = TRUE',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':id' => $id]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado === false) {
                return null;
            }

            $usuario = new Usuario(
                nome: $resultado['nome'],
                email: $resultado['email'],
                senhaHash: $resultado['senha_hash'],
                tipoUsuarioId: (int)$resultado['tipo_usuario_id'],
                avatarUrl: $resultado['avatar_url'] ?? null,
                moedaPreferida: (string)($resultado['moeda_preferida'] ?? 'AOA'),
                telefone: $resultado['telefone'] ?? null,
                idiomaPreferido: (string)($resultado['idioma_preferido'] ?? 'pt-BR'),
                temaPreferido: (string)($resultado['tema_preferido'] ?? 'dark'),
                id: (int)$resultado['id'],
                criadoEm: $resultado['criado_em']
            );

            return $usuario;
        } catch (PDOException $e) {
            error_log('Erro ao buscar utilizador por ID: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Cria um novo utilizador na base de dados
     * 
     * Insere um novo registo na tabela utilizadores.
     * A senha passada DEVE ser o hash criptografado com password_hash().
     * 
     * @param Usuario $usuario Objeto Usuario com dados a inserir
     * @return bool true em caso de sucesso, false caso contrário
     * @throws PDOException Em caso de erro na base de dados
     */
    public function create(Usuario $usuario): bool
    {
        try {
            $query = sprintf(
                'INSERT INTO %s (nome, email, senha_hash, tipo_usuario_id, ativo) 
                 VALUES (:nome, :email, :senha_hash, :tipo_usuario_id, TRUE)',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':nome' => $usuario->getNome(),
                ':email' => $usuario->getEmail(),
                ':senha_hash' => $usuario->getSenhaHash(),
                ':tipo_usuario_id' => $usuario->getTipoUsuarioId()
            ]);

            if ($resultado === false) {
                return false;
            }

            $novoId = (int)$this->pdo->lastInsertId();
            $usuario->setId($novoId);

            return true;
        } catch (PDOException $e) {
            error_log('Erro ao criar utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao criar utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Verifica se um email já existe na base de dados
     * 
     * @param string $email Email a verificar
     * @return bool true se existe, false caso contrário
     * @throws PDOException Em caso de erro na base de dados
     */
    public function emailExists(string $email): bool
    {
        try {
            $query = sprintf(
                'SELECT COUNT(*) as total FROM %s WHERE email = :email',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':email' => $email]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            return (int)$resultado['total'] > 0;
        } catch (PDOException $e) {
            error_log('Erro ao verificar existência de email: ' . $e->getMessage());
            throw new PDOException('Erro ao verificar email: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Salva um token de recuperação de senha para um utilizador
     * 
     * @param int $utilizadorId ID do utilizador
     * @param string $resetToken Token gerado para recuperação
     * @param int $expiracaoSegundos Tempo em segundos até a expiração
     * @return bool true em caso de sucesso
     * @throws PDOException Em caso de erro na base de dados
     */
    public function saveResetToken(int $utilizadorId, string $resetToken, int $expiracaoSegundos = 3600): bool
    {
        try {
            $resetExpires = date('Y-m-d H:i:s', time() + $expiracaoSegundos);
            $expiryColumn = $this->getResetTokenExpiryColumn();

            $query = sprintf(
                'UPDATE %s SET reset_token = :reset_token, %s = :reset_token_expires_at 
                 WHERE id = :id',
                self::TABLE,
                $expiryColumn
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':reset_token' => $resetToken,
                ':reset_token_expires_at' => $resetExpires,
                ':id' => $utilizadorId
            ]);

            return $resultado !== false;
        } catch (PDOException $e) {
            error_log('Erro ao salvar token de recuperação: ' . $e->getMessage());
            throw new PDOException('Erro ao salvar token: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Busca um utilizador pelo token de recuperação de senha
     * 
     * @param string $resetToken Token de recuperação
     * @return Usuario|null Retorna Usuario se encontrado e token válido, null caso contrário
     * @throws PDOException Em caso de erro na base de dados
     */
    public function findByResetToken(string $resetToken): ?Usuario
    {
        try {
            $expiryColumn = $this->getResetTokenExpiryColumn();
            $query = sprintf(
                'SELECT id, nome, email, senha_hash, tipo_usuario_id, avatar_url, moeda_preferida, telefone, idioma_preferido, tema_preferido, criado_em 
                 FROM %s 
                 WHERE reset_token = :reset_token 
                 AND %s > NOW() 
                 AND ativo = TRUE',
                self::TABLE,
                $expiryColumn
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute([':reset_token' => $resetToken]);

            $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($resultado === false) {
                return null;
            }

            $usuario = new Usuario(
                nome: $resultado['nome'],
                email: $resultado['email'],
                senhaHash: $resultado['senha_hash'],
                tipoUsuarioId: (int)$resultado['tipo_usuario_id'],
                avatarUrl: $resultado['avatar_url'] ?? null,
                moedaPreferida: (string)($resultado['moeda_preferida'] ?? 'AOA'),
                telefone: $resultado['telefone'] ?? null,
                idiomaPreferido: (string)($resultado['idioma_preferido'] ?? 'pt-BR'),
                temaPreferido: (string)($resultado['tema_preferido'] ?? 'dark'),
                id: (int)$resultado['id'],
                criadoEm: $resultado['criado_em']
            );

            return $usuario;
        } catch (PDOException $e) {
            error_log('Erro ao buscar utilizador por reset token: ' . $e->getMessage());
            throw new PDOException('Erro ao buscar utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Limpa os tokens de recuperação de um utilizador
     * 
     * @param int $utilizadorId ID do utilizador
     * @return bool true em caso de sucesso
     * @throws PDOException Em caso de erro na base de dados
     */
    public function clearResetToken(int $utilizadorId): bool
    {
        try {
            $expiryColumn = $this->getResetTokenExpiryColumn();
            $query = sprintf(
                'UPDATE %s SET reset_token = NULL, %s = NULL 
                 WHERE id = :id',
                self::TABLE,
                $expiryColumn
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([':id' => $utilizadorId]);

            return $resultado !== false;
        } catch (PDOException $e) {
            error_log('Erro ao limpar token de recuperação: ' . $e->getMessage());
            throw new PDOException('Erro ao limpar token: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Atualiza a senha de um utilizador
     * 
     * @param int $utilizadorId ID do utilizador
     * @param string $novoHash Hash da nova senha
     * @return bool true em caso de sucesso
     * @throws PDOException Em caso de erro na base de dados
     */
    public function updateSenha(int $utilizadorId, string $novoHash): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s SET senha_hash = :senha_hash 
                 WHERE id = :id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);

            $resultado = $stmt->execute([
                ':senha_hash' => $novoHash,
                ':id' => $utilizadorId
            ]);

            return $resultado !== false;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar senha: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar senha: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Lista todos os utilizadores do sistema (sem mostrar senhas)
     * 
     * @return array Array de utilizadores com apenas id, nome e email
     * @throws PDOException Em caso de erro na base de dados
     */
    public function listarTodos(): array
    {
        try {
            $query = sprintf(
                'SELECT id, nome, email, tipo_usuario_id, criado_em 
                 FROM %s 
                 WHERE ativo = TRUE 
                 ORDER BY criado_em DESC',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $stmt->execute();

            $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $utilizadores = [];

            foreach ($resultados as $resultado) {
                $utilizadores[] = [
                    'id' => (int)$resultado['id'],
                    'nome' => $resultado['nome'],
                    'email' => $resultado['email'],
                    'tipo_usuario_id' => (int)$resultado['tipo_usuario_id'],
                    'criado_em' => $resultado['criado_em']
                ];
            }

            return $utilizadores;
        } catch (PDOException $e) {
            error_log('Erro ao listar utilizadores: ' . $e->getMessage());
            throw new PDOException('Erro ao listar utilizadores: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Atualiza o tipo de utilizador (Administrador ou Utilizador)
     * 
     * @param int $utilizadorId ID do utilizador
     * @param int $tipoUsuarioId Novo tipo (1=Admin, 2=User)
     * @return bool Sucesso ou falha
     * @throws PDOException Em caso de erro na base de dados
     */
    public function updateTipoUsuario(int $utilizadorId, int $tipoUsuarioId): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s 
                 SET tipo_usuario_id = :tipo 
                 WHERE id = :id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $result = $stmt->execute([
                ':tipo' => $tipoUsuarioId,
                ':id' => $utilizadorId
            ]);

            return $result;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar tipo de utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar tipo de utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Desativa (bloqueia) ou ativa um utilizador
     * 
     * @param int $utilizadorId ID do utilizador
     * @param bool $ativo True para ativar, False para desativar
     * @return bool Sucesso ou falha
     * @throws PDOException Em caso de erro na base de dados
     */
    public function updateAtivo(int $utilizadorId, bool $ativo): bool
    {
        try {
            $query = sprintf(
                'UPDATE %s 
                 SET ativo = :ativo 
                 WHERE id = :id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $result = $stmt->execute([
                ':ativo' => $ativo ? 1 : 0,
                ':id' => $utilizadorId
            ]);

            return $result;
        } catch (PDOException $e) {
            error_log('Erro ao atualizar status de utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar status de utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Elimina (soft-delete) um utilizador
     * 
     * @param int $utilizadorId ID do utilizador a eliminar
     * @return bool Sucesso ou falha
     * @throws PDOException Em caso de erro na base de dados
     */
    public function delete(int $utilizadorId): bool
    {
        try {
            // Soft-delete: apenas marcar como inativo
            $query = sprintf(
                'UPDATE %s 
                 SET ativo = FALSE 
                 WHERE id = :id',
                self::TABLE
            );

            $stmt = $this->pdo->prepare($query);
            $result = $stmt->execute([':id' => $utilizadorId]);

            return $result;
        } catch (PDOException $e) {
            error_log('Erro ao eliminar utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao eliminar utilizador: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Atualiza dados de perfil expandido do utilizador.
     *
     * @param int $utilizadorId
     * @param array<string, mixed> $dados
     * @return bool
     */
    public function atualizarPerfil(int $utilizadorId, array $dados): bool
    {
        try {
            $campos = [];

            if (array_key_exists('avatar_url', $dados)) {
                $campos[] = 'avatar_url = :avatar_url';
            }

            if (array_key_exists('moeda_preferida', $dados)) {
                $campos[] = 'moeda_preferida = :moeda_preferida';
            }

            if (array_key_exists('telefone', $dados)) {
                $campos[] = 'telefone = :telefone';
            }

            if (array_key_exists('idioma_preferido', $dados)) {
                $campos[] = 'idioma_preferido = :idioma_preferido';
            }

            if (array_key_exists('tema_preferido', $dados)) {
                $campos[] = 'tema_preferido = :tema_preferido';
            }

            if ($campos === []) {
                return false;
            }

            $query = sprintf(
                'UPDATE %s SET %s WHERE id = :id',
                self::TABLE,
                implode(', ', $campos)
            );

            $stmt = $this->pdo->prepare($query);

            $id = $utilizadorId;
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            if (array_key_exists('avatar_url', $dados)) {
                $avatarUrl = $dados['avatar_url'];
                $stmt->bindParam(':avatar_url', $avatarUrl, PDO::PARAM_STR);
            }

            if (array_key_exists('moeda_preferida', $dados)) {
                $moedaPreferida = $dados['moeda_preferida'];
                $stmt->bindParam(':moeda_preferida', $moedaPreferida, PDO::PARAM_STR);
            }

            if (array_key_exists('telefone', $dados)) {
                $telefone = $dados['telefone'];
                if ($telefone === null || $telefone === '') {
                    $stmt->bindValue(':telefone', null, PDO::PARAM_NULL);
                } else {
                    $stmt->bindParam(':telefone', $telefone, PDO::PARAM_STR);
                }
            }

            if (array_key_exists('idioma_preferido', $dados)) {
                $idiomaPreferido = $dados['idioma_preferido'];
                $stmt->bindParam(':idioma_preferido', $idiomaPreferido, PDO::PARAM_STR);
            }

            if (array_key_exists('tema_preferido', $dados)) {
                $temaPreferido = $dados['tema_preferido'];
                $stmt->bindParam(':tema_preferido', $temaPreferido, PDO::PARAM_STR);
            }

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Erro ao atualizar perfil de utilizador: ' . $e->getMessage());
            throw new PDOException('Erro ao atualizar perfil: ' . $e->getMessage(), 0, $e);
        }
    }

    public function getPerfilExpandido(int $utilizadorId): ?array
    {
        $usuario = $this->findById($utilizadorId);
        if ($usuario === null) {
            return null;
        }

        return [
            'id' => $usuario->getId(),
            'name' => $usuario->getNome(),
            'email' => $usuario->getEmail(),
            'avatar_url' => $usuario->getAvatarUrl(),
            'moeda_preferida' => $usuario->getMoedaPreferida(),
            'phone' => $usuario->getTelefone(),
            'language' => $usuario->getIdiomaPreferido(),
            'theme' => $usuario->getTemaPreferido()
        ];
    }

    private function getResetTokenExpiryColumn(): string
    {
        if ($this->resetTokenExpiryColumn !== null) {
            return $this->resetTokenExpiryColumn;
        }

        $stmt = $this->pdo->query('SHOW COLUMNS FROM ' . self::TABLE . " LIKE 'reset_token_expires_at'");
        $existsNew = $stmt !== false && $stmt->fetch(PDO::FETCH_ASSOC) !== false;
        $this->resetTokenExpiryColumn = $existsNew ? 'reset_token_expires_at' : 'reset_expires';

        return $this->resetTokenExpiryColumn;
    }
}
?>
