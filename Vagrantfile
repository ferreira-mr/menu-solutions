# -*- mode: ruby -*-
# vi: set ft=ruby :

# ==============================================================================
# Menu Solutions (Contador V2) - Vagrantfile para VirtualBox
# Compatível com redes escolares fechadas via NAT e Redirecionamento de Portas
# ==============================================================================

Vagrant.configure("2") do |config|
  # Imagem base oficial do Ubuntu 22.04 LTS
  config.vm.box = "ubuntu/jammy64"

  # Nome da máquina virtual no VirtualBox
  config.vm.provider "virtualbox" do |vb|
    vb.name = "MenuSolutions-ContadorV2"
    vb.cpus = 2
    vb.memory = 2048
    vb.customize ["modifyvm", :id, "--audio-enabled", "off"]
  end

  # Redirecionamento da porta HTTP para a rede da escola:
  # Host :80 -> Guest :80 (acesso direto pelo IP do computador hospedeiro)
  config.vm.network "forwarded_port", guest: 80, host: 80, auto_correct: true

  # Compartilhamento do código do projeto
  config.vm.synced_folder ".", "/var/www/contador-v2", type: "virtualbox", mount_options: ["dmode=775", "fmode=664"]

  # Provisionamento automático da aplicação
  config.vm.provision "shell", path: "deploy/terraform/scripts/provision-vm.sh"
end
