<?php
declare(strict_types=1);

namespace Src\Services;

/**
 * Serviço de JWT (JSON Web Tokens)
 * 
 * Implementação nativa de JWT em PHP Puro usando funções nativas:
 * - hash_hmac() para assinatura HMAC-SHA256
 * - Base64Url encoding/decoding
 * - json_encode()/json_decode() para serialização
 * 
 * Estrutura do JWT: header.payload.signature
 * 
 * @package Src\Services
 */
class JwtService
{
    /**
     * Chave secreta para assinatura dos tokens
     * Deve ser alterada em produção para um valor seguro e aleatório
     */
    private const SECRET_KEY = 'sua_chave_secreta_muito_segura_aqui_mudar_em_producao';

    /**
     * Algoritmo de assinatura
     */
    private const ALGORITHM = 'HS256';

    /**
     * Tempo de expiração do token em segundos (2 horas)
     */
    private const EXPIRATION_TIME = 7200;

    /**
     * Gera um token JWT com base nos dados do utilizador
     * 
     * O token contém:
     * - Header: algoritmo (HS256) e tipo (JWT)
     * - Payload: dados do utilizador + expiração
     * - Signature: HMAC-SHA256 assinado com a chave secreta
     * 
     * @param array $payload Dados do utilizador (id, email, tipo_usuario_id, etc)
     * @return string Token JWT completo (formato: header.payload.signature)
     * @throws Exception Se houver erro na geração
     */
    public function generateToken(array $payload): string
    {
        try {
            $header = [
                'alg' => self::ALGORITHM,
                'typ' => 'JWT'
            ];

            $payload['exp'] = time() + self::EXPIRATION_TIME;
            $payload['iat'] = time();

            $headerEncoded = $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE));
            $payloadEncoded = $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));

            $signatureInput = $headerEncoded . '.' . $payloadEncoded;

            $signature = hash_hmac(
                'sha256',
                $signatureInput,
                self::SECRET_KEY,
                true
            );

            $signatureEncoded = $this->base64UrlEncode($signature);

            $token = $signatureInput . '.' . $signatureEncoded;

            return $token;
        } catch (\Exception $e) {
            error_log('Erro ao gerar token JWT: ' . $e->getMessage());
            throw new \Exception('Erro ao gerar token JWT: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Valida um token JWT recebido
     * 
     * Verifica:
     * 1. Se o token tem o formato correto (3 partes separadas por ponto)
     * 2. Se a assinatura é válida
     * 3. Se o token não expirou
     * 
     * @param string $token Token JWT a validar
     * @return array|null Retorna o payload decodificado se válido, null se inválido/expirado
     */
    public function validateToken(string $token): ?array
    {
        try {
            $parts = explode('.', $token);

            if (count($parts) !== 3) {
                error_log('Token JWT inválido: formato incorreto');
                return null;
            }

            list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

            $signatureInput = $headerEncoded . '.' . $payloadEncoded;

            $signatureExpected = hash_hmac(
                'sha256',
                $signatureInput,
                self::SECRET_KEY,
                true
            );

            $signatureExpectedEncoded = $this->base64UrlEncode($signatureExpected);

            if (!hash_equals($signatureExpectedEncoded, $signatureEncoded)) {
                error_log('Token JWT inválido: assinatura incorreta');
                return null;
            }

            $payloadDecoded = json_decode(
                $this->base64UrlDecode($payloadEncoded),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            if ($payloadDecoded === null) {
                error_log('Token JWT inválido: payload não pode ser decodificado');
                return null;
            }

            if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
                error_log('Token JWT expirado');
                return null;
            }

            return $payloadDecoded;
        } catch (\Exception $e) {
            error_log('Erro ao validar token JWT: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Extrai o token do header Authorization
     * 
     * Esperado formato: "Bearer <token>"
     * 
     * @return string|null Token extraído ou null se não encontrado
     */
    public function getTokenFromHeader(): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (empty($authHeader)) {
            return null;
        }

        $parts = explode(' ', $authHeader);

        if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
            return null;
        }

        return $parts[1];
    }

    /**
     * Codifica uma string para Base64Url
     * 
     * Diferenças do Base64 padrão:
     * - '+' é substituído por '-'
     * - '/' é substituído por '_'
     * - '=' (padding) é removido
     * 
     * @param string $data Dados a codificar
     * @return string String codificada em Base64Url
     */
    private function base64UrlEncode(string $data): string
    {
        $base64 = base64_encode($data);

        $base64Url = str_replace(
            ['+', '/', '='],
            ['-', '_', ''],
            $base64
        );

        return $base64Url;
    }

    /**
     * Decodifica uma string Base64Url
     * 
     * @param string $data String codificada em Base64Url
     * @return string String decodificada
     */
    private function base64UrlDecode(string $data): string
    {
        $base64 = str_replace(
            ['-', '_'],
            ['+', '/'],
            $data
        );

        $padding = (4 - (strlen($base64) % 4)) % 4;
        $base64 .= str_repeat('=', $padding);

        return base64_decode($base64, true) ?: '';
    }

    /**
     * Obtém o tempo de expiração configurado (em segundos)
     * 
     * @return int
     */
    public static function getExpirationTime(): int
    {
        return self::EXPIRATION_TIME;
    }
}
?>
