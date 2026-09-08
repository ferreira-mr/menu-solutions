#!/usr/bin/env bash
# ==============================================================================
# Script de Provisionamento Interno da VM Ubuntu - Menu Solutions (Contador V2)
# Instala Nginx, PHP 8.3, SQLite, Composer, configura banco e ativa serviços.
# ==============================================================================

set -e

export DEBIAN_FRONTEND=noninteractive

echo "=========================================================="
echo "  Iniciando provisionamento do Menu Solutions na VM...   "
echo "=========================================================="

# 1. Atualização dos repositórios
echo "==> Atualizando pacotes do sistema..."
apt-get update -y
apt-get install -y software-properties-common curl wget git unzip sqlite3 ca-certificates gnupg lsb-release

# 2. Repositório PPA do PHP para obter PHP 8.3 atualizado
echo "==> Configurando repositório PHP 8.3..."
add-apt-repository -y ppa:ondrej/php
apt-get update -y

PHP_VER="8.3"
echo "==> Instalando Nginx e PHP $PHP_VER..."
apt-get install -y nginx \
    php${PHP_VER}-fpm \
    php${PHP_VER}-cli \
    php${PHP_VER}-common \
    php${PHP_VER}-sqlite3 \
    php${PHP_VER}-mysql \
    php${PHP_VER}-mbstring \
    php${PHP_VER}-xml \
    php${PHP_VER}-curl \
    php${PHP_VER}-zip \
    php${PHP_VER}-gd \
    php${PHP_VER}-bcmath \
    php${PHP_VER}-intl

# Cria link canônico para o socket do PHP-FPM
ln -sf /run/php/php${PHP_VER}-fpm.sock /run/php/php-fpm.sock

# 3. Instalação do Composer
if ! command -v composer &> /dev/null; then
    echo "==> Instalando Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# 4. Diretório da Aplicação
APP_DIR="/var/www/contador-v2"
echo "==> Preparando diretório $APP_DIR..."
mkdir -p "$APP_DIR"

if [ -f "/tmp/app_code.tar.gz" ]; then
    echo "==> Extraindo código da aplicação transferido do host..."
    tar -xzf /tmp/app_code.tar.gz -C "$APP_DIR"
elif [ ! -f "$APP_DIR/artisan" ]; then
    echo "==> Clonando repositório oficial..."
    git clone https://github.com/andresantanadev/Contador-de-Aluno-SESI-SENAI.git "$APP_DIR" || true
fi

cd "$APP_DIR"

# 5. Configuração do arquivo .env
echo "==> Configurando arquivo .env de produção..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

sed -i 's/^APP_ENV=.*/APP_ENV=production/' "$APP_DIR/.env"
sed -i 's/^APP_DEBUG=.*/APP_DEBUG=false/' "$APP_DIR/.env"
sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=sqlite/' "$APP_DIR/.env"
sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=database/' "$APP_DIR/.env"

# Garante o arquivo de banco SQLite
mkdir -p "$APP_DIR/database"
touch "$APP_DIR/database/database.sqlite"

# 6. Instalação de dependências PHP
echo "==> Instalando dependências PHP via Composer..."
composer install --no-dev --optimize-autoloader --no-interaction

# 7. Execução das tarefas do Artisan
echo "==> Configurando banco de dados e caches do Laravel..."
php artisan key:generate --force
php artisan storage:link || true
php artisan migrate --force
# O catálogo é seguro para a instalação; contas e fatos de demonstração não entram na VM.
php artisan db:seed --class=CatalogSeeder --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Permissões de escrita para o Nginx/PHP-FPM
echo "==> Ajustando permissões de www-data..."
chown -R www-data:www-data "$APP_DIR"
find "$APP_DIR/storage" -type d -exec chmod 775 {} \;
find "$APP_DIR/storage" -type f -exec chmod 664 {} \;
find "$APP_DIR/bootstrap/cache" -type d -exec chmod 775 {} \;
find "$APP_DIR/bootstrap/cache" -type f -exec chmod 664 {} \;
chmod 775 "$APP_DIR/database"
chmod 664 "$APP_DIR/database/database.sqlite"

# 9. Configuração do VirtualHost no Nginx
echo "==> Configurando servidor Nginx..."
if [ -f "/tmp/nginx-menu.conf" ]; then
    cp /tmp/nginx-menu.conf /etc/nginx/sites-available/contador-v2
elif [ -f "$APP_DIR/deploy/terraform/scripts/nginx-menu.conf" ]; then
    cp "$APP_DIR/deploy/terraform/scripts/nginx-menu.conf" /etc/nginx/sites-available/contador-v2
else
    cat << 'NGINX_EOF' > /etc/nginx/sites-available/contador-v2
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/contador-v2/public;
    index index.php index.html;
    client_max_body_size 25M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ^~ /uploads/pdf/ {
        try_files $uri =404;
    }

    location ^~ /uploads/ {
        return 404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINX_EOF
fi

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/contador-v2 /etc/nginx/sites-enabled/contador-v2

nginx -t
systemctl restart nginx
systemctl restart php${PHP_VER}-fpm
systemctl enable nginx
systemctl enable php${PHP_VER}-fpm

echo "=========================================================="
echo "  Menu Solutions provisionado com sucesso!               "
echo "  Aplicação ativa na porta 80.                           "
echo "=========================================================="
