param(
    [string]$VmName = "MenuSolutions-ContadorV2",
    [string]$OutputFile = "..\MenuSolutions-ContadorV2.ova",
    [string]$VBoxManage = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Exportador de Appliance (.OVA) - Menu Solutions         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Localização do VBoxManage
if (-not (Test-Path $VBoxManage)) {
    $cmd = Get-Command VBoxManage -ErrorAction SilentlyContinue
    if ($cmd) {
        $VBoxManage = $cmd.Source
    } else {
        Write-Error "VirtualBox (VBoxManage.exe) não foi encontrado no caminho padrão ou no PATH."
        exit 1
    }
}

# 2. Resolução do caminho de saída
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ResolvedOutput = [System.IO.Path]::GetFullPath((Join-Path $ScriptDir $OutputFile))
$OutputDir = Split-Path -Parent $ResolvedOutput
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# 3. Verificação da VM
$vms = & $VBoxManage list vms
if ($vms -notmatch "`"$VmName`"") {
    Write-Error "A máquina virtual '$VmName' não foi encontrada no VirtualBox. Execute 'terraform apply' antes de exportar."
    exit 1
}

# 4. Verificação do estado (a VM deve estar desligada para exportar)
$vmInfo = & $VBoxManage showvminfo $VmName --machinereadable
$state = ($vmInfo | Select-String '^VMState=' | ForEach-Object { ($_ -split '=')[1].Trim('"') })

if ($state -eq "running") {
    Write-Host "==> VM '$VmName' está em execução. Solicitando desligamento gracioso..." -ForegroundColor Yellow
    & $VBoxManage controlvm $VmName acpipowerbutton 2>$null
    
    $timeout = 30
    while ($timeout -gt 0) {
        Start-Sleep -Seconds 2
        $vmInfo = & $VBoxManage showvminfo $VmName --machinereadable
        $state = ($vmInfo | Select-String '^VMState=' | ForEach-Object { ($_ -split '=')[1].Trim('"') })
        if ($state -eq "poweroff") { break }
        $timeout -= 2
    }

    if ($state -ne "poweroff") {
        Write-Host "==> Forçando desligamento da VM..." -ForegroundColor Yellow
        & $VBoxManage controlvm $VmName poweroff 2>$null
        Start-Sleep -Seconds 2
    }
}

# 5. Exportação do appliance .OVA
Write-Host "==> Exportando appliance para: $ResolvedOutput ..." -ForegroundColor Green
Write-Host "==> Este processo pode levar alguns minutos dependendo do tamanho do disco..." -ForegroundColor Gray

if (Test-Path $ResolvedOutput) {
    Remove-Item $ResolvedOutput -Force
}

& $VBoxManage export $VmName -o $ResolvedOutput --ovf20

if (Test-Path $ResolvedOutput) {
    $sizeMb = [math]::Round(((Get-Item $ResolvedOutput).Length / 1MB), 2)
    Write-Host "`n[SUCESSO] Appliance gerado com êxito!" -ForegroundColor Green
    Write-Host "Arquivo: $ResolvedOutput" -ForegroundColor White
    Write-Host "Tamanho: $sizeMb MB`n" -ForegroundColor White
    Write-Host "Instruções para a Escola:" -ForegroundColor Cyan
    Write-Host "1. Copie o arquivo '$OutputFile' para um pendrive."
    Write-Host "2. No computador da escola (com VirtualBox instalado), abra o VirtualBox."
    Write-Host "3. Clique em 'Arquivo' -> 'Importar Appliance...' e selecione o arquivo .ova."
    Write-Host "4. Clique em 'Concluir'. A VM já virá com a rede NAT e o redirecionamento da porta 80 configurados!"
} else {
    Write-Error "Falha ao exportar a VM. Verifique as mensagens de erro do VirtualBox."
}
