# Guia Completo de Implantação da VM na Rede Escolar — Menu Solutions (Contador V2)

Este guia explica passo a passo como implantar e operar a Máquina Virtual do **Menu Solutions** em um computador comum dentro da rede de uma escola (ex: SESI/SENAI), garantindo que **duas ou três pessoas consigam acessar a aplicação simultaneamente** sem que a VM precise de um IP exclusivo do roteador da escola.

---

## 1. Por que usar Modo NAT com Redirecionamento de Portas (Port Forwarding)?

Em redes corporativas ou escolares:
* O roteador ou switch central frequentemente possui regras de segurança (como autenticação 802.1x, isolamento de portas ou bloqueio de endereços MAC desconhecidos).
* Por esse motivo, quando uma máquina virtual é configurada no modo tradicional *Bridged* (Placa em Modo Bridge), **ela não recebe endereço IP do roteador da escola**.

### Como funciona a solução com NAT:
1. A VM opera em modo **NAT** (*Network Address Translation*), funcionando sob a proteção do VirtualBox e compartilhando a conexão física e o IP do computador hospedeiro (*host*).
2. Configuramos uma regra de **Redirecionamento de Portas (Port Forwarding)** no VirtualBox:
   * **Porta do Hospedeiro (Host):** `80` (TCP)
   * **Porta da Máquina Virtual (Guest):** `80` (TCP)
3. Quando qualquer pessoa na escola (a inspetora no celular, a nutricionista no notebook ou a diretora na sala da coordenação) digita no navegador o **IP do computador hospedeiro**, o VirtualBox recebe a conexão e repassa instantaneamente para o servidor Nginx dentro da VM.

```
[ Celular Inspetora ] ---\
[ Notebook Nutri    ] ----+--> [ IP do Computador Hospedeiro: 192.168.1.50 ]
[ PC da Direção     ] ---/               │
                                         ▼ (Port Forwarding Porta 80)
                               [ VM Ubuntu - Menu Solutions ]
```

---

## 2. Requisitos Mínimos do Computador Hospedeiro

* **Sistema Operacional:** Windows 10/11 ou Linux.
* **Processador:** Dual-core ou superior com suporte a virtualização ativado na BIOS (Intel VT-x ou AMD-V).
* **Memória RAM:** Mínimo de 4 GB de RAM no computador (a VM consumirá 2 GB).
* **Espaço em Disco:** Cerca de 10 GB livres.
* **VirtualBox:** Versão 7.x instalada ([download oficial](https://www.virtualbox.org/wiki/Downloads)).
* **Terraform (Opcional se usar o método OVA):** Versão 1.5+ instalada.

---

## 3. Método 1: Provisionamento Automático via Terraform

Se você deseja gerar a VM automaticamente utilizando o código de Infraestrutura como Código deste repositório:

### Passo 1: Abrir o terminal PowerShell
Na raiz do repositório, execute o fluxo recomendado:
```powershell
powershell -ExecutionPolicy Bypass -File .\up.ps1
```

O `up.ps1` compila o frontend, inicializa/aplica o Terraform, cria ou inicia a VM, transfere o código e executa o provisionamento interno. Se preferir controlar o Terraform manualmente, navegue até a pasta:
```powershell
cd .\deploy\terraform
```

### Passo 2: Inicializar o Terraform
```powershell
terraform init
```

### Passo 3: Revisar as variáveis (Opcional)
Se desejar alterar parâmetros (como a porta ou quantidade de memória), copie o arquivo de exemplo:
```powershell
copy terraform.tfvars.example terraform.tfvars
```

> [!WARNING]
> **Atenção ao Conflito de Porta 80 no Host:**
> Se o seu computador estiver rodando o Apache do **XAMPP** ou o serviço **IIS** do Windows, a porta 80 já estará ocupada.
> * Opção A: Pause o Apache no Painel de Controle do XAMPP antes de iniciar a VM.
> * Opção B: No arquivo `terraform.tfvars`, altere `host_http_port = 8080`. O acesso passará a ser feito por `http://<IP>:8080`.

### Passo 4: Criar, iniciar e provisionar a VM
```powershell
terraform apply -auto-approve
```
O Terraform cria a máquina virtual no VirtualBox com 2 vCPUs, 2048 MB de RAM, placa de rede em modo NAT e as regras de Port Forwarding das portas 80 e 2222. O provisionamento é executado automaticamente pelo host; não execute `provision-vm.sh` em `/var/www/contador-v2`, pois o script é transferido temporariamente para `/tmp` dentro da VM.

### Passo 5: Validar a instalação
Após o término do `terraform apply`, confirme o estado e o acesso:
```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" showvminfo "MenuSolutions-ContadorV2" --machinereadable | Select-String "VMState|Forwarding"
Invoke-WebRequest http://127.0.0.1 -UseBasicParsing
```

O HTML deve retornar `200` e referenciar assets em `/build/assets/`, nunca `:5173` ou `@vite/client`.

---

## 4. Método 2: Exportar e Importar via Appliance (.OVA) — *Recomendado para a Escola*

Se a máquina onde o sistema vai rodar na escola não tiver Terraform nem acesso para compilar códigos:

### No Computador do Desenvolvedor (Gerando o .OVA):
1. Com a VM criada e configurada, execute o script de exportação:
   ```powershell
   cd c:\Projetos\contador-v2\deploy\terraform
   powershell -ExecutionPolicy Bypass -File .\scripts\export-appliance.ps1
   ```
2. O script gerará o arquivo `deploy/MenuSolutions-ContadorV2.ova`.
3. Copie esse arquivo para um **pendrive**.

### No Computador da Escola (Importando com 2 Cliques):
1. Instale o VirtualBox no computador da escola.
2. Insira o pendrive e abra o VirtualBox.
3. Vá no menu **Arquivo** > **Importar Appliance...** (ou pressione `Ctrl + I`).
4. Selecione o arquivo `MenuSolutions-ContadorV2.ova` e clique em **Próximo** e depois em **Concluir**.
5. **Pronto!** A VM será importada com o disco, sistema operacional, Nginx, Laravel, React e regras de redirecionamento de portas 80 já 100% configuradas.
6. Clique no botão verde **Iniciar** no VirtualBox.

---

## 5. Como Acessar a Aplicação na Escola

### 5.1. No próprio computador onde a VM está rodando:
Abra qualquer navegador (Chrome, Edge, Firefox) e acesse:
```
http://localhost
```
*(ou `http://localhost:8080` se tiver alterado a porta)*

---

### 5.2. Em outros aparelhos na rede da escola (Celular da Inspetora, Notebook da Nutri):
1. No computador onde a VM está rodando, abra o Prompt de Comando (CMD) ou PowerShell e digite:
   ```cmd
   ipconfig
   ```
2. Localize o **Endereço IPv4** do adaptador conectado à rede da escola (ex: `192.168.1.50` ou `10.0.0.12`).
3. Em qualquer celular, tablet ou computador conectado na mesma rede Wi-Fi/cabo da escola, abra o navegador e digite:
   ```
   http://192.168.1.50
   ```
   *(substitua pelo IP real encontrado no passo 2)*

---

## 6. Ajuste de Firewall do Windows (Se Outros Aparelhos Não Conseguirem Acessar)

Por padrão, o Windows Firewall pode bloquear conexões de entrada na porta 80 vindas de outros computadores da rede local.

Para liberar o acesso no computador hospedeiro da escola, abra o **PowerShell como Administrador** e execute:
```powershell
New-NetFirewallRule -DisplayName "Menu Solutions (Porta 80 HTTP)" `
                    -Direction Inbound `
                    -LocalPort 80 `
                    -Protocol TCP `
                    -Action Allow
```

Se tiver configurado a porta alternativa 8080:
```powershell
New-NetFirewallRule -DisplayName "Menu Solutions (Porta 8080 HTTP)" `
                    -Direction Inbound `
                    -LocalPort 8080 `
                    -Protocol TCP `
                    -Action Allow
```

---

## 7. Criar o primeiro gestor

A instalação cria somente o catálogo inicial (categorias, turmas, dias e necessidades). Ela não cria contas E2E, senhas conhecidas nem fatos de demonstração.

Depois que a VM estiver iniciada, entre por SSH a partir do computador hospedeiro:

```powershell
ssh -i .\deploy\cache\vagrant_key -p 2222 vagrant@127.0.0.1
```

Dentro da VM, execute:

```bash
cd /var/www/contador-v2
sudo php artisan app:bootstrap-admin \
  --name="Nome do gestor" \
  --nif="NIF_DO_GESTOR" \
  --email="gestor@escola.local"
```

O comando solicitará a senha em entrada oculta e a confirmação. A senha nunca é exibida no terminal nem gravada em texto. Se o NIF já existir, o comando encerra sem alterar nome, perfil ou credenciais.

Após a criação, o gestor pode cadastrar os demais usuários pela tela de gerenciamento, com senhas individuais.

Os usuários e fatos usados pelos testes automatizados são criados exclusivamente pelo `E2eSeeder` no runtime E2E descartável; não são credenciais de produção.

---

## 8. Rotina Diária de Operação na Escola

1. **Ligar o computador hospedeiro.**
2. **Abrir o VirtualBox** e clicar em **Iniciar** na máquina `MenuSolutions-ContadorV2` (ou deixar configurado para iniciar automaticamente com o Windows).
3. Uma vez iniciada, a VM consome menos de 2 GB de RAM e funciona de forma silenciosa.
4. Os profissionais acessam o sistema via navegador ao longo do dia.
5. Ao final do expediente, se desligar o computador da escola, o VirtualBox salva o estado ou desliga a VM com segurança automaticamente.
