@echo off
setlocal
echo ==============================================================================
echo   Menu Solutions (Contador V2) - Subindo aplicacao com Terraform + VirtualBox
echo ==============================================================================
powershell.exe -ExecutionPolicy Bypass -File "%~dp0up.ps1" %*
