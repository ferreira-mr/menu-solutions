# ==============================================================================
# Menu Solutions (Contador V2) - Infraestrutura VirtualBox via Terraform
# Provisionamento Completo e Autônomo da VM Ubuntu com Nginx, PHP, Laravel e React
# ==============================================================================

# Script de criação, download de imagem base, configuração e provisionamento
resource "local_file" "create_vm_script" {
  filename = "${path.module}/scripts/create_vm_generated.ps1"
  content  = <<-EOT
# Script gerado automaticamente pelo Terraform
$ErrorActionPreference = "Stop"

$VBoxManage = "${replace(var.vbox_manage_path, "\\", "\\\\")}"
if (-not (Test-Path $VBoxManage)) {
    $VBoxCmd = Get-Command VBoxManage -ErrorAction SilentlyContinue
    if ($VBoxCmd) {
        $VBoxManage = $VBoxCmd.Source
    } else {
        Write-Error "Executável VBoxManage não encontrado em '$VBoxManage'."
        exit 1
    }
}

$VmName = "${var.vm_name}"
$Cpus = ${var.cpus}
$MemoryMb = ${var.memory_mb}
$HostHttpPort = ${var.host_http_port}
$GuestHttpPort = ${var.guest_http_port}
$HostSshPort = ${var.host_ssh_port}
$GuestSshPort = ${var.guest_ssh_port}
$Headless = ${var.headless ? "$true" : "$false"}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TerraformDir = Split-Path -Parent $ScriptDir
$DeployDir = Split-Path -Parent $TerraformDir
$RootDir = Split-Path -Parent $DeployDir

$CacheDir = Join-Path $DeployDir "cache"
$BoxFile = Join-Path $CacheDir "ubuntu-jammy.box"
$ExtractedDir = Join-Path $CacheDir "extracted"
$OvfFile = Join-Path $ExtractedDir "box.ovf"
$KeyFile = Join-Path $CacheDir "vagrant_key"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Provisionamento da VM '$VmName' via Terraform           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Garante chaves de acesso SSH e imagem base do Ubuntu
if (-not (Test-Path $CacheDir)) {
    New-Item -ItemType Directory -Path $CacheDir -Force | Out-Null
}

if (-not (Test-Path $KeyFile)) {
    Write-Host "==> Obtendo chave SSH segura para comunicacao com a VM..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/hashicorp/vagrant/master/keys/vagrant" -OutFile $KeyFile
    
    # Ajusta permissões do arquivo da chave no Windows
    $acl = Get-Acl $KeyFile
    $acl.SetAccessRuleProtection($true, $false)
    $user = [System.Security.Principal.NTAccount]$env:USERNAME
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($user, "FullControl", "Allow")
    $acl.SetAccessRule($rule)
    Set-Acl $KeyFile $acl
}

# 2. Verifica se a VM já existe no VirtualBox
$ExistingVms = & $VBoxManage list vms
$VmExists = $ExistingVms -match "`"$VmName`""

if (-not $VmExists) {
    if (-not (Test-Path $OvfFile)) {
        if (-not (Test-Path $BoxFile)) {
            Write-Host "==> Baixando imagem base oficial do Ubuntu 22.04 LTS (Jammy Cloud Image)..." -ForegroundColor Yellow
            curl.exe -L -o $BoxFile "https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64-vagrant.box"
        }
        Write-Host "==> Extraindo appliance virtual..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $ExtractedDir -Force | Out-Null
        tar.exe -xf $BoxFile -C $ExtractedDir
    }

    Write-Host "==> Importando maquina virtual no VirtualBox..." -ForegroundColor Green
    & $VBoxManage import $OvfFile --vsys 0 --vmname $VmName --memory $MemoryMb --cpus $Cpus
} else {
    Write-Host "==> VM '$VmName' ja existe no inventario." -ForegroundColor Yellow
}

# 3. Configuração de Rede NAT e Redirecionamento de Portas para a Rede da Escola
$VBoxInfo = & $VBoxManage showvminfo $VmName --machinereadable
$vmCurrentState = ($VBoxInfo | Select-String '^VMState=' | ForEach-Object { ($_ -split '=')[1].Trim('"') })

if ($vmCurrentState -eq "running") {
    Write-Host "==> VM em execucao. Atualizando regras de portas dinamicamente..." -ForegroundColor Yellow
    try { & $VBoxManage controlvm $VmName natpf1 "http,tcp,,$HostHttpPort,,$GuestHttpPort" 2>$null } catch {}
    try { & $VBoxManage controlvm $VmName natpf1 "ssh,tcp,127.0.0.1,$HostSshPort,,$GuestSshPort" 2>$null } catch {}
} else {
    Write-Host "==> Configurando hardware e rede NAT com Port Forwarding (Host:$HostHttpPort -> VM:$GuestHttpPort)..." -ForegroundColor Green
    & $VBoxManage modifyvm $VmName --cpus $Cpus --memory $MemoryMb --vram 16 --audio-enabled off
    & $VBoxManage modifyvm $VmName --nic1 nat
    try { & $VBoxManage modifyvm $VmName --natpf1 delete "http" 2>$null } catch {}
    try { & $VBoxManage modifyvm $VmName --natpf1 delete "ssh" 2>$null } catch {}
    & $VBoxManage modifyvm $VmName --natpf1 "http,tcp,,$HostHttpPort,,$GuestHttpPort"
    & $VBoxManage modifyvm $VmName --natpf1 "ssh,tcp,127.0.0.1,$HostSshPort,,$GuestSshPort"

    Write-Host "==> Iniciando a maquina virtual..." -ForegroundColor Green
    $StartType = if ($Headless) { "headless" } else { "gui" }
    & $VBoxManage startvm $VmName --type $StartType
}

# 4. Aguarda a inicialização do SSH
Write-Host "==> Aguardando o sistema operacional inicializar o servico SSH..." -ForegroundColor Yellow
$maxAttempts = 30
$sshOnline = $false
while ($maxAttempts -gt 0) {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port $HostSshPort -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($tcp) {
        $sshOnline = $true
        break
    }
    Start-Sleep -Seconds 2
    $maxAttempts--
    Write-Host "." -NoNewline -ForegroundColor Gray
}
Write-Host ""

if (-not $sshOnline) {
    Write-Error "Tempo limite esgotado aguardando o servico SSH da VM."
    exit 1
}

# 5. Empacotamento e Sincronização do Código da Aplicação
Write-Host "==> Empacotando codigo do Menu Solutions (com assets compilados)..." -ForegroundColor Yellow
$AppCodeTar = Join-Path $CacheDir "app_code.tar.gz"
tar.exe -czf $AppCodeTar --exclude=node_modules --exclude=.git --exclude=deploy/cache --exclude=coverage -C $RootDir app bootstrap config database public resources routes storage composer.json package.json .env.example artisan

Write-Host "==> Transferindo codigo e scripts de provisionamento para a VM..." -ForegroundColor Yellow
scp.exe -i $KeyFile -P $HostSshPort -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $AppCodeTar "vagrant@127.0.0.1:/tmp/app_code.tar.gz"
scp.exe -i $KeyFile -P $HostSshPort -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL (Join-Path $ScriptDir "provision-vm.sh") "vagrant@127.0.0.1:/tmp/provision-vm.sh"
scp.exe -i $KeyFile -P $HostSshPort -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL (Join-Path $ScriptDir "nginx-menu.conf") "vagrant@127.0.0.1:/tmp/nginx-menu.conf"

# 6. Execução do Provisionamento (Nginx, PHP 8.3, Composer, Migrations, Seeders)
Write-Host "==> Executando instalacao e configuracao dos servicos dentro do Ubuntu..." -ForegroundColor Yellow
ssh.exe -i $KeyFile -p $HostSshPort -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL vagrant@127.0.0.1 "sudo bash /tmp/provision-vm.sh"

Write-Host "`n[SUCESSO] VM '$VmName' provisionada e pronta para operacao!" -ForegroundColor Green
EOT
}

# Script de destruição/limpeza segura da VM
resource "local_file" "destroy_vm_script" {
  filename = "${path.module}/scripts/destroy_vm_generated.ps1"
  content  = <<-EOT
# Script gerado automaticamente pelo Terraform para remoção da VM
$ErrorActionPreference = "Continue"

$VBoxManage = "${replace(var.vbox_manage_path, "\\", "\\\\")}"
if (-not (Test-Path $VBoxManage)) {
    $VBoxCmd = Get-Command VBoxManage -ErrorAction SilentlyContinue
    if ($VBoxCmd) { $VBoxManage = $VBoxCmd.Source }
}

$VmName = "${var.vm_name}"

Write-Host "==> Parando e removendo VM '$VmName'..."
& $VBoxManage controlvm $VmName poweroff 2>$null
Start-Sleep -Seconds 2
& $VBoxManage unregistervm $VmName --delete 2>$null
Write-Host "==> VM '$VmName' removida com sucesso."
EOT
}

# Recurso Terraform que orquestra a criação, provisionamento e destruição
resource "null_resource" "virtualbox_vm" {
  triggers = {
    vm_name         = var.vm_name
    cpus            = var.cpus
    memory_mb       = var.memory_mb
    host_http_port  = var.host_http_port
    guest_http_port = var.guest_http_port
    script_hash     = sha256(local_file.create_vm_script.content)
  }

  provisioner "local-exec" {
    command     = "& '${replace(local_file.create_vm_script.filename, "\\", "/")}'"
    interpreter = ["PowerShell", "-ExecutionPolicy", "Bypass", "-Command"]
  }

  provisioner "local-exec" {
    when        = destroy
    command     = "& '${replace(path.module, "\\", "/")}/scripts/destroy_vm_generated.ps1'"
    interpreter = ["PowerShell", "-ExecutionPolicy", "Bypass", "-Command"]
  }

  depends_on = [
    local_file.create_vm_script,
    local_file.destroy_vm_script
  ]
}
