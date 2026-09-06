output "vm_name" {
  description = "Nome da máquina virtual no VirtualBox"
  value       = var.vm_name
}

output "acesso_local_host" {
  description = "URL para acessar a aplicação a partir do próprio computador onde a VM está rodando"
  value       = var.host_http_port == 80 ? "http://localhost" : "http://localhost:${var.host_http_port}"
}

output "acesso_rede_escolar" {
  description = "Instrução de acesso para os demais computadores, tablets ou celulares na rede da escola"
  value       = var.host_http_port == 80 ? "http://<IP_DO_COMPUTADOR_HOSPEDEIRO> (obtenha via 'ipconfig' no Windows)" : "http://<IP_DO_COMPUTADOR_HOSPEDEIRO>:${var.host_http_port}"
}

output "conexao_ssh" {
  description = "Comando para conectar via SSH na VM a partir do host"
  value       = "ssh -p ${var.host_ssh_port} <usuario_ubuntu>@127.0.0.1"
}

output "redirecionamento_portas" {
  description = "Mapeamento das portas NAT configuradas"
  value = {
    http = "Host :${var.host_http_port} -> VM :${var.guest_http_port}"
    ssh  = "Host 127.0.0.1:${var.host_ssh_port} -> VM :${var.guest_ssh_port}"
  }
}

output "dica_exportacao_ova" {
  description = "Como exportar esta VM para um arquivo .OVA pronto para levar em pendrive"
  value       = "Execute: powershell -ExecutionPolicy Bypass -File .\\scripts\\export-appliance.ps1"
}
