variable "vm_name" {
  type        = string
  description = "Nome identificador da Máquina Virtual no VirtualBox"
  default     = "MenuSolutions-ContadorV2"
}

variable "os_type" {
  type        = string
  description = "Tipo de sistema operacional no VirtualBox (ex: Ubuntu_64, Debian_64)"
  default     = "Ubuntu_64"
}

variable "cpus" {
  type        = number
  description = "Quantidade de vCPUs para a VM (recomendado 2 para 2-3 usuários)"
  default     = 2
}

variable "memory_mb" {
  type        = number
  description = "Quantidade de memória RAM em megabytes (recomendado 2048 MB)"
  default     = 2048
}

variable "disk_size_mb" {
  type        = number
  description = "Tamanho do disco virtual dinâmico VDI em megabytes (padrão 25 GB)"
  default     = 25600
}

variable "host_http_port" {
  type        = number
  description = "Porta HTTP na máquina hospedeira que redirecionará para a porta 80 da VM (padrão 80. Se o Apache/XAMPP estiver ativo, use 8080)"
  default     = 80
}

variable "guest_http_port" {
  type        = number
  description = "Porta HTTP interna na VM onde o Nginx escuta (padrão 80)"
  default     = 80
}

variable "host_ssh_port" {
  type        = number
  description = "Porta SSH na máquina hospedeira para administração (padrão 2222)"
  default     = 2222
}

variable "guest_ssh_port" {
  type        = number
  description = "Porta SSH interna na VM (padrão 22)"
  default     = 22
}

variable "iso_path" {
  type        = string
  description = "Caminho opcional para a imagem ISO de instalação do Ubuntu Server (deixe vazio se não for anexar ISO)"
  default     = ""
}

variable "existing_disk_path" {
  type        = string
  description = "Caminho opcional para um disco VDI já existente. Se vazio, um novo disco VDI será criado automaticamente."
  default     = ""
}

variable "vbox_manage_path" {
  type        = string
  description = "Caminho para o executável VBoxManage"
  default     = "C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe"
}

variable "auto_start" {
  type        = bool
  description = "Inicia a máquina virtual automaticamente após a criação e configuração"
  default     = false
}

variable "headless" {
  type        = bool
  description = "Inicia a VM em modo headless (segundo plano sem janela GUI)"
  default     = true
}
