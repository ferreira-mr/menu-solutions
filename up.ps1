# ==============================================================================
# Menu Solutions (Contador V2) - Script de Inicialização Completa (Up)
# Compila assets, executa o Terraform, sobe a VM no VirtualBox e valida a aplicação
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Menu Solutions (Contador V2) - Inicializacao Automatica " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

# 1. Compilação dos assets de produção com Vite
Write-Host "`n==> Passo 1: Compilando assets do Front-End (Vite)..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias npm..." -ForegroundColor Gray
    npm install --no-audit
}
npm run build

# 2. Localização do executável Terraform
$TerraformPath = "C:\Users\ferreira-mr\AppData\Local\Microsoft\WinGet\Packages\Hashicorp.Terraform_Microsoft.Winget.Source_8wekyb3d8bbwe\terraform.exe"
if (-not (Test-Path $TerraformPath)) {
    $cmd = Get-Command terraform -ErrorAction SilentlyContinue
    if ($cmd) {
        $TerraformPath = $cmd.Source
    } else {
        Write-Error "Terraform não encontrado no sistema. Verifique a instalação."
        exit 1
    }
}

# 3. Execução do Terraform
Write-Host "`n==> Passo 2: Inicializando e aplicando Terraform..." -ForegroundColor Yellow
$DeployDir = Join-Path $RootDir "deploy\terraform"

& $TerraformPath -chdir="$DeployDir" init -upgrade
& $TerraformPath -chdir="$DeployDir" apply -auto-approve

# 4. Verificação de Saúde da Aplicação
Write-Host "`n==> Passo 3: Verificando disponibilidade da aplicacao..." -ForegroundColor Yellow
$HostPort = 80
try {
    $tfVars = Get-Content (Join-Path $DeployDir "terraform.tfvars") -ErrorAction SilentlyContinue
    $portLine = $tfVars | Select-String 'host_http_port\s*=\s*([0-9]+)'
    if ($portLine) {
        $HostPort = [int]($portLine.Matches[0].Groups[1].Value)
    }
} catch {}

$TestUrl = if ($HostPort -eq 80) { "http://127.0.0.1" } else { "http://127.0.0.1:$HostPort" }
Write-Host "Aguardando resposta HTTP em $TestUrl..." -ForegroundColor Gray

$MaxRetries = 15
$Online = $false

while ($MaxRetries -gt 0) {
    try {
        $res = Invoke-WebRequest -Uri $TestUrl -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400) {
            $Online = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 3
    $MaxRetries--
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
if ($Online) {
    if ($res.Content -match '5173|@vite/client|resources/(css|js)/') {
        Write-Error "A aplicação respondeu, mas está apontando para o Vite de desenvolvimento. Remova public/hot e execute o deploy novamente."
    }
    if ($res.Content -notmatch '/build/assets/') {
        Write-Error "A aplicação respondeu, mas não entregou os assets compilados de produção em /build/assets/."
    }
    Write-Host "`n[SUCESSO] O Menu Solutions esta no ar e pronto para uso!" -ForegroundColor Green
} else {
    Write-Host "`n[AVISO] A VM esta rodando, mas a aplicacao ainda pode estar finalizando os servicos internos." -ForegroundColor Yellow
}

# 5. Obtém o IP da máquina hospedeira para acesso na rede da escola
$HostIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|vEthernet|VirtualBox" -and $_.IPAddress -notmatch "^169\.254\." } | Select-Object -First 1).IPAddress
$SchoolUrl = if ($HostPort -eq 80) { "http://$HostIp" } else { "http://${HostIp}:$HostPort" }

Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
Write-Host "Acesso no proprio computador: $TestUrl" -ForegroundColor White
Write-Host "Acesso pelos demais na escola: $SchoolUrl" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
