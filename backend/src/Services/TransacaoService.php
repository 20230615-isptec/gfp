<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Models\Transacao;
use Src\Repositories\CategoriaRepository;
use Src\Repositories\MetaFinanceiraRepository;
use Src\Repositories\TransacaoRepository;

/**
 * Serviço de Transações
 * 
 * Camada de lógica de negócio para operações com transações:
 * - Listagem de transações do utilizador
 * - Adição de novas transações
 * - Remoção de transações
 * 
 * @package Src\Services
 */
class TransacaoService
{
    /**
     * Repositório de transações (Injeção de Dependência)
     * @var TransacaoRepository
     */
    private TransacaoRepository $transacaoRepository;
    private OrcamentoService $orcamentoService;
    private NotificacaoService $notificacaoService;
    private MetaFinanceiraRepository $metaFinanceiraRepository;
    private CategoriaRepository $categoriaRepository;

    /**
     * Construtor - Injeção de Dependência
     * 
     * @param TransacaoRepository $transacaoRepository
     */
    public function __construct(
        TransacaoRepository $transacaoRepository,
        OrcamentoService $orcamentoService,
        NotificacaoService $notificacaoService,
        MetaFinanceiraRepository $metaFinanceiraRepository,
        CategoriaRepository $categoriaRepository
    )
    {
        $this->transacaoRepository = $transacaoRepository;
        $this->orcamentoService = $orcamentoService;
        $this->notificacaoService = $notificacaoService;
        $this->metaFinanceiraRepository = $metaFinanceiraRepository;
        $this->categoriaRepository = $categoriaRepository;
    }

    /**
     * Obtém todas as transações de um utilizador
     * 
     * Retorna ordenadas por data (mais recentes primeiro)
     * 
     * @param int $utilizadorId ID do utilizador
     * @return array Array com transações formatadas
     */
    public function getTransacoesDoUtilizador(int $utilizadorId): array
    {
        try {
            $transacoes = $this->transacaoRepository->findByUser($utilizadorId);
            $movimentosMetas = $this->metaFinanceiraRepository->listarMovimentosPorUtilizador($utilizadorId);

            $transacoesFormatadas = array_map(function (Transacao $transacao) {
                return [
                    'id' => $transacao->getId(),
                    'utilizador_id' => $transacao->getUtilizadorId(),
                    'categoria_id' => $transacao->getCategoriaId(),
                    'valor' => $transacao->getValor(),
                    'tipo' => $transacao->getTipo(),
                    'data' => $transacao->getData(),
                    'descricao' => $transacao->getDescricao(),
                    'criado_em' => $transacao->getCriadoEm()
                ];
            }, $transacoes);

            foreach ($movimentosMetas as $movimento) {
                $transacoesFormatadas[] = [
                    'id' => 'meta-' . (int)$movimento['id'],
                    'utilizador_id' => (int)$movimento['utilizador_id'],
                    'categoria_id' => null,
                    'valor' => (float)$movimento['valor'],
                    'tipo' => 'poupanca',
                    'data' => substr((string)$movimento['criado_em'], 0, 10),
                    'descricao' => (string)$movimento['descricao'],
                    'criado_em' => (string)$movimento['criado_em'],
                    'meta_id' => (int)$movimento['meta_id'],
                    'meta_titulo' => (string)$movimento['meta_titulo'],
                    'bloqueado' => true
                ];
            }

            usort($transacoesFormatadas, static function (array $a, array $b): int {
                return strcmp((string)($b['criado_em'] ?? $b['data']), (string)($a['criado_em'] ?? $a['data']));
            });

            return $transacoesFormatadas;
        } catch (\Exception $e) {
            error_log('Erro ao obter transações: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Adiciona uma nova transação para o utilizador
     * 
     * Validações:
     * - Valor deve ser estritamente maior que zero
     * - Tipo deve ser exatamente 'receita' ou 'despesa'
     * - Data deve estar no formato Y-m-d
     * 
     * @param int $utilizadorId ID do utilizador
     * @param int $categoriaId ID da categoria
     * @param float $valor Valor da transação
     * @param string $tipo Tipo ('receita' ou 'despesa')
     * @param string $data Data (formato Y-m-d)
     * @param string $descricao Descrição da transação
     * @return bool true em caso de sucesso
     * @throws Exception Se houver erro na validação ou persistência
     */
    public function adicionarTransacao(
        int $utilizadorId,
        int $categoriaId,
        float $valor,
        string $tipo,
        string $data,
        string $descricao
    ): bool {
        try {
            if ($valor <= 0) {
                throw new \Exception('Valor deve ser maior que zero');
            }

            if (!$this->categoriaRepository->belongsToUser($categoriaId, $utilizadorId)) {
                throw new \Exception('Categoria inválida para este utilizador');
            }

            if ($tipo !== 'receita' && $tipo !== 'despesa') {
                throw new \Exception('Tipo deve ser "receita" ou "despesa"');
            }

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
                throw new \Exception('Data deve estar no formato Y-m-d');
            }

            $dataObj = \DateTime::createFromFormat('Y-m-d', $data);
            if ($dataObj === false || $dataObj->format('Y-m-d') !== $data) {
                throw new \Exception('Data inválida');
            }

            $descricao = trim($descricao);
            if ($descricao === '') {
                throw new \Exception('Descrição é obrigatória');
            }

            if ($tipo === 'despesa') {
                $saldoDisponivel = $this->calcularSaldoDisponivel($utilizadorId);
                if ($valor > $saldoDisponivel) {
                    throw new \Exception(sprintf(
                        'Saldo insuficiente. Disponivel para gastar: %.2f. O dinheiro reservado nas metas esta protegido.',
                        $saldoDisponivel
                    ));
                }
            }

            $transacao = new Transacao(
                utilizadorId: $utilizadorId,
                categoriaId: $categoriaId,
                valor: $valor,
                tipo: $tipo,
                data: $data,
                descricao: $descricao
            );

            $resultado = $this->transacaoRepository->create($transacao);

            if (!$resultado) {
                throw new \Exception('Erro ao criar transação na base de dados');
            }

            // Gatilho de alerta financeiro: após inserir despesa, verifica consumo de orçamento.
            if ($tipo === 'despesa') {
                $this->avaliarAlertaOrcamento($utilizadorId, $categoriaId, $data);
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao adicionar transação: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Remove uma transação do utilizador
     * 
     * Por segurança, verifica se a transação pertence ao utilizador especificado.
     * Um utilizador só pode remover suas próprias transações.
     * 
     * @param int $id ID da transação a remover
     * @param int $utilizadorId ID do utilizador (para validação)
     * @return bool true em caso de sucesso, false se transação não existe ou não pertence ao utilizador
     * @throws Exception Se houver erro na operação
     */
    public function removerTransacao(int $id, int $utilizadorId): bool
    {
        try {
            $resultado = $this->transacaoRepository->delete($id, $utilizadorId);

            if (!$resultado) {
                throw new \Exception('Transação não encontrada ou você não tem permissão para removê-la');
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao remover transação: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Edita uma transação existente
     * 
     * Validações:
     * - Valor deve ser estritamente maior que zero
     * - Tipo deve ser 'receita' ou 'despesa'
     * - Data deve estar no formato Y-m-d
     * - Categoria deve pertencer ao utilizador
     * 
     * @param int $id ID da transação a editar
     * @param int $utilizadorId ID do utilizador
     * @param int $categoriaId ID da categoria
     * @param float $valor Novo valor
     * @param string $tipo Novo tipo ('receita' ou 'despesa')
     * @param string $data Nova data (Y-m-d)
     * @param string $descricao Nova descrição
     * @return bool true em caso de sucesso
     * @throws Exception Se houver erro na validação ou persistência
     */
    public function editarTransacao(
        int $id,
        int $utilizadorId,
        int $categoriaId,
        float $valor,
        string $tipo,
        string $data,
        string $descricao
    ): bool {
        try {
            if ($valor <= 0) {
                throw new \Exception('Valor deve ser maior que zero');
            }

            if (!$this->categoriaRepository->belongsToUser($categoriaId, $utilizadorId)) {
                throw new \Exception('Categoria inválida para este utilizador');
            }

            if ($tipo !== 'receita' && $tipo !== 'despesa') {
                throw new \Exception('Tipo deve ser "receita" ou "despesa"');
            }

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data)) {
                throw new \Exception('Data deve estar no formato Y-m-d');
            }

            $dataObj = \DateTime::createFromFormat('Y-m-d', $data);
            if ($dataObj === false || $dataObj->format('Y-m-d') !== $data) {
                throw new \Exception('Data inválida');
            }

            $descricao = trim($descricao);
            if ($descricao === '') {
                throw new \Exception('Descrição é obrigatória');
            }

            $transacaoAtual = $this->transacaoRepository->findById($id);
            if ($transacaoAtual === null || $transacaoAtual->getUtilizadorId() !== $utilizadorId) {
                throw new \Exception('Transação não encontrada ou você não tem permissão para editá-la');
            }

            if ($tipo === 'despesa') {
                $saldoDisponivel = $this->calcularSaldoDisponivel($utilizadorId, $id);
                if ($valor > $saldoDisponivel) {
                    throw new \Exception(sprintf(
                        'Saldo insuficiente. Disponivel para gastar: %.2f. A edição não pode criar dívida.',
                        $saldoDisponivel
                    ));
                }
            }

            $resultado = $this->transacaoRepository->update(
                $id,
                $utilizadorId,
                $categoriaId,
                $valor,
                $tipo,
                $data,
                $descricao
            );

            if (!$resultado) {
                throw new \Exception('Transação não encontrada ou você não tem permissão para editá-la');
            }

            return true;
        } catch (\Exception $e) {
            error_log('Erro ao editar transação: ' . $e->getMessage());
            throw $e;
        }
    }

    private function avaliarAlertaOrcamento(int $utilizadorId, int $categoriaId, string $data): void
    {
        try {
            $dataObj = new \DateTimeImmutable($data);
            $mes = (int)$dataObj->format('n');
            $ano = (int)$dataObj->format('Y');

            $status = $this->orcamentoService->obterStatusPorCategoriaPeriodo($utilizadorId, $categoriaId, $mes, $ano);
            if ($status === null) {
                return;
            }

            $percentual = (float)$status['percentual_consumido'];
            if ($percentual < 85.0) {
                return;
            }

            $titulo = $percentual > 100.0 ? 'Orçamento Excedido' : 'Aviso de Limite Próximo';
            $mensagem = sprintf(
                'A categoria %s atingiu %.2f%% do orçamento (gasto: %.2f de %.2f).',
                (string)$status['categoria'],
                $percentual,
                (float)$status['gasto_atual'],
                (float)$status['limite']
            );

            $this->notificacaoService->criarNotificacao($utilizadorId, $titulo, $mensagem);
        } catch (\Throwable $e) {
            // Não bloqueia criação da transação caso o alerta falhe.
            error_log('Falha ao gerar alerta de orçamento: ' . $e->getMessage());
        }
    }

    private function calcularSaldoDisponivel(int $utilizadorId, ?int $ignorarTransacaoId = null): float
    {
        $transacoes = $this->transacaoRepository->findByUser($utilizadorId);
        $receitas = 0.0;
        $despesas = 0.0;

        foreach ($transacoes as $transacao) {
            if ($ignorarTransacaoId !== null && $transacao->getId() === $ignorarTransacaoId) {
                continue;
            }

            if ($transacao->getTipo() === 'receita') {
                $receitas += $transacao->getValor();
            } elseif ($transacao->getTipo() === 'despesa') {
                $despesas += $transacao->getValor();
            }
        }

        $reservadoMetas = $this->metaFinanceiraRepository->obterTotalReservadoAtivo($utilizadorId);
        return max(0.0, ($receitas - $despesas) - $reservadoMetas);
    }
}
?>
