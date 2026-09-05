# Guia de Implantação, Configuração e Deploy

Este documento fornece as instruções técnicas detalhadas para instalação, configuração e implantação da plataforma **Menu Solutions** (versão 2) em ambiente de servidor local da escola ou servidor em nuvem.

---

## 1. Requisitos do Sistema e Ambiente

### 1.1. Servidor Back-End (API)
* **Sistema Operacional:** Linux (Debian 11/12, Ubuntu 22.04 LTS) ou Windows Server.
* **PHP:** Versão **8.2 ou superior** com as extensões ativas:
  * `php-cli`, `php-mysql`, `php-mbstring`, `php-xml`, `php-curl`, `php-zip`, `php-gd`, `php-bcmath`.
* **Gerenciador de Dependências:** **Composer 2.x**.
* **Banco de Dados:** **MariaDB 10.6+** ou **MySQL 8.0+**.
* **Servidor Web:** **Nginx** (recomendado para produção) ou **Apache 2.4** com módulo `mod_rewrite` ativado.

### 1.2. Servidor Front-End (Client SPA)
* **Ambiente de Build:** **Node.js 18+** e **NPM / Yarn**.
* **Servidor Estático:** Nginx, Apache ou qualquer web server HTTP estático.

---

## 2. Implantação do Banco de Dados (`cont_v2`)

1. Crie uma base de dados limpa com codificação `utf8mb4` no MariaDB/MySQL:
   ```sql
   CREATE DATABASE cont_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'menu_user'@'localhost' IDENTIFIED BY 'SenhaForteBanco2025!';
   GRANT ALL PRIVILEGES ON cont_v2.* TO 'menu_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. Importe o dump relacional de produção fornecido no repositório:
   ```bash
   mysql -u menu_user -p cont_v2 < "cont_v2 (1).sql"
   ```

---

## 3. Configuração do Back-End API (Laravel)

1. Clone o repositório oficial da API:
   ```bash
   git clone https://github.com/cesaraugustooo/cont_api_v2.git /var/www/cont_api_v2
   cd /var/www/cont_api_v2
   ```
2. Instale as dependências do ecossistema PHP:
   ```bash
   composer install --no-dev --optimize-autoloader
   ```
3. Configure o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Edite o `.env` com os parâmetros do banco de dados e URL da aplicação:
   ```ini
   APP_NAME="Menu Solutions API"
   APP_ENV=production
   APP_KEY=
   APP_DEBUG=false
   APP_URL=http://api.cardapio.local

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=cont_v2
   DB_USERNAME=menu_user
   DB_PASSWORD=SenhaForteBanco2025!

   SANCTUM_STATEFUL_DOMAINS=app.cardapio.local
   SESSION_DRIVER=database
   ```
5. Gere a chave criptográfica da aplicação:
   ```bash
   php artisan key:generate
   ```
6. Crie o link simbólico para o armazenamento público de imagens (fotos de alunos e cardápios):
   ```bash
   php artisan storage:link
   ```
7. Ajuste as permissões de escrita para o usuário do servidor web (`www-data` no Linux):
   ```bash
   chown -R www-data:www-data /var/www/cont_api_v2/storage /var/www/cont_api_v2/bootstrap/cache
   chmod -R 775 /var/www/cont_api_v2/storage /var/www/cont_api_v2/bootstrap/cache
   ```

---

## 4. Configuração do Front-End (Client SPA)

1. Clone o repositório da interface do usuário:
   ```bash
   git clone https://github.com/andresantanadev/Contador-de-Aluno-SESI-SENAI.git /var/www/menu_frontend
   cd /var/www/menu_frontend
   ```
2. Configure o arquivo de ambiente apontando para a URL da API Laravel:
   ```ini
   VITE_API_BASE_URL=http://api.cardapio.local/api
   ```
3. Instale os pacotes e realize o build de produção:
   ```bash
   npm install
   npm run build
   ```
4. Os arquivos estáticos compilados gerados no diretório `dist/` (ou `build/`) devem ser servidos pelo Nginx/Apache.

---

## 5. Configuração do Virtual Host no Nginx (Exemplo de Produção Local)

```nginx
# Bloco 1: Back-End API (Laravel)
server {
    listen 80;
    server_name api.cardapio.local;
    root /var/www/cont_api_v2/public;
    index index.php;

    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}

# Bloco 2: Front-End SPA (Client Web)
server {
    listen 80;
    server_name app.cardapio.local;
    root /var/www/menu_frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. Rotinas de Manutenção e Backup

* **Backup Diário do Banco de Dados:**
  Recomenda-se agendar via `cron` uma rotina diária às 18:00 (após o término das aulas):
  ```bash
  mysqldump -u menu_user -p'SenhaForteBanco2025!' cont_v2 | gzip > /backups/cont_v2_$(date +\%F).sql.gz
  ```
* **Limpeza de Cache do Laravel:**
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```
