<?php
declare(strict_types=1);

namespace Src\Services;

class SmtpMailer
{
    private string $host;
    private int $port;
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;
    private string $secure;

    public function __construct(
        string $host,
        int $port,
        string $username,
        string $password,
        string $fromEmail,
        string $fromName,
        string $secure = 'tls'
    ) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
        $this->fromEmail = $fromEmail;
        $this->fromName = $fromName;
        $this->secure = $secure;
    }

    public function send(string $to, string $subject, string $body): bool
    {
        $remoteHost = $this->secure === 'ssl' ? 'ssl://' . $this->host : $this->host;
        $socket = @stream_socket_client($remoteHost . ':' . $this->port, $errno, $errstr, 15);
        if (!$socket) {
            throw new \Exception('Falha conexao SMTP: ' . $errstr);
        }

        $this->expect($socket, 220);
        $this->cmd($socket, 'EHLO localhost', 250);

        if ($this->secure === 'tls') {
            $this->cmd($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new \Exception('Falha ao iniciar TLS no SMTP');
            }
            $this->cmd($socket, 'EHLO localhost', 250);
        }

        $this->cmd($socket, 'AUTH LOGIN', 334);
        $this->cmd($socket, base64_encode($this->username), 334);
        $this->cmd($socket, base64_encode($this->password), 235);

        $this->cmd($socket, 'MAIL FROM:<' . $this->fromEmail . '>', 250);
        $this->cmd($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        $this->cmd($socket, 'DATA', 354);

        $headers = [];
        $headers[] = 'From: ' . $this->fromName . ' <' . $this->fromEmail . '>';
        $headers[] = 'To: <' . $to . '>';
        $headers[] = 'Subject: ' . $subject;
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';

        $data = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
        $this->cmd($socket, $data, 250);
        $this->cmd($socket, 'QUIT', 221);

        fclose($socket);
        return true;
    }

    private function cmd($socket, string $command, $expectedCode): void
    {
        fwrite($socket, $command . "\r\n");
        $response = $this->read($socket);
        $code = (int)substr($response, 0, 3);

        $allowed = is_array($expectedCode) ? $expectedCode : [$expectedCode];
        if (!in_array($code, $allowed, true)) {
            throw new \Exception('SMTP erro [' . $code . ']: ' . trim($response));
        }
    }

    private function expect($socket, int $expectedCode): void
    {
        $response = $this->read($socket);
        $code = (int)substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new \Exception('SMTP resposta inesperada [' . $code . ']: ' . trim($response));
        }
    }

    private function read($socket): string
    {
        $data = '';
        while ($line = fgets($socket, 515)) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $data;
    }
}
