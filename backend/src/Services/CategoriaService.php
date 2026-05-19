<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Categoria;
use Src\Repositories\CategoriaRepository;

/**
 * Serviço de Categorias
 * 
 * Camada de lógica de negócio para operações com categorias:
 * - Listagem de categorias disponíveis
 * - Criação de categorias personalizadas
 * 
 * @package Src\Services
 */
class CategoriaService
{
    /**
     * Repositório de categorias (Injeção de Dependência)
     * @var CategoriaRepository
     */
    private CategoriaRepository $categoriaRepository;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param CategoriaRepository $categoriaRepository
     */
    public function __construct(CategoriaRepository $categoriaRepository)
    {
        $this->categoriaRepository = $categoriaRepository;
    }

    /**
     * Obtém todas as categorias disponíveis para um utilizador
     * 
     * Retorna categorias globais (sistema) + categorias personalizadas do utilizador
     * 
     * @param int $utilizadorId ID do utilizador
     * @return array Array com objetos Categoria formatados
     */
    public function getCategoriasDoUtilizador(int $utilizadorId): array
    {
        try {
            $categorias = $this->categoriaRepository->findByUser($utilizadorId);

            $categoriasFormatadas = array_map(function (Categoria $categoria) {
                return [
                    'id' => $categoria->getId(),
                    'nome' => $categoria->getNome(),
                    'tipo' => $categoria->getTipo(),
                    'utilizador_id' => $categoria->getUtilizadorId(),
                    'eh_global' => $categoria->getUtilizadorId() === null
                ];
            }, $categorias);

            return $categoriasFormatadas;
        } catch (\Exception $e) {
            error_log('Erro ao obter categorias: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cria uma nova categoria personalizada para o utilizador
     * 
     * Validações:
     * - Nome não pode estar vazio
     * - Tipo deve ser exatamente 'receita' ou 'despesa'
     * 
     * @param string $nome Nome da categoria
     * @param string $tipo Tipo ('receita' ou 'despesa')
     * @param int $utilizadorId ID do utilizador
     * @return bool true em caso de sucesso
     * @throws Exception Se houver erro na validação ou persistência
     */
    public function criarCategoria(string $nome, string $tipo, int $utilizadorId): bool
    {
        try {
            $nome = trim($nome);
            $tipo = trim($tipo);

            if (empty($nome)) {
                throw new \Exception('Nome da categoria não pode estar vazio');
            }

            if ($tipo !== 'receita' && $tipo !== 'despesa') {
                throw new \Exception('Tipo deve ser "receita" ou "despesa"');
            }

            $categoria = new Categoria(
                nome: $nome,
                tipo: $tipo,
                utilizadorId: $utilizadorId
            );

            $resultado = $this->categoriaRepository->create($categoria);

            if (!$resultado) {
                throw new \Exception('Erro ao criar categoria na base de dados');
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao criar categoria: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Edita uma categoria personalizada existente
     * 
     * Validações:
     * - Nome não pode estar vazio
     * - Tipo deve ser 'receita' ou 'despesa'
     * - Categoria deve pertencer ao utilizador (não pode editar categorias globais)
     * 
     * @param int $id ID da categoria a editar
     * @param string $nome Novo nome
     * @param string $tipo Novo tipo
     * @param int $utilizadorId ID do utilizador
     * @return bool true em caso de sucesso
     * @throws Exception Se houver erro na validação ou persistência
     */
    public function editarCategoria(int $id, string $nome, string $tipo, int $utilizadorId): bool
    {
        try {
            $nome = trim($nome);
            $tipo = trim($tipo);

            if (empty($nome)) {
                throw new \Exception('Nome da categoria não pode estar vazio');
            }

            if ($tipo !== 'receita' && $tipo !== 'despesa') {
                throw new \Exception('Tipo deve ser "receita" ou "despesa"');
            }

            $resultado = $this->categoriaRepository->update($id, $utilizadorId, $nome, $tipo);

            if (!$resultado) {
                throw new \Exception('Categoria não encontrada ou você não tem permissão para editá-la');
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao editar categoria: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Remove uma categoria personalizada do utilizador
     * 
     * Por segurança, verifica se a categoria pertence ao utilizador especificado.
     * Categorias globais não podem ser removidas.
     * 
     * @param int $id ID da categoria a remover
     * @param int $utilizadorId ID do utilizador
     * @return bool true em caso de sucesso
     * @throws Exception Se houver erro na operação
     */
    public function removerCategoria(int $id, int $utilizadorId): bool
    {
        try {
            $resultado = $this->categoriaRepository->delete($id, $utilizadorId);

            if (!$resultado) {
                throw new \Exception('Categoria não encontrada ou você não tem permissão para removê-la');
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao remover categoria: ' . $e->getMessage());
            throw $e;
        }
    }
}
?>
