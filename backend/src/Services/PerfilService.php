<?php
declare(strict_types=1);

namespace Src\Services;

use Src\Repositories\UsuarioRepository;

class PerfilService
{
    private const MAX_AVATAR_SIZE = 2097152; // 2MB
    private const ALLOWED_MOEDAS = ['AOA', 'EUR', 'USD', 'GBP'];

    private UsuarioRepository $usuarioRepository;
    private string $avatarUploadDir;
    private string $avatarPublicBasePath;

    public function __construct(UsuarioRepository $usuarioRepository, string $avatarUploadDir, string $avatarPublicBasePath = '/uploads/avatars')
    {
        $this->usuarioRepository = $usuarioRepository;
        $this->avatarUploadDir = rtrim($avatarUploadDir, DIRECTORY_SEPARATOR);
        $this->avatarPublicBasePath = rtrim($avatarPublicBasePath, '/');
    }

    /**
     * @param int $utilizadorId
     * @param array<string, mixed> $input
     * @param array<string, mixed>|null $avatarFile
     * @return array<string, mixed>
     */
    public function atualizarPerfil(int $utilizadorId, array $input, ?array $avatarFile): array
    {
        $dadosAtualizacao = [];

        if ($avatarFile !== null && (($avatarFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE)) {
            $dadosAtualizacao['avatar_url'] = $this->processarAvatar($avatarFile);
        }

        if (isset($input['moeda_preferida']) && $input['moeda_preferida'] !== '') {
            $moeda = strtoupper(trim((string)$input['moeda_preferida']));
            if (!in_array($moeda, self::ALLOWED_MOEDAS, true)) {
                throw new \InvalidArgumentException('moeda_preferida invalida. Permitidas: AOA, EUR, USD, GBP');
            }
            $dadosAtualizacao['moeda_preferida'] = $moeda;
        }

        if (array_key_exists('telefone', $input)) {
            $telefone = trim((string)$input['telefone']);
            $dadosAtualizacao['telefone'] = $telefone === '' ? null : $telefone;
        }

        if (isset($input['language']) && $input['language'] !== '') {
            $idioma = trim((string)$input['language']);
            if (!in_array($idioma, ['pt-BR', 'en-US'], true)) {
                throw new \InvalidArgumentException('Idioma invalido. Permitidos: pt-BR, en-US');
            }
            $dadosAtualizacao['idioma_preferido'] = $idioma;
        }

        if (isset($input['theme']) && $input['theme'] !== '') {
            $tema = trim((string)$input['theme']);
            if (!in_array($tema, ['dark', 'light', 'system'], true)) {
                throw new \InvalidArgumentException('Tema invalido. Permitidos: dark, light, system');
            }
            $dadosAtualizacao['tema_preferido'] = $tema;
        }

        if ($dadosAtualizacao === []) {
            throw new \InvalidArgumentException('Nenhum dado valido foi enviado para atualizacao de perfil');
        }

        $atualizado = $this->usuarioRepository->atualizarPerfil($utilizadorId, $dadosAtualizacao);
        if (!$atualizado) {
            throw new \RuntimeException('Falha ao atualizar perfil do utilizador');
        }

        $usuario = $this->usuarioRepository->findById($utilizadorId);
        if ($usuario === null) {
            throw new \RuntimeException('Utilizador nao encontrado apos atualizacao');
        }

        return $this->mapearPerfil($usuario);
    }

    public function obterPerfil(int $utilizadorId): array
    {
        $usuario = $this->usuarioRepository->findById($utilizadorId);
        if ($usuario === null) {
            throw new \RuntimeException('Utilizador nao encontrado');
        }

        return $this->mapearPerfil($usuario);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapearPerfil(\Src\Models\Usuario $usuario): array
    {
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

    /**
     * @param array<string, mixed> $avatarFile
     */
    private function processarAvatar(array $avatarFile): string
    {
        $erro = (int)($avatarFile['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($erro !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('Falha no upload do avatar');
        }

        $tmpName = (string)($avatarFile['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new \InvalidArgumentException('Ficheiro de avatar invalido');
        }

        $size = (int)($avatarFile['size'] ?? 0);
        if ($size <= 0 || $size > self::MAX_AVATAR_SIZE) {
            throw new \InvalidArgumentException('Avatar excede o limite de 2MB');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($tmpName);

        $extensoesPermitidas = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        if ($mime === false || !isset($extensoesPermitidas[$mime])) {
            throw new \InvalidArgumentException('Formato de avatar invalido. Permitido: JPG, PNG, WEBP');
        }

        if (!is_dir($this->avatarUploadDir) && !mkdir($this->avatarUploadDir, 0755, true) && !is_dir($this->avatarUploadDir)) {
            throw new \RuntimeException('Nao foi possivel criar diretorio de avatars');
        }

        $extensao = $extensoesPermitidas[$mime];
        $nomeAnonimizado = md5((string)microtime(true) . bin2hex(random_bytes(16))) . '.' . $extensao;
        $destino = $this->avatarUploadDir . DIRECTORY_SEPARATOR . $nomeAnonimizado;

        if (!move_uploaded_file($tmpName, $destino)) {
            throw new \RuntimeException('Nao foi possivel guardar o avatar no servidor');
        }

        return $this->avatarPublicBasePath . '/' . $nomeAnonimizado;
    }
}
?>
